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

    const chunkPixelWidth = chunkSize * tileSize;
    const generationHeight = this.scene.scale.height;

    let floorSpline = null;
    // Generate the floor spline and physics chain ONLY for the 'ground level' chunks.
    if (chunkY === 0) {
        floorSpline = createFloor(chunkPixelWidth, {
            height: generationHeight,
        });

        const numSteps = Math.floor(chunkPixelWidth / 4); // 4px wide segments
        const curvePoints = floorSpline.getPoints(numSteps);

        for (const point of curvePoints) {
            // point.x is relative to chunk start (0 -> chunkPixelWidth)
            // point.y is an absolute world y-coordinate
            const columnWorldX = (chunkX * chunkPixelWidth) + point.x;
            const columnWorldY = point.y;

            const columnHeight = generationHeight - columnWorldY;
            // Center the column body vertically
            const columnBodyY = columnWorldY + (columnHeight / 2);

            const physicsColumn = newPlatforms.create(columnWorldX, columnBodyY);
            physicsColumn.setSize(4, columnHeight);
            physicsColumn.setVisible(false);
            physicsColumn.refreshBody();
        }
    }

    this.placeStructures(chunkGrid, placedStructures, chunkSize, chunkSize, chunkX, chunkY, floorSpline);

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

    return { platforms: newPlatforms, grid: chunkGrid, floorSpline };
  }

  placeStructures(chunkGrid, placedStructures, width, height, chunkX, chunkY, floorSpline) {
    // Add some features on top of the floor or floating.
    const TILE_SIZE = this.scene.TILE_SIZE || 32;

    for (let i = 0; i < 10; i++) {
      const structure = this.structures[Math.floor(Math.random() * this.structures.length)];
      // Get a random x position in tiles.
      const x = Math.floor(Math.random() * (width - structure.width));
      let y; // y will be determined below.

      const isFloating = Math.random() < 0.2;

      let canPlaceStructure = false;

      if (!isFloating && floorSpline) {
        // --- Place structure on the spline-based ground ---

        // 1. Calculate the pixel X-coordinate for the center of the structure's base.
        const structureBaseCenterX_tiles = x + (structure.width / 2);
        const structureBaseCenterX_pixels = structureBaseCenterX_tiles * TILE_SIZE;

        // 2. Get the ground height from the spline at this X.
        const chunkPixelWidth = width * TILE_SIZE;
        const groundPoint = floorSpline.getPoint(structureBaseCenterX_pixels / chunkPixelWidth);

        if (groundPoint) {
            const groundY_pixels = groundPoint.y;
            // 3. Convert the pixel ground height back to a tile coordinate.
            const groundY_tiles = Math.floor(groundY_pixels / TILE_SIZE);

            // 4. Set the structure's y position so its base rests on the ground.
            y = groundY_tiles - structure.height;
            canPlaceStructure = true;
        }
      } else {
        // --- Place structure at a random floating position ---
        y = Math.floor(Math.random() * (height - structure.height));
        canPlaceStructure = true;
      }

      // 5. Check if the calculated position is valid and place the structure.
      if (canPlaceStructure && this.canPlace(chunkGrid, structure, x, y, placedStructures)) {
        this.placeStructure(chunkGrid, { structure, x, y }, placedStructures);
      }
    }
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();
    const placedStructures = [];

    const chunkPixelWidth = chunkSize * tileSize;
    const generationHeight = this.scene.scale.height;

    // --- Create Spline Floor ---
    const floorSpline = createFloor(chunkPixelWidth, { height: generationHeight });
    const numSteps = Math.floor(chunkPixelWidth / 4);
    const curvePoints = floorSpline.getPoints(numSteps);

    for (const point of curvePoints) {
        const columnWorldX = point.x; // chunkX is 0
        const columnWorldY = point.y;
        const columnHeight = generationHeight - columnWorldY;
        const columnBodyY = columnWorldY + (columnHeight / 2);

        const physicsColumn = newPlatforms.create(columnWorldX, columnBodyY);
        physicsColumn.setSize(4, columnHeight);
        physicsColumn.setVisible(false);
        physicsColumn.refreshBody();
    }

    // --- Place other structures (e.g., rocks) ---
    this.placeStructures(chunkGrid, placedStructures, chunkSize, chunkSize, chunkX, chunkY, floorSpline);

    // --- Create Safe Spawn Zone ---
    const safeZone = { x: 1, y: 12, width: 5, height: 5 }; // in tiles
    for (let y = safeZone.y; y < safeZone.y + safeZone.height; y++) {
        for (let x = safeZone.x; x < safeZone.x + safeZone.width; x++) {
            if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
                chunkGrid.setTile(x, y, 0);
            }
        }
    }

    // --- Determine Spawn Point using the Spline ---
    const searchX_tiles = safeZone.x + Math.floor(safeZone.width / 2);
    const searchX_pixels = searchX_tiles * tileSize;

    // getPoint takes a value from 0 to 1 for interpolation, so we normalize our pixel x.
    const groundPoint = floorSpline.getPoint(searchX_pixels / chunkPixelWidth);
    let spawnPoint;

    if (groundPoint) {
        const spawnX = searchX_pixels;
        // Place the player 2 tiles above the ground to prevent spawning inside it
        const spawnY = groundPoint.y - (tileSize * 2);
        spawnPoint = { x: spawnX, y: spawnY };
    } else {
        // Fallback spawn point
        const fallbackX = searchX_pixels;
        const fallbackY = (safeZone.y + Math.floor(safeZone.height / 2)) * tileSize;
        spawnPoint = { x: fallbackX, y: fallbackY };
    }

    // --- Create Physics for Grid-based Structures ---
    const meshes = GreedyMesher.mesh(chunkGrid);
    for (const mesh of meshes) {
      const platformX = mesh.x * tileSize;
      const platformY = mesh.y * tileSize;
      const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, 'platform');
      newPlatform.setOrigin(0,0);
      this.scene.physics.add.existing(newPlatform, true);
      newPlatforms.add(newPlatform);
    }

    return { platforms: newPlatforms, spawnPoint, grid: chunkGrid, floorSpline };
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
