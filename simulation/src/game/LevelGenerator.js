import * as Phaser from 'phaser';
import Grid from './generation/Grid';
import * as Structures from './generation/structures';
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

    this.placeStructures(chunkGrid, placedStructures);

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

  placeStructures(chunkGrid, placedStructures) {
    // Place the first structure randomly
    const structure = this.structures[Math.floor(Math.random() * this.structures.length)];
    const x = Math.floor(Math.random() * (chunkGrid.width - structure.width));
    const y = Math.floor(Math.random() * (chunkGrid.height - structure.height));
    this.placeStructure(chunkGrid, { structure, x, y }, placedStructures);


    for (let i = 0; i < 10; i++) { // Attempt to place a few structures
      this.tryPlaceConnectedStructure(chunkGrid, placedStructures);
    }
  }

  tryPlaceConnectedStructure(chunkGrid, placedStructures) {
    if (placedStructures.length === 0) return;
    const existing = placedStructures[Math.floor(Math.random() * placedStructures.length)];
    const newStructure = this.structures[Math.floor(Math.random() * this.structures.length)];

    const existingSnapPoints = Array.from(existing.structure.snapPoints.entries());
    const newSnapPoints = Array.from(newStructure.snapPoints.entries());

    if (existingSnapPoints.length === 0 || newSnapPoints.length === 0) return;

    const [existingType, existingPoints] = existingSnapPoints[Math.floor(Math.random() * existingSnapPoints.length)];
    const compatibleType = this.getCompatibleSnapPointType(existingType);

    const compatibleNewPoints = newSnapPoints.find(([type]) => type === compatibleType);
    if (!compatibleNewPoints) return;

    const existingPoint = existingPoints[Math.floor(Math.random() * existingPoints.length)];
    const newPoint = compatibleNewPoints[1][Math.floor(Math.random() * compatibleNewPoints[1].length)];

    const newX = existing.x + existingPoint.x - newPoint.x;
    const newY = existing.y + existingPoint.y - newPoint.y;

    const distance = Math.abs(newX - (existing.x + existingPoint.x));
    const height = Math.abs(newY - (existing.y + existingPoint.y));

    if (this.physics.canTraverse(distance, height) && this.canPlace(chunkGrid, newStructure, newX, newY, placedStructures)) {
      this.placeStructure(chunkGrid, { structure: newStructure, x: newX, y: newY }, placedStructures);
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

  getCompatibleSnapPointType(type) {
    switch (type) {
      case 'top': return 'bottom';
      case 'bottom': return 'top';
      case 'left': return 'right';
      case 'right': return 'left';
    }
  }
}
