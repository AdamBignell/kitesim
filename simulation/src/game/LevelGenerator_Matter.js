import * as Phaser from 'phaser';
import { createNoise2D } from 'simplex-noise';
import * as Structures from './generation/structures';
import SplinePathGenerator from './generation/SplinePathGenerator';
import RhythmNodeCalculator from './generation/RhythmNodeCalculator';
import Grid from './generation/Grid';
import GreedyMesher from './generation/GreedyMesher';

export default class LevelGenerator {
  constructor(scene, pcp) {
    this.scene = scene;
    this.structures = Object.values(Structures);
    this.pcp = pcp;
    this.noise = createNoise2D();
    const rhythmCalculator = new RhythmNodeCalculator(pcp);
    this.pathGenerator = new SplinePathGenerator(rhythmCalculator);
  }

  /**
   * Generates the grid data for a chunk.
   * @param {number} chunkX - The chunk's X coordinate.
   * @param {number} chunkY - The chunk's Y coordinate (not used yet, but for future vertical chunks).
   * @param {number} chunkSize - The width of the chunk in tiles.
   * @param {number} tileSize - The size of each tile in pixels.
   * @returns {Grid} The generated grid for the chunk.
   */
  generateChunkGrid(chunkX, chunkY, chunkSize, tileSize) {
    const chunkHeight = Math.ceil(this.scene.scale.height / tileSize);
    const grid = new Grid(chunkSize, chunkHeight);

    const terrainNoiseScale = 150;
    const terrainAmplitude = 6; // In tiles, for more dramatic height differences
    const cliffiness = 2.5; // How much to amplify steep slopes

    const gapNoiseScale = 400; // Wider features for gaps
    const gapThreshold = 0.65; // Columns with noise over this value become gaps

    const islandNoiseScale = 100; // Smaller features for islands
    const islandThreshold = 0.75; // Likelihood of an island appearing in a gap

    for (let x = 0; x < chunkSize; x++) {
        const worldX = (chunkX * chunkSize + x) * tileSize;

        // Determine the general height based on the spline path
        const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20);
        const splineHeight = splinePoint.y / 10;
        const baseSurfaceY = chunkHeight / 2 + splineHeight;

        // Gap generation using a different noise channel (y-offset)
        const gapValue = (this.noise(worldX / gapNoiseScale, 1000) + 1) / 2; // Value 0-1
        if (gapValue > gapThreshold) {
            // This column is a gap. Check if we should place a floating island.
            const islandNoiseValue = (this.noise(worldX / islandNoiseScale, 2000) + 1) / 2;
            if (islandNoiseValue > islandThreshold) {
                const islandY = Math.floor(baseSurfaceY + (islandNoiseValue - islandThreshold) * 15); // Place island near spline height
                const islandHeight = 2;
                for (let yOffset = 0; yOffset < islandHeight; yOffset++) {
                    grid.setTile(x, islandY + yOffset, 1);
                }
            }
            continue; // Skip normal terrain generation
        }

        // Normal terrain generation with cliffs
        const noiseValue = this.noise(worldX / terrainNoiseScale, 0);
        // Use a tiny offset to check the next point for slope calculation
        const nextNoiseValue = this.noise((worldX + 1) / terrainNoiseScale, 0);
        const slope = Math.abs(nextNoiseValue - noiseValue);
        const noiseOffset = noiseValue * terrainAmplitude * (1 + slope * cliffiness);

        const surfaceY = Math.floor(baseSurfaceY + noiseOffset);

        for (let y = surfaceY; y < chunkHeight; y++) {
            if (y >= 0 && y < chunkHeight) {
                grid.setTile(x, y, 1);
            }
        }
    }

    // Cave Generation
    const caveNoiseScale = 70;
    const caveThreshold = 0.6;
    for (let x = 0; x < chunkSize; x++) {
        for (let y = 0; y < chunkHeight; y++) {
            if (grid.getTile(x, y) === 1) {
                const worldX = (chunkX * chunkSize + x) * tileSize;
                const worldY = y * tileSize;
                const caveValue = (this.noise(worldX / caveNoiseScale, worldY / caveNoiseScale) + 1) / 2;
                if (caveValue > caveThreshold) {
                    grid.setTile(x, y, 0);
                }
            }
        }
    }

    // Cave Decoration (Platforms)
    const platformPlacementNoiseScale = 40;
    const platformPlacementThreshold = 0.75;
    const minPlatformLength = 3;
    const maxPlatformLength = 8;
    for (let y = 5; y < chunkHeight - 5; y++) {
        for (let x = 0; x < chunkSize - maxPlatformLength; x++) {
            const isCavernSpace = grid.getTile(x, y) === 0;
            const isSolidBelow = grid.getTile(x, y + 1) === 1;

            if (isCavernSpace && isSolidBelow) {
                const worldX = (chunkX * chunkSize + x) * tileSize;
                const worldY = y * tileSize;
                const platformNoise = (this.noise(worldX / platformPlacementNoiseScale, worldY / platformPlacementNoiseScale) + 1) / 2;
                if (platformNoise > platformPlacementThreshold) {
                    const lengthNoise = (this.noise(worldX / 20, worldY / 20) + 1) / 2;
                    const platformLength = Math.floor(minPlatformLength + lengthNoise * (maxPlatformLength - minPlatformLength));

                    let canPlace = true;
                    for (let i = 0; i < platformLength; i++) {
                        if (grid.getTile(x + i, y) !== 0 || grid.getTile(x + i, y - 1) === 1) {
                            canPlace = false;
                            break;
                        }
                    }

                    if (canPlace) {
                        for (let i = 0; i < platformLength; i++) {
                            grid.setTile(x + i, y, 2); // 2 = one-way platform
                        }
                        x += platformLength;
                    }
                }
            }
        }
    }
    // Prefab Placement Pass
    const minGroundLength = 5;
    let lastPrefabX = -Infinity; // Ensure we can place a prefab at the start
    const prefabSpacing = 15; // Minimum number of tiles between prefabs

