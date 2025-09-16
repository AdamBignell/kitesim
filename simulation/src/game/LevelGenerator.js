import * as Phaser from 'phaser';
import { createNoise2D } from 'simplex-noise';
import Grid from './generation/Grid';
import Tile, { TileType } from './generation/Tile';
import * as Structures from './generation/structures';
import { createFloor } from './generation/MegaStructure';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';
import GreedyMesher from './generation/GreedyMesher';
import SplinePathGenerator from './generation/SplinePathGenerator';
import RhythmNodeCalculator from './generation/RhythmNodeCalculator';

export default class LevelGenerator {
  constructor(scene, pcp) {
    this.scene = scene;
    this.structures = Object.values(Structures);
    this.pcp = pcp;
    this.noise = createNoise2D();
    const rhythmCalculator = new RhythmNodeCalculator(pcp);
    this.pathGenerator = new SplinePathGenerator(rhythmCalculator);
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = new Grid(chunkSize, chunkSize, null);
    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        chunkGrid.setTile(x, y, new Tile(TileType.EMPTY));
      }
    }
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
          chunkGrid.setTile(x, y, new Tile(TileType.SOLID));
        }
      }
    }

    // --- 2D Noise for Cave Generation ---
    const caveNoiseScale = 25; // How "zoomed-in" the cave noise is
    const caveThreshold = 0.6; // Value above which a tile becomes empty space

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        // Only try to carve caves below the surface
        const tile = chunkGrid.getTile(x, y);
        if (tile && tile.type === TileType.SOLID) {
          const worldX = (chunkX * chunkSize) + x;
          const worldY = (chunkY * chunkSize) + y;
          const caveNoiseValue = this.noise(worldX / caveNoiseScale, worldY / caveNoiseScale);

          const isSurface = (y > 0 && chunkGrid.getTile(x, y - 1).type === TileType.EMPTY);

          if (caveNoiseValue > caveThreshold && !isSurface) {
            chunkGrid.setTile(x, y, new Tile(TileType.EMPTY));
          }
        }
      }
    }

    // --- Slope Generation ---
    for (let x = 0; x < chunkSize; x++) {
      for (let y = 1; y < chunkSize; y++) { // Start from y=1 to avoid checking out of bounds
        const currentTile = chunkGrid.getTile(x, y);
        if (currentTile && currentTile.type === TileType.SOLID) {
          const aboveTile = chunkGrid.getTile(x, y - 1);

          if (aboveTile && aboveTile.type === TileType.EMPTY) {
            // This is a surface tile. Let's check for slopes.
            if (x > 0 && x < chunkSize - 1) {
              const leftTile = chunkGrid.getTile(x - 1, y);
              const rightTile = chunkGrid.getTile(x + 1, y);

              const aboveLeftTile = chunkGrid.getTile(x - 1, y - 1);
              const aboveRightTile = chunkGrid.getTile(x + 1, y - 1);

              if (rightTile && rightTile.type === TileType.SOLID && aboveRightTile && aboveRightTile.type === TileType.EMPTY) {
                currentTile.type = TileType.SLOPE_45_LEFT;
              } else if (leftTile && leftTile.type === TileType.SOLID && aboveLeftTile && aboveLeftTile.type === TileType.EMPTY) {
                currentTile.type = TileType.SLOPE_45_RIGHT;
              }
            }
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

      for (let y = tileY - 5; y < tileY; y++) {
        for (let x = tileX - 1; x < tileX + platformWidth + 1; x++) {
          if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
            chunkGrid.setTile(x, y, new Tile(TileType.EMPTY));
          }
        }
      }

      for (let x = tileX; x < tileX + platformWidth; x++) {
        if (x >= 0 && x < chunkSize && tileY >= 0 && tileY < chunkSize) {
          chunkGrid.setTile(x, tileY, new Tile(TileType.SOLID));
        }
      }
    }

    const surfaceTiles = [];
    const groundGrid = new Grid(chunkSize, chunkSize, 0);

    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        const tile = chunkGrid.getTile(x, y);
        if (tile && (tile.type === TileType.SLOPE_45_LEFT || tile.type === TileType.SLOPE_45_RIGHT)) {
          surfaceTiles.push({ x, y, tile });
        } else if (tile && tile.type === TileType.SOLID) {
          const aboveTile = chunkGrid.getTile(x, y - 1);
          if (aboveTile && aboveTile.type === TileType.EMPTY) {
            surfaceTiles.push({ x, y, tile });
          } else {
            groundGrid.setTile(x, y, 1);
          }
        }
      }
    }

    const slopeGroup = this.scene.add.group();
    for (const surfaceTile of surfaceTiles) {
      const tileWorldX = (chunkX * chunkSize) + surfaceTile.x;
      const tileWorldY = (chunkY * chunkSize) + surfaceTile.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;
      let texture = 'platform';
      if (surfaceTile.tile.type === TileType.SLOPE_45_LEFT) {
        texture = 'slope_45_left';
      } else if (surfaceTile.tile.type === TileType.SLOPE_45_RIGHT) {
        texture = 'slope_45_right';
      }
      const newPlatform = this.scene.add.sprite(platformX, platformY, texture);
      newPlatform.setOrigin(0,0);
      if (surfaceTile.tile.type === TileType.SOLID) {
        this.scene.physics.add.existing(newPlatform, true);
        newPlatforms.add(newPlatform);
      } else {
        slopeGroup.add(newPlatform);
      }
    }

    const meshes = GreedyMesher.mesh(groundGrid);
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

    return { platforms: newPlatforms, grid: chunkGrid, surfaceTiles };
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, null);
    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        chunkGrid.setTile(x, y, new Tile(TileType.EMPTY));
      }
    }
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
          chunkGrid.setTile(x, y, new Tile(TileType.SOLID));
        }
      }
    }

    // --- 2D Noise for Cave Generation ---
    const caveNoiseScale = 25;
    const caveThreshold = 0.6;

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        const tile = chunkGrid.getTile(x, y);
        if (tile && tile.type === TileType.SOLID) {
          const worldX = (chunkX * chunkSize) + x;
          const worldY = (chunkY * chunkSize) + y;
          const caveNoiseValue = this.noise(worldX / caveNoiseScale, worldY / caveNoiseScale);
          const isSurface = (y > 0 && chunkGrid.getTile(x, y - 1).type === TileType.EMPTY);
          if (caveNoiseValue > caveThreshold && !isSurface) {
            chunkGrid.setTile(x, y, new Tile(TileType.EMPTY));
          }
        }
      }
    }

    // --- Slope Generation for Initial Chunk ---
    for (let x = 0; x < chunkSize; x++) {
      for (let y = 1; y < chunkSize; y++) {
        const currentTile = chunkGrid.getTile(x, y);
        if (currentTile && currentTile.type === TileType.SOLID) {
          const aboveTile = chunkGrid.getTile(x, y - 1);
          if (aboveTile && aboveTile.type === TileType.EMPTY) {
            if (x > 0 && x < chunkSize - 1) {
              const leftTile = chunkGrid.getTile(x - 1, y);
              const rightTile = chunkGrid.getTile(x + 1, y);
              const aboveLeftTile = chunkGrid.getTile(x - 1, y - 1);
              const aboveRightTile = chunkGrid.getTile(x + 1, y - 1);

              if (rightTile && rightTile.type === TileType.SOLID && aboveRightTile && aboveRightTile.type === TileType.EMPTY) {
                currentTile.type = TileType.SLOPE_45_LEFT;
              } else if (leftTile && leftTile.type === TileType.SOLID && aboveLeftTile && aboveLeftTile.type === TileType.EMPTY) {
                currentTile.type = TileType.SLOPE_45_RIGHT;
              }
            }
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
            chunkGrid.setTile(x, y, new Tile(TileType.EMPTY));
          }
        }
      }
      for (let x = tileX; x < tileX + platformWidth; x++) {
        if (x >= 0 && x < chunkSize && tileY >= 0 && tileY < chunkSize) {
          chunkGrid.setTile(x, tileY, new Tile(TileType.SOLID));
        }
      }
    }

    // Now, create a safe zone for the player to spawn in
    const safeZone = { x: 1, y: 12, width: 5, height: 5 };
    for (let y = safeZone.y; y < safeZone.y + safeZone.height; y++) {
        for (let x = safeZone.x; x < safeZone.x + safeZone.width; x++) {
            if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
                chunkGrid.setTile(x, y, new Tile(TileType.EMPTY));
            }
        }
    }

    // Find a safe spawn point within the cleared safe zone
    const searchX = safeZone.x + Math.floor(safeZone.width / 2);
    let groundY = -1;

    // Scan downwards from the top of the chunk to find the first solid tile in our search column
    for (let y = 0; y < chunkSize; y++) {
        if (chunkGrid.getTile(searchX, y).type === TileType.SOLID) {
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
    const surfaceTiles = [];
    const groundGrid = new Grid(chunkSize, chunkSize, 0);

    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        const tile = chunkGrid.getTile(x, y);
        if (tile && (tile.type === TileType.SLOPE_45_LEFT || tile.type === TileType.SLOPE_45_RIGHT)) {
          surfaceTiles.push({ x, y, tile });
        } else if (tile && tile.type === TileType.SOLID) {
          const aboveTile = chunkGrid.getTile(x, y - 1);
          if (aboveTile && aboveTile.type === TileType.EMPTY) {
            surfaceTiles.push({ x, y, tile });
          } else {
            groundGrid.setTile(x, y, 1);
          }
        }
      }
    }

    const slopeGroup = this.scene.add.group();
    for (const surfaceTile of surfaceTiles) {
      const tileWorldX = (chunkX * chunkSize) + surfaceTile.x;
      const tileWorldY = (chunkY * chunkSize) + surfaceTile.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;
      let texture = 'platform';
      if (surfaceTile.tile.type === TileType.SLOPE_45_LEFT) {
        texture = 'slope_45_left';
      } else if (surfaceTile.tile.type === TileType.SLOPE_45_RIGHT) {
        texture = 'slope_45_right';
      }
      const newPlatform = this.scene.add.sprite(platformX, platformY, texture);
      newPlatform.setOrigin(0,0);
      if (surfaceTile.tile.type === TileType.SOLID) {
        this.scene.physics.add.existing(newPlatform, true);
        newPlatforms.add(newPlatform);
      } else {
        slopeGroup.add(newPlatform);
      }
    }

    const meshes = GreedyMesher.mesh(groundGrid);
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

    return { platforms: newPlatforms, spawnPoint, grid: chunkGrid, surfaceTiles };
  }
}
