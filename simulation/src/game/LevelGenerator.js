import { createNoise2D } from 'simplex-noise';
import Grid from './generation/Grid';
import * as Structures from './generation/structures';
import GreedyMesher from './generation/GreedyMesher';
import SplinePathGenerator from './generation/SplinePathGenerator';
import RhythmNodeCalculator from './generation/RhythmNodeCalculator';

/**
 * @class LevelGenerator
 * @description A unified, physics-agnostic procedural level generator.
 */
export default class LevelGenerator {
  /**
   * @constructor
   * @param {Phaser.Scene} scene - The Phaser scene instance.
   * @param {PlayerCapabilitiesProfile} pcp - The player capabilities profile.
   * @param {PhysicsAdapter} physicsAdapter - The adapter for the active physics engine.
   */
  constructor(scene, pcp, physicsAdapter) {
    this.scene = scene;
    this.pcp = pcp;
    this.physicsAdapter = physicsAdapter;
    this.structures = Object.values(Structures);
    this.noise = createNoise2D();
    const rhythmCalculator = new RhythmNodeCalculator(pcp);
    this.pathGenerator = new SplinePathGenerator(rhythmCalculator);
  }

  /**
   * Generates the geometry for a single chunk of the world.
   * @param {number} chunkX - The x-coordinate of the chunk.
   * @param {number} chunkY - The y-coordinate of the chunk.
   * @param {number} chunkSize - The size of the chunk in tiles.
   * @param {number} tileSize - The size of each tile in pixels.
   * @returns {object} An object containing the generated platforms.
   */
  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);

    const terrainNoiseScale = 150;
    const terrainAmplitude = 5;
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

    const caveNoiseScale = 25;
    const caveThreshold = 0.6;
    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        if (chunkGrid.getTile(x, y) === 1) {
          const worldX = (chunkX * chunkSize) + x;
          const worldY = (chunkY * chunkSize) + y;
          const caveNoiseValue = this.noise(worldX / caveNoiseScale, worldY / caveNoiseScale);
          const isSurface = (y > 0 && chunkGrid.getTile(x, y - 1) === 0);
          if (caveNoiseValue > caveThreshold && !isSurface) {
            chunkGrid.setTile(x, y, 0);
          }
        }
      }
    }

    const meshes = GreedyMesher.mesh(chunkGrid);
    const { platforms, oneWayPlatforms } = this.physicsAdapter.createPlatformBodies(meshes, chunkX, chunkY, tileSize);

    return { platforms, oneWayPlatforms, grid: chunkGrid };
  }

  /**
   * Generates the initial chunk and determines a safe spawn point for the player.
   * @param {number} chunkSize - The size of the chunk in tiles.
   * @param {number} tileSize - The size of each tile in pixels.
   * @returns {object} An object containing platforms, spawn point, and the grid.
   */
  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);

    const terrainNoiseScale = 150;
    const terrainAmplitude = 5;
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

    const safeZone = { x: 1, y: 12, width: 5, height: 5 };
    for (let y = safeZone.y; y < safeZone.y + safeZone.height; y++) {
        for (let x = safeZone.x; x < safeZone.x + safeZone.width; x++) {
            if (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize) {
                chunkGrid.setTile(x, y, 0);
            }
        }
    }

    const searchX = safeZone.x + Math.floor(safeZone.width / 2);
    let groundY = -1;
    for (let y = 0; y < chunkSize; y++) {
        if (chunkGrid.getTile(searchX, y) === 1) {
            groundY = y;
            break;
        }
    }

    let spawnPoint;
    if (groundY !== -1) {
        const spawnX = (chunkX * chunkSize + searchX) * tileSize + tileSize / 2;
        const spawnY = (chunkY * chunkSize + groundY) * tileSize - (tileSize * 2);
        spawnPoint = { x: spawnX, y: spawnY };
    } else {
        const fallbackX = (chunkX * chunkSize + searchX) * tileSize + tileSize / 2;
        const fallbackY = (chunkY * chunkSize + safeZone.y + Math.floor(safeZone.height / 2)) * tileSize + tileSize / 2;
        spawnPoint = { x: fallbackX, y: fallbackY };
    }

    const meshes = GreedyMesher.mesh(chunkGrid);
    const { platforms, oneWayPlatforms } = this.physicsAdapter.createPlatformBodies(meshes, chunkX, chunkY, tileSize);

    return { platforms, oneWayPlatforms, spawnPoint, grid: chunkGrid };
  }
}