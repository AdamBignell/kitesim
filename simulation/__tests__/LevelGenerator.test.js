import LevelGenerator from '../src/game/LevelGenerator';
import * as Phaser from 'phaser';
import PlayerCapabilities from '../src/game/generation/PlayerCapabilitiesProfile';
import Physics from '../src/game/generation/Physics';
import Grid from '../src/game/generation/Grid';

describe('LevelGenerator', () => {
  let scene;
  let pcp;
  let physics;

  beforeEach(() => {
    const children = [];
    const staticGroup = {
      add: jest.fn((child) => children.push(child)),
      getChildren: jest.fn(() => children),
      clear: jest.fn(() => { children.length = 0; }),
    };

    scene = {
      physics: {
        add: {
          staticGroup: jest.fn().mockReturnValue(staticGroup),
          existing: jest.fn(),
        },
      },
      add: {
        tileSprite: jest.fn().mockImplementation((x, y, w, h, key) => ({
          x, y, width: w, height: h, texture: key,
          setOrigin: jest.fn(),
        })),
      },
    };
    pcp = new PlayerCapabilities({
        runSpeed: 300,
        gravity: 500,
        jumpVelocity: 350,
        wallSlideSpeed: 100,
        wallJumpVelocity: { x: 200, y: 200 },
    });
    physics = new Physics(pcp);
  });

  it('should be an instance of LevelGenerator', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    expect(levelGenerator).toBeInstanceOf(LevelGenerator);
  });

  it('should generate different chunks on each call', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    const chunkSize = 32;
    const tileSize = 16;

    // Generate the first chunk
    const chunk1 = levelGenerator.generateChunk(0, 0, chunkSize, tileSize);
    const children1 = [...chunk1.getChildren()]; // Make a copy
    chunk1.clear(); // Clear the children array for the next generation

    // Generate the second chunk
    const chunk2 = levelGenerator.generateChunk(0, 0, chunkSize, tileSize);
    const children2 = [...chunk2.getChildren()];

    // There's a very small chance the two could be identical, but it's
    // astronomically unlikely.
    expect(children1.length).toBeGreaterThan(0);
    expect(children2.length).toBeGreaterThan(0);
    expect(children1).not.toEqual(children2);
  });

  it('should generate traversable terrain', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    const chunkSize = 32;
    const tileSize = 16;

    const { platforms, spawnPoint } = levelGenerator.generateInitialChunkAndSpawnPoint(chunkSize, tileSize);
    const grid = new Grid(chunkSize, chunkSize, 0);

    platforms.getChildren().forEach(p => {
        const startX = Math.floor(p.x / tileSize);
        const startY = Math.floor(p.y / tileSize);
        const numX = Math.floor(p.width / tileSize);
        const numY = Math.floor(p.height / tileSize);
        for(let i=0; i<numX; i++) {
            for (let j=0; j<numY; j++) {
                grid.setTile(startX+i, startY+j, 1);
            }
        }
    });

    const startNode = {
      x: Math.floor(spawnPoint.x / tileSize),
      y: Math.floor(spawnPoint.y / tileSize),
      g: 0,
      h: 0,
      f: 0,
      parent: null,
    };

    // Find a random ground tile to act as the goal
    let goalNode;
    for (let y = grid.height - 1; y >= 0; y--) {
        for (let x = 0; x < grid.width; x++) {
            if (grid.getTile(x, y) === 1 && grid.getTile(x, y-1) === 0) {
                goalNode = { x, y: y-1 };
                break;
            }
        }
        if(goalNode) break;
    }

    const path = aStar(startNode, goalNode, grid, physics, pcp, tileSize);
    expect(path).not.toBeNull();
    expect(path.length).toBeGreaterThan(0);
  });
});

function aStar(start, goal, grid, physics, pcp, tileSize) {
    const openSet = [start];
    const closedSet = [];

    while (openSet.length > 0) {
        let lowestFIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestFIndex].f) {
                lowestFIndex = i;
            }
        }

        const currentNode = openSet[lowestFIndex];

        if (currentNode.x === goal.x && currentNode.y === goal.y) {
            const path = [];
            let temp = currentNode;
            while (temp) {
                path.push(temp);
                temp = temp.parent;
            }
            return path.reverse();
        }

        openSet.splice(lowestFIndex, 1);
        closedSet.push(currentNode);

        const neighbors = getNeighbors(currentNode, grid, physics, pcp, tileSize);
        for (const neighbor of neighbors) {
            if (closedSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                continue;
            }

            const gScore = currentNode.g + 1;
            let gScoreIsBest = false;

            if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                gScoreIsBest = true;
                neighbor.h = heuristic(neighbor, goal);
                openSet.push(neighbor);
            } else if (gScore < neighbor.g) {
                gScoreIsBest = true;
            }

            if (gScoreIsBest) {
                neighbor.parent = currentNode;
                neighbor.g = gScore;
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
    }

    return null; // No path found
}

function getNeighbors(node, grid, physics, pcp, tileSize) {
    const neighbors = [];
    const { x, y } = node;
    const { width, height } = grid;

    // Walking
    if (y < height - 1 && grid.getTile(x, y + 1) === 1) {
        if (x > 0 && grid.getTile(x - 1, y) === 0) {
            neighbors.push({ x: x - 1, y });
        }
        if (x < width - 1 && grid.getTile(x + 1, y) === 0) {
            neighbors.push({ x: x + 1, y });
        }
    }

    // Falling
    if (y < height - 1 && grid.getTile(x, y + 1) === 0) {
        neighbors.push({ x, y: y + 1 });
    }

    // Jumping
    const trajectory = physics.getJumpTrajectory({ x: x * tileSize, y: y * tileSize }, true);
    let landingSpot = null;
    for (const point of trajectory) {
        const tileX = Math.floor(point.x / tileSize);
        const tileY = Math.floor(point.y / tileSize);

        if (tileX < 0 || tileX >= width || tileY < 0 || tileY >= height) {
            break; // Out of bounds
        }

        if (grid.getTile(tileX, tileY) === 1) {
            break; // Hit a wall
        }

        if (grid.getTile(tileX, tileY + 1) === 1) {
            landingSpot = { x: tileX, y: tileY };
            break;
        }
    }

    if (landingSpot) {
        neighbors.push(landingSpot);
    }


    return neighbors.map(n => ({ ...n, g: 0, h: 0, f: 0, parent: null }));
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
