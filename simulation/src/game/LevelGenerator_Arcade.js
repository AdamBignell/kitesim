import { Noise } from 'noisejs';
import Grid from './generation/Grid';
import CaveGenerator from './generation/CaveGenerator';
import * as Structures from './generation/structures';
import GreedyMesher from './generation/GreedyMesher';
import SplinePathGenerator from './generation/SplinePathGenerator';
import RhythmNodeCalculator from './generation/RhythmNodeCalculator';

export default class LevelGenerator {
  constructor(scene, pcp) {
    this.scene = scene;
    this.structures = Object.values(Structures);
    this.pcp = pcp;
    this.noise = new Noise(Math.random());
    const rhythmCalculator = new RhythmNodeCalculator(pcp);
    this.pathGenerator = new SplinePathGenerator(rhythmCalculator);
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();

    // --- Spline and Noise-based Terrain Generation ---
    const terrainNoiseScale = 150; // Controls the "zoom" level of the noise
    const terrainAmplitude = 5;   // Controls the max height variation of the hills
    const worldCenterY = chunkSize / 2;

    for (let x = 0; x < chunkSize; x++) {
      const worldX = (chunkX * chunkSize) + x;

      // 1. Get the base height from the spline
      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20); // Scale worldX to match spline's scale
      const splineHeight = splinePoint.y;

      // 2. Add noise for local variation
      const noiseValue = this.noise.perlin2(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;

      // 3. Combine them to get the final terrain height
      const terrainHeight = Math.round(worldCenterY + splineHeight + noiseOffset);

      for (let y = terrainHeight; y < chunkSize; y++) {
        if (y >= 0 && y < chunkSize) {
          chunkGrid.setTile(x, y, 1);
        }
      }
    }

    // --- Cellular Automata for Cave Generation ---
    const caveGrid = new Grid(chunkSize, chunkSize);
    const caveGenerator = new CaveGenerator(caveGrid);
    const processedCaveGrid = caveGenerator.generate(5, 0.45); // iterations, fill probability

    // Carve the generated caves out of the main chunk grid
    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        if (chunkGrid.getTile(x, y) === 1) {
          const isSurface = (y > 0 && chunkGrid.getTile(x, y - 1) === 0);
          if (processedCaveGrid.getTile(x, y) === 0 && !isSurface) {
            chunkGrid.setTile(x, y, 0);
          }
        }
      }
    }

    // --- Structure Placement ---
    const majorStructures = [Structures.castleTower, Structures.castleWall, Structures.pyramid];
    const structurePlacementChance = 0.3; // 30% chance to place a major structure
    if (chunkX > 0 && Math.random() < structurePlacementChance) {
      const structure = majorStructures[Math.floor(Math.random() * majorStructures.length)];

      const placementX = Math.floor(Math.random() * (chunkSize - structure.width - 10)) + 5;
      let placementY = -1;

      for (let y = 5; y < chunkSize - 5; y++) {
        if (chunkGrid.getTile(placementX, y) === 1 && chunkGrid.getTile(placementX, y - 1) === 0) {
          placementY = y;
          break;
        }
      }

      if (placementY !== -1) {
        const structureBaseY = placementY - structure.height;
        if (structureBaseY > 0) {
          // Carve out space
          chunkGrid.clearRect(placementX, structureBaseY, structure.width, structure.height);
          // Stamp the structure
          chunkGrid.stamp(placementX, structureBaseY, structure.grid);
        }
      }
    }

    // --- Place Floating One-Way Platforms ---
    const oneWayPlatformChance = 0.7; // Increased from 0.4
    if (chunkX > 0 && Math.random() < oneWayPlatformChance) {
        const structure = Structures.oneWayPlatform;
        const numPlatforms = Math.floor(Math.random() * 4) + 2; // 2 to 5 platforms
        const startX = Math.floor(Math.random() * (chunkSize - (structure.width * numPlatforms) - 10)) + 5;
        const startY = Math.floor(Math.random() * 20) + 15; // Place them in the upper-middle part of the chunk

        for (let i = 0; i < numPlatforms; i++) {
            const platformX = startX + i * (structure.width + Math.floor(Math.random() * 3) + 2); // Add random spacing
            const platformY = startY + (Math.random() > 0.5 ? -1 : 1) * Math.floor(Math.random() * 3); // slight y variation
            if (platformX + structure.width < chunkSize && platformY > 0 && platformY < chunkSize) {
                 // Carve out space just in case
                chunkGrid.clearRect(platformX, platformY, structure.width, structure.height);
                // Stamp the one-way platform
                chunkGrid.stamp(platformX, platformY, structure.grid);
            }
        }
    }


    // --- Place Rhythm-Based Platforms (after cave carving) ---
    const nodes = this.pathGenerator.getNodesInChunk(chunkX, chunkSize);
    const platformWidth = 3;

    for (const node of nodes) {
      // Convert node's unit coordinates back to tile coordinates
      const tileX = Math.round(node.x * 20) - (chunkX * chunkSize);
      const tileY = Math.round(worldCenterY + node.y);

      // Clear space above the platform for headroom
      for (let y = tileY - 5; y < tileY; y++) {
        for (let x = tileX - 1; x < tileX + platformWidth + 1; x++) {
          if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
            chunkGrid.setTile(x, y, 0);
          }
        }
      }

      // Place the platform itself, ensuring it's solid
      for (let x = tileX; x < tileX + platformWidth; x++) {
        if (x >= 0 && x < chunkSize && tileY >= 0 && tileY < chunkSize) {
          chunkGrid.setTile(x, tileY, 1);
        }
      }
    }

    const meshes = GreedyMesher.mesh(chunkGrid);
    const oneWayPlatforms = this.scene.physics.add.staticGroup();

    for (const mesh of meshes) {
      const tileWorldX = (chunkX * chunkSize) + mesh.x;
      const tileWorldY = (chunkY * chunkSize) + mesh.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;

      let texture = 'platform_solid';
      if (mesh.tile === 2) {
        texture = 'platform_one_way';
      } else if (mesh.tile === 3) {
        texture = 'platform_prefab';
      }

      const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, texture);
      newPlatform.setOrigin(0,0);

      if (mesh.tile === 2) { // One-way platform
        this.scene.physics.add.existing(newPlatform, true);
        oneWayPlatforms.add(newPlatform);
        newPlatform.body.checkCollision.down = false;
        newPlatform.body.checkCollision.left = false;
        newPlatform.body.checkCollision.right = false;
      } else { // Solid or Prefab platform
        this.scene.physics.add.existing(newPlatform, true);
        newPlatforms.add(newPlatform);
      }
    }

    return { platforms: newPlatforms, oneWayPlatforms, grid: chunkGrid };
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();

    // --- Spline and Noise-based Terrain Generation for the initial chunk ---
    const terrainNoiseScale = 150;
    const terrainAmplitude = 5;
    const worldCenterY = chunkSize / 2;

    for (let x = 0; x < chunkSize; x++) {
      const worldX = (chunkX * chunkSize) + x;

      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20);
      const splineHeight = splinePoint.y;

      const noiseValue = this.noise.perlin2(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;

      const terrainHeight = Math.round(worldCenterY + splineHeight + noiseOffset);

      for (let y = terrainHeight; y < chunkSize; y++) {
        if (y >= 0 && y < chunkSize) {
          chunkGrid.setTile(x, y, 1);
        }
      }
    }

    // --- Cellular Automata for Cave Generation ---
    const caveGrid = new Grid(chunkSize, chunkSize);
    const caveGenerator = new CaveGenerator(caveGrid);
    const processedCaveGrid = caveGenerator.generate(5, 0.45); // iterations, fill probability

    // Carve the generated caves out of the main chunk grid
    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        if (chunkGrid.getTile(x, y) === 1) {
          const isSurface = (y > 0 && chunkGrid.getTile(x, y - 1) === 0);
          if (processedCaveGrid.getTile(x, y) === 0 && !isSurface) {
            chunkGrid.setTile(x, y, 0);
          }
        }
      }
    }

    // --- Place Rhythm-Based Platforms (after cave carving) ---
    const nodes = this.pathGenerator.getNodesInChunk(chunkX, chunkSize);
    const platformWidth = 3;

    for (const node of nodes) {
      const tileX = Math.round(node.x * 20) - (chunkX * chunkSize);
      const tileY = Math.round(worldCenterY + node.y);
      for (let y = tileY - 5; y < tileY; y++) {
        for (let x = tileX - 1; x < tileX + platformWidth + 1; x++) {
          if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
            chunkGrid.setTile(x, y, 0);
          }
        }
      }
      for (let x = tileX; x < tileX + platformWidth; x++) {
        if (x >= 0 && x < chunkSize && tileY >= 0 && tileY < chunkSize) {
          chunkGrid.setTile(x, tileY, 1);
        }
      }
    }

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
        const spawnY = (chunkY * chunkSize + groundY) * tileSize - (tileSize * 2);
        spawnPoint = { x: spawnX, y: spawnY };
    } else {
        // Fallback: If no ground is found in the search column (highly unlikely),
        // spawn in the middle of the safe zone.
        const fallbackX = (chunkX * chunkSize + searchX) * tileSize + tileSize / 2;
        const fallbackY = (chunkY * chunkSize + safeZone.y + Math.floor(safeZone.height / 2)) * tileSize + tileSize / 2;
        spawnPoint = { x: fallbackX, y: fallbackY };
    }

    // Finally, create the platform bodies from the modified chunkGrid
    const meshes = GreedyMesher.mesh(chunkGrid);
    const oneWayPlatforms = this.scene.physics.add.staticGroup();

    for (const mesh of meshes) {
      const tileWorldX = (chunkX * chunkSize) + mesh.x;
      const tileWorldY = (chunkY * chunkSize) + mesh.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;

      let texture = 'platform_solid';
      if (mesh.tile === 2) {
        texture = 'platform_one_way';
      } else if (mesh.tile === 3) {
        texture = 'platform_prefab';
      }

      const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, texture);
      newPlatform.setOrigin(0,0);

      if (mesh.tile === 2) { // One-way platform
        this.scene.physics.add.existing(newPlatform, true);
        oneWayPlatforms.add(newPlatform);
        newPlatform.body.checkCollision.down = false;
        newPlatform.body.checkCollision.left = false;
        newPlatform.body.checkCollision.right = false;
      } else { // Solid or Prefab platform
        this.scene.physics.add.existing(newPlatform, true);
        newPlatforms.add(newPlatform);
      }
    }

    return { platforms: newPlatforms, oneWayPlatforms, spawnPoint, grid: chunkGrid };
  }
}
