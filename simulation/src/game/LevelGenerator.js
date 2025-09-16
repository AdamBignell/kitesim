import * as Phaser from 'phaser';
import Grid from './generation/Grid';
import * as Structures from './generation/structures';
import { createFloor } from './generation/MegaStructure';
import Physics from './generation/Physics';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';
import GreedyMesher from './generation/GreedyMesher';

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

    this.placeStructures(chunkGrid, newPlatforms, placedStructures, chunkSize, chunkSize, chunkX, chunkY, tileSize);

    const meshes = GreedyMesher.mesh(chunkGrid);
    for (const mesh of meshes) {
      const tileWorldX = (chunkX * chunkSize) + mesh.x;
      const tileWorldY = (chunkY * chunkSize) + mesh.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;
      const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, 'platform');
      newPlatform.setOrigin(0,0);
      this.scene.physics.add.existing(newPlatform, true);
      newPlatforms.add(newPlatform);
    }

    return { platforms: newPlatforms, grid: chunkGrid };
  }

  placeStructures(chunkGrid, platforms, placedStructures, width, height, chunkX, chunkY, tileSize) {
    const floorSpline = createFloor(width, { height: height, tileSize: tileSize });

    // Create the physics chain and visual representation for the spline-based floor
    this.placeSplineTerrain(floorSpline, platforms, chunkX, chunkY, width, tileSize);

    // Add some features on top of the floor
    for (let i = 0; i < 10; i++) {
        const structure = this.structures[Math.floor(Math.random() * this.structures.length)];
        const x = Math.floor(Math.random() * (width - structure.width));
        const y = Math.floor(Math.random() * (height - structure.height));

        const isFloating = Math.random() < 0.2; // 20% chance to be a floating island

        let placeY = y;
        let canBePlaced = false;

        if (isFloating) {
            canBePlaced = true; // Floating structures can be placed anywhere (as long as it's empty)
        } else {
            // For non-floating structures, calculate the Y position based on the spline surface
            // Use the center of the structure for a more stable placement
            const t = (x + structure.width / 2) / width;
            const surfacePoint = floorSpline.getPointAt(t);
            if (surfacePoint) {
                const surfaceY_pixels = surfacePoint.y;
                const structureHeightInPixels = structure.height * tileSize;
                // Position the structure so its bottom rests on the spline surface
                const y_pixels = surfaceY_pixels - structureHeightInPixels;
                placeY = Math.floor(y_pixels / tileSize);
                canBePlaced = true;
            }
        }

        if (canBePlaced && this.canPlace(chunkGrid, structure, x, placeY, placedStructures)) {
            this.placeStructure(chunkGrid, { structure, x: x, y: placeY }, placedStructures);
        }
    }

    return floorSpline; // Return the spline for potential use (e.g., spawn point calculation)
  }

  placeSplineTerrain(spline, platforms, chunkX, chunkY, chunkSize, tileSize) {
    const chunkWorldX = chunkX * chunkSize * tileSize;
    const chunkWorldY = chunkY * chunkSize * tileSize;

    const splineWidth = chunkSize * tileSize;
    const step = 4; // Create a physics body every 4 pixels
    const numSteps = Math.floor(splineWidth / step);
    const curvePoints = spline.getPoints(numSteps);

    if (curvePoints.length === 0) return;

    // --- 1. Build Physics Chain ---
    for (const point of curvePoints) {
        const x = chunkWorldX + point.x;
        const y = chunkWorldY + point.y;

        // Create a tall, thin, invisible physics column that goes from the surface to the bottom of the screen
        const columnHeight = this.scene.scale.height - y;
        const columnX = x;
        // The y position of a body is its center
        const columnY = y + (columnHeight / 2);

        const physicsColumn = platforms.create(columnX, columnY, null);
        // Overlap columns slightly to prevent the player from snagging on edges
        physicsColumn.setSize(step + 1, columnHeight);
        physicsColumn.setVisible(false);
        physicsColumn.refreshBody();
    }

    // --- 2. Draw Visual Surface ---
    const graphics = this.scene.add.graphics();
    graphics.x = chunkWorldX;
    graphics.y = chunkWorldY;
    graphics.fillStyle(0x000000, 1); // Black fill
    graphics.beginPath();

    // Start at the bottom-left of the visible area, go up to the first spline point
    graphics.moveTo(curvePoints[0].x, this.scene.scale.height);
    graphics.lineTo(curvePoints[0].x, curvePoints[0].y);

    // Draw a line along all the spline points
    for (let i = 1; i < curvePoints.length; i++) {
        graphics.lineTo(curvePoints[i].x, curvePoints[i].y);
    }

    // Go from the last spline point down to the bottom-right of the visible area
    graphics.lineTo(curvePoints[curvePoints.length - 1].x, this.scene.scale.height);

    // Close the path to create a filled shape
    graphics.closePath();
    graphics.fillPath();
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();
    const placedStructures = [];

    // Place all the structures and get the floor spline back
    const floorSpline = this.placeStructures(chunkGrid, newPlatforms, placedStructures, chunkSize, chunkSize, chunkX, chunkY, tileSize);

    // Now, create a safe zone for the player to spawn in
    const safeZone = { x: 1, y: 12, width: 5, height: 5 };
    for (let y = safeZone.y; y < safeZone.y + safeZone.height; y++) {
        for (let x = safeZone.x; x < safeZone.x + safeZone.width; x++) {
            if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
                chunkGrid.setTile(x, y, 0); // Clear out any terrain in the safe zone
            }
        }
    }

    // Find a safe spawn point using the spline.
    const searchX = safeZone.x + Math.floor(safeZone.width / 2);
    const t = searchX / chunkSize;
    const surfacePoint = floorSpline.getPointAt(t);

    const spawnX = (chunkX * chunkSize + searchX) * tileSize + tileSize / 2;
    // Place the player 2 tiles above the ground to prevent spawning inside it
    const spawnY = (chunkY * chunkSize + surfacePoint.y) - (tileSize * 2);
    const spawnPoint = { x: spawnX, y: spawnY };


    // Finally, create the platform bodies from the modified chunkGrid (for structures, not the floor)
    const meshes = GreedyMesher.mesh(chunkGrid);
    for (const mesh of meshes) {
      const tileWorldX = (chunkX * chunkSize) + mesh.x;
      const tileWorldY = (chunkY * chunkSize) + mesh.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;
      const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, 'platform');
      newPlatform.setOrigin(0,0);
      this.scene.physics.add.existing(newPlatform, true);
      newPlatforms.add(newPlatform);
    }

    return { platforms: newPlatforms, spawnPoint, grid: chunkGrid };
  }

  canPlace(chunkGrid, structure, x, y, placedStructures) {
    const padding = 1; // The amount of empty space to require around structures
    if (x < 0 || y < 0 || x + structure.width > chunkGrid.width || y + structure.height > chunkGrid.height) {
      return false;
    }

    for (const placed of placedStructures) {
        // Check for bounding box collision with padding
        if (x < placed.x + placed.structure.width + padding &&
            x + structure.width + padding > placed.x &&
            y < placed.y + placed.structure.height + padding &&
            y + structure.height + padding > placed.y) {
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
