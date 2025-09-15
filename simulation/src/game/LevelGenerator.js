import * as Phaser from 'phaser';
import Grid from './generation/Grid';
import PhysicsHelpers from './generation/PhysicsHelpers';

const TILE_SIZE = 32;

function generateSimpleRoom(width, height, startPoint, endPoint, pcp) {
  const grid = new Grid(width, height, 1);
  let carver = startPoint.clone();
  const path = [startPoint.clone()];

  const MAX_ITERATIONS = 100;
  let iterations = 0;

  while (Phaser.Math.Distance.BetweenPoints(carver, endPoint) > 5 && iterations < MAX_ITERATIONS) {
    const candidates = generateCandidatePoints(carver, width, height, pcp);
    const carverPx = carver.clone().scale(TILE_SIZE);

    const reachableCandidates = candidates.filter(c =>
      PhysicsHelpers.canReach(carverPx, c.clone().scale(TILE_SIZE), pcp)
    );

    if (reachableCandidates.length === 0) {
      console.warn("Path generation warning: Carver got stuck.");
      break;
    }

    let bestCandidate = reachableCandidates.reduce((best, a) => {
        const distA = Phaser.Math.Distance.BetweenPoints(a, endPoint);
        const distB = Phaser.Math.Distance.BetweenPoints(best, endPoint);
        return distA < distB ? a : best;
    });

    path.push(bestCandidate.clone());
    carver = bestCandidate;
    iterations++;
  }
  path.push(endPoint);

  // Carve the path and place platforms
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i+1];
    const trajectory = PhysicsHelpers.getJumpTrajectory(p1.clone().scale(TILE_SIZE), pcp, true, p2.clone().scale(TILE_SIZE));

    trajectory.forEach(p => {
        const tileX = Math.floor(p.x / TILE_SIZE);
        const tileY = Math.floor(p.y / TILE_SIZE);
        grid.setTile(tileX, tileY, 0);
    });

    // Place a platform at the landing spot
    const platformY = p2.y;
    for (let j = -2; j <= 2; j++) {
      const platformX = p2.x + j;
      if(grid.getTile(platformX, platformY) !== undefined) {
        grid.setTile(platformX, platformY, 1);
      }
    }
  }

  postProcess(grid);
  return grid;
}

function generateCandidatePoints(carver, width, height, pcp) {
    const candidates = [];
    const JUMP_RANGE_X = Math.ceil((pcp.runSpeed * 2 * -pcp.sprintJumpVelocity / pcp.gravity) / TILE_SIZE);
    const JUMP_RANGE_Y = Math.ceil((pcp.sprintJumpVelocity * pcp.sprintJumpVelocity / (2 * pcp.gravity)) / TILE_SIZE);

    for(let i = 0; i < 40; i++) {
        const x = carver.x + Phaser.Math.Between(-JUMP_RANGE_X, JUMP_RANGE_X);
        const y = carver.y + Phaser.Math.Between(-JUMP_RANGE_Y, JUMP_RANGE_Y / 2);
        if (x > 2 && x < width - 2 && y > 2 && y < height - 2) {
            candidates.push(new Phaser.Math.Vector2(x, y));
        }
    }
    return candidates;
}

function postProcess(grid) {
  const tempGrid = new Grid(grid.width, grid.height, 0);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      tempGrid.setTile(x, y, grid.getTile(x, y));
    }
  }

  // Less aggressive path widening
  for (let y = 1; y < grid.height - 1; y++) {
    for (let x = 1; x < grid.width - 1; x++) {
      if (tempGrid.getTile(x, y) === 0) {
        grid.setTile(x, y - 1, 0); // Clear above
        grid.setTile(x, y + 1, 0); // Clear below
      }
    }
  }

  // Encase in a solid border
  for (let x = 0; x < grid.width; x++) {
    grid.setTile(x, 0, 1);
    grid.setTile(x, grid.height - 1, 1);
  }
  for (let y = 0; y < grid.height; y++) {
    grid.setTile(0, y, 1);
    grid.setTile(grid.width - 1, y, 1);
  }
}

const LevelGenerator = {
  generateSimpleRoom,
};

export default LevelGenerator;
