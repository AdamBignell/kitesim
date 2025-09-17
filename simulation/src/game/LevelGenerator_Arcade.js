import { createNoise2D } from 'simplex-noise';
import Grid from './generation/Grid';
import * as Structures from './generation/structures';
import GreedyMesher from './generation/GreedyMesher';
import SplinePathGenerator from './generation/SplinePathGenerator';
import RhythmNodeCalculator from './generation/RhythmNodeCalculator';

export default class LevelGenerator {
  constructor(scene, pcp) {
    this.scene = scene;
    this.structures = Object.values(Structures);
    this.pcp = pcp;
    this.noise = createNoise2D();
    this.caveNoise = createNoise2D(); // Separate noise instance for caves
    const rhythmCalculator = new RhythmNodeCalculator(pcp);
    this.pathGenerator = new SplinePathGenerator(rhythmCalculator);
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();

    // --- Spline and Noise-based Terrain Generation ---
    const terrainNoiseScale = 50; // Controls the "zoom" level of the noise
    const terrainAmplitude = 15;   // Controls the max height variation of the hills
    const worldCenterY = chunkSize / 2;

    for (let x = 0; x < chunkSize; x++) {
      const worldX = (chunkX * chunkSize) + x;

      // 1. Get the base height from the spline
      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20); // Scale worldX to match spline's scale
      const splineHeight = splinePoint.y;

      // 2. Add noise for local variation
      const noiseValue = this.noise(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;

      // 3. Combine them to get the final terrain height
      const terrainHeight = Math.round(worldCenterY + splineHeight + noiseOffset);

      for (let y = terrainHeight; y < chunkSize; y++) {
        if (y >= 0 && y < chunkSize) {
          chunkGrid.setTile(x, y, 1);
        }
      }
    }

    // --- 2D Noise for Cave Generation ---
    const frequency = 0.05; // Controls the scale of the caves.
    const cave_threshold = 0.5; // Determines the density of caves.

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        // Only try to carve caves below the surface
        if (chunkGrid.getTile(x, y) === 1) {
          const global_x = (chunkX * chunkSize) + x;
          const global_y = (chunkY * chunkSize) + y;

          // Sample noise and normalize to [0, 1]
          let noise_value = this.caveNoise(global_x * frequency, global_y * frequency);
          noise_value = (noise_value + 1) / 2;

          // We also check that we are not carving the top-most layer of the terrain
          const isSurface = (y > 0 && chunkGrid.getTile(x, y - 1) === 0);

          if (noise_value < cave_threshold && !isSurface) {
            chunkGrid.setTile(x, y, 0); // 0 represents an empty tile (air)
          }
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

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();

    // --- Spline and Noise-based Terrain Generation for the initial chunk ---
    const terrainNoiseScale = 50;
    const terrainAmplitude = 15;
    const worldCenterY = chunkSize / 2;

    for (let x = 0; x < chunkSize; x++) {
      const worldX = (chunkX * chunkSize) + x;

      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20);
      const splineHeight = splinePoint.y;

      const noiseValue = this.noise(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;

      const terrainHeight = Math.round(worldCenterY + splineHeight + noiseOffset);

      for (let y = terrainHeight; y < chunkSize; y++) {
        if (y >= 0 && y < chunkSize) {
          chunkGrid.setTile(x, y, 1);
        }
      }
    }

    // --- 2D Noise for Cave Generation ---
    const frequency = 0.05; // Controls the scale of the caves.
    const cave_threshold = 0.5; // Determines the density of caves.

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        if (chunkGrid.getTile(x, y) === 1) {
          const global_x = (chunkX * chunkSize) + x;
          const global_y = (chunkY * chunkSize) + y;

          let noise_value = this.caveNoise(global_x * frequency, global_y * frequency);
          // Normalize to 0-1
          noise_value = (noise_value + 1) / 2;

          const isSurface = (y > 0 && chunkGrid.getTile(x, y - 1) === 0);
          if (noise_value < cave_threshold && !isSurface) {
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
}
