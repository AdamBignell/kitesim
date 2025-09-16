import Grid from './Grid';
import * as Structures from './structures';
import { createFloor } from './MegaStructure';
import Physics from './Physics';
import { alea } from 'seedrandom';

export default class LevelGeneratorLogic {
  constructor(pcp, seed = 'default-seed') {
    this.structures = Object.values(Structures);
    this.pcp = pcp;
    this.physics = new Physics(pcp);
    this.rng = alea(seed);
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const placedStructures = [];

    this.placeStructures(chunkGrid, placedStructures, chunkSize, chunkSize, chunkX, chunkY);

    return chunkGrid;
  }

  placeStructures(chunkGrid, placedStructures, width, height, chunkX, chunkY) {
    const floorOptions = {
        height: height,
        topPadding: Math.floor(height / 2),
        bottomPadding: 2,
    };
    const floor = createFloor(width, floorOptions, this.rng);
    this.placeStructure(chunkGrid, { structure: floor, x: 0, y: 0 }, placedStructures);

    // Fill in below the floor to make it solid
    for (let x = 0; x < width; x++) {
      let firstTile = -1;
      for (let y = 0; y < height; y++) {
        if (chunkGrid.getTile(x, y) === 1) {
          firstTile = y;
          break;
        }
      }

      if (firstTile !== -1) {
        for (let y = firstTile; y < height; y++) {
          this.placeStructure(chunkGrid, { structure: Structures.filler, x, y }, placedStructures);
        }
      }
    }

    // Add some features on top of the floor
    for (let i = 0; i < 10; i++) {
      const structure = this.structures[Math.floor(this.rng() * this.structures.length)];
      const x = Math.floor(this.rng() * (width - structure.width));
      const y = Math.floor(this.rng() * (height - structure.height));

      const isFloating = this.rng() < 0.2; // 20% chance to be a floating island

      // Ensure the structure is placed on top of the floor, unless it's a floating island
      let isOnFloor = false;
      if (!isFloating) {
        for(let sx=0; sx<structure.width; sx++) {
            if(chunkGrid.getTile(x+sx, y+structure.height) === 1) {
                isOnFloor = true;
                break;
            }
        }
      }

      if ((isFloating || isOnFloor) && this.canPlace(chunkGrid, structure, x, y, placedStructures)) {
        this.placeStructure(chunkGrid, { structure, x, y }, placedStructures);
      }
    }

    return chunkGrid;
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const placedStructures = [];

    // First, place all the structures for the initial chunk
    this.placeStructures(chunkGrid, placedStructures, chunkSize, chunkSize, chunkX, chunkY);

    // Now, create a safe zone for the player to spawn in
    const safeZone = { x: 1, y: 12, width: 5, height: 5 };
    for (let y = safeZone.y; y < safeZone.y + safeZone.height; y++) {
        for (let x = safeZone.x; x < safeZone.x + safeZone.width; x++) {
            if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
                chunkGrid.setTile(x, y, 0); // Clear out any terrain in the safe zone
            }
        }
    }

    // Find a safe spawn point within the cleared safe zone
    const searchX = safeZone.x + Math.floor(safeZone.width / 2);
    let groundY = -1;

    // Scan downwards from the top of the chunk to find the first solid tile in our search column
    for (let y = 0; y < chunkSize; y++) {
        if (chunkGrid.getTile(searchX, y) === 1) {
            groundY = y;
            break;
        }
    }

    let spawnPoint;
    if (groundY !== -1) {
        // We found ground. The spawn point should be slightly above it.
        const spawnX = (chunkX * chunkSize + searchX) * tileSize + tileSize / 2;
        // Place the player 2 tiles above the ground to prevent spawning inside it
        const spawnY = (chunkY * chunkSize + groundY - 2) * tileSize;
        spawnPoint = { x: spawnX, y: spawnY };
    } else {
        // Fallback: If no ground is found in the search column (highly unlikely),
        // spawn in the middle of the safe zone.
        const fallbackX = (chunkX * chunkSize + searchX) * tileSize + tileSize / 2;
        const fallbackY = (chunkY * chunkSize + safeZone.y + Math.floor(safeZone.height / 2)) * tileSize + tileSize / 2;
        spawnPoint = { x: fallbackX, y: fallbackY };
    }

    return { chunkGrid, spawnPoint };
  }

  canPlace(chunkGrid, structure, x, y, placedStructures) {
    if (x < 0 || y < 0 || x + structure.width > chunkGrid.width || y + structure.height > chunkGrid.height) {
      return false;
    }

    for (const placed of placedStructures) {
        // Check for bounding box collision
        if (x < placed.x + placed.structure.width &&
            x + structure.width > placed.x &&
            y < placed.y + placed.structure.height &&
            y + structure.height > placed.y) {
          return false; // Collision detected
        }
      }

    return true;
  }

  placeStructure(chunkGrid, placed, placedStructures) {
    placedStructures.push(placed);
    for (let sy = 0; sy < placed.structure.height; sy++) {
      for (let sx = 0; sx < placed.structure.width; sx++) {
        if (placed.structure.grid.getTile(sx, sy) === 1) {
          chunkGrid.setTile(placed.x + sx, placed.y + sy, 1);
        }
      }
    }
  }
}
