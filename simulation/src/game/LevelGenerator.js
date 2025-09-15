import * as Phaser from 'phaser';
import Grid from './generation/Grid';
import * as Structures from './generation/structures';
import { createFloor } from './generation/MegaStructure';
import Physics from './generation/Physics';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

export default class LevelGenerator {
  constructor(scene, pcp) {
    this.scene = scene;
    this.structures = Object.values(Structures);
    this.pcp = pcp;
    this.physics = new Physics(pcp);
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();
    const placedStructures = [];

    this.placeStructures(chunkGrid, placedStructures, chunkSize, chunkSize);

    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        if (chunkGrid.getTile(x, y) === 1) {
          const tileWorldX = (chunkX * chunkSize) + x;
          const tileWorldY = (chunkY * chunkSize) + y;
          const platformX = tileWorldX * tileSize + tileSize / 2;
          const platformY = tileWorldY * tileSize + tileSize / 2;
          newPlatforms.create(platformX, platformY, null)
            .setSize(tileSize, tileSize)
            .setVisible(true)
            .refreshBody();
        }
      }
    }

    return newPlatforms;
  }

  placeStructures(chunkGrid, placedStructures, width, height) {
    const floor = createFloor(width, { height: height });
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
      const structure = this.structures[Math.floor(Math.random() * this.structures.length)];
      const x = Math.floor(Math.random() * (width - structure.width));
      const y = Math.floor(Math.random() * (height - structure.height));

      // Ensure the structure is placed on top of the floor
      let isOnFloor = false;
      for(let sx=0; sx<structure.width; sx++) {
          if(chunkGrid.getTile(x+sx, y+structure.height) === 1) {
              isOnFloor = true;
              break;
          }
      }

      if (isOnFloor && this.canPlace(chunkGrid, structure, x, y, placedStructures)) {
        this.placeStructure(chunkGrid, { structure, x, y }, placedStructures);
      }
    }
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