    for (let x = 0; x < chunkSize - minGroundLength; x++) {
        if (x < lastPrefabX + prefabSpacing) {
            continue; // Skip if too close to the last prefab
        }

        let groundY = -1;
        let isFlat = true;

        // Find the first ground tile at this x
        for (let y = 1; y < chunkHeight; y++) {
            if (grid.getTile(x, y) === 1 && grid.getTile(x, y - 1) === 0) {
                groundY = y;
                break;
            }
        }

        if (groundY !== -1) {
            // Check for a flat stretch of ground
            for (let i = 1; i < minGroundLength; i++) {
                if (grid.getTile(x + i, groundY) !== 1 || grid.getTile(x + i, groundY - 1) !== 0) {
                    isFlat = false;
                    break;
                }
            }

            if (isFlat) {
                // We found a good spot, try to place a prefab
                const structure = this.structures[Math.floor(Math.random() * this.structures.length)];

                // Make sure the structure fits vertically
                if (groundY - structure.height > 0) {
                    const stampX = x;
                    const stampY = groundY - structure.height;
                    grid.stamp(stampX, stampY, structure.grid);
                    lastPrefabX = x;
                    x += structure.width; // Move past the placed structure
                }
            }
        }
    }

    return grid;
  }

  /**
   * Creates the visual and physical representation of a chunk from its grid data.
   * @param {Grid} grid - The grid data for the chunk.
   * @param {number} chunkX - The chunk's X coordinate.
   * @param {number} tileSize - The size of each tile in pixels.
   * @returns {Phaser.GameObjects.Container} A container with the chunk's graphics and physics bodies.
   */
  createTilemapFromGrid(grid, chunkX, tileSize) {
    const chunkWorldX = chunkX * grid.width * tileSize;
    const graphics = this.scene.add.graphics();
    const container = this.scene.add.container(0, 0, [graphics]);
    const bodies = [];

    // Use Greedy Mesher to get optimized rectangles
    const meshes = GreedyMesher.mesh(grid);

    meshes.forEach(mesh => {
      const { x, y, width, height, tile } = mesh;
      const rectX = chunkWorldX + (x + width / 2) * tileSize;
      const rectY = (y + height / 2) * tileSize;
      const bodyWidth = width * tileSize;
      const bodyHeight = height * tileSize;

      if (tile === 1) { // Solid blocks
        graphics.fillStyle(0x228B22, 1);
        graphics.fillRect(chunkWorldX + x * tileSize, y * tileSize, bodyWidth, bodyHeight);
        const terrainBody = this.scene.matter.add.rectangle(rectX, rectY, bodyWidth, bodyHeight, { isStatic: true, label: 'terrain' });
        bodies.push(terrainBody);
      } else if (tile === 2) { // One-way platforms
        graphics.fillStyle(0x90EE90, 1); // Light green for one-way platforms
        const platformRenderHeight = tileSize / 4;
        graphics.fillRect(chunkWorldX + x * tileSize, y * tileSize, bodyWidth, platformRenderHeight);

        const platformBody = this.scene.matter.add.rectangle(rectX, y * tileSize + platformRenderHeight / 2, bodyWidth, platformRenderHeight, {
            isStatic: true,
            label: 'oneWayPlatform' // Not a sensor, collision handled in GameScene
        });
        bodies.push(platformBody);
      } else if (tile === 3) { // Prefab blocks
        graphics.fillStyle(0x808080, 1); // Grey for prefab blocks
        graphics.fillRect(chunkWorldX + x * tileSize, y * tileSize, bodyWidth, bodyHeight);
        const prefabBody = this.scene.matter.add.rectangle(rectX, rectY, bodyWidth, bodyHeight, { isStatic: true, label: 'terrain' }); // Treat as normal terrain
        bodies.push(prefabBody);
      }
    });

    container.setData('matterBodies', bodies);
    container.destroy = function() {
      graphics.destroy();
      this.getData('matterBodies').forEach(body => this.scene.matter.world.remove(body));
      Phaser.GameObjects.Container.prototype.destroy.call(this);
    };

    return container;
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const grid = this.generateChunkGrid(chunkX, chunkY, chunkSize, tileSize);
    const tilemap = this.createTilemapFromGrid(grid, chunkX, tileSize);
    return { platforms: tilemap };
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const grid = this.generateChunkGrid(0, 0, chunkSize, tileSize);
    const tilemap = this.createTilemapFromGrid(grid, 0, tileSize);

    const safeZoneTileX = 3;
    let groundY = 0;
    // Find the first solid tile from the top down at the spawn X position
    for (let y = 0; y < grid.height; y++) {
      if (grid.getTile(safeZoneTileX, y) === 1) {
        groundY = y * tileSize;
        break;
      }
    }

    const spawnPoint = {
      x: safeZoneTileX * tileSize,
      y: groundY - tileSize * 3
    };

    return { platforms: tilemap, spawnPoint };
  }
}