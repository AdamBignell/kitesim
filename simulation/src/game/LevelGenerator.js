import * as Phaser from 'phaser';
import Grid from './generation/Grid';
import * as Structures from './generation/structures';
import { createFloor } from './generation/MegaStructure';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';
import GreedyMesher from './generation/GreedyMesher';
import NoiseGenerator from './generation/NoiseGenerator';
import Spline from './generation/Spline';

export default class LevelGenerator {
  constructor(scene, pcp) {
    this.scene = scene;
    this.pcp = pcp;
    this.noiseGenerator = new NoiseGenerator(Math.random());
    this.spline = new Spline([
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 400, y: 0 },
      { x: 600, y: 0 },
      { x: 800, y: 0 },
    ]);
    this.spline.setMetadata(0, { amplitude: 20, height_offset: 0 });
    this.spline.setMetadata(1, { amplitude: 50, height_offset: -20 });
    this.spline.setMetadata(2, { amplitude: 10, height_offset: 10 });
    this.spline.setMetadata(3, { amplitude: 80, height_offset: -50 });
    this.spline.setMetadata(4, { amplitude: 20, height_offset: 0 });
    this.lastY = 0;
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();

    this.generateTerrain(chunkGrid, chunkX, chunkY, chunkSize);

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

  generateTerrain(chunkGrid, chunkX, chunkY, chunkSize) {
    const scale = 100; // zoom level of the noise
    const octaves = 4;
    const persistence = 0.5;
    const lacunarity = 2;

    for (let x = 0; x < chunkSize; x++) {
      const worldX = chunkX * chunkSize + x;
      const t = worldX / (this.spline.curve.points.length - 1) / 200;
      const metadata = this.spline.getInterpolatedMetadata(t);
      const groundLevel = chunkY * chunkSize + chunkSize / 2 + metadata.height_offset;

      const noiseValue = this.noiseGenerator.fBm(worldX, 0, octaves, persistence, lacunarity, scale);
      const height = Math.round(noiseValue * metadata.amplitude);
      let y = Math.round(groundLevel + height);

      if (x > 0) {
        const lastY = this.lastY;
        const slope = Math.abs(y - lastY);
        if (slope > this.pcp.maxSlope) {
          y = lastY + (y > lastY ? this.pcp.maxSlope : -this.pcp.maxSlope);
        }
      }
      this.lastY = y;

      for (let j = y; j < chunkY * chunkSize + chunkSize; j++) {
        const worldY = chunkY * chunkSize + j;
        const localY = j - chunkY * chunkSize;
        if (localY >= 0 && localY < chunkSize) {
            const caveNoise = this.noiseGenerator.fBm(worldX, worldY, octaves, persistence, lacunarity, scale / 2);
            if (caveNoise > 0.6) {
                chunkGrid.setTile(x, localY, 0);
            } else {
                chunkGrid.setTile(x, localY, 1);
            }
        }
      }
    }
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkY = 0;
    const chunkGrid = new Grid(chunkSize, chunkSize, 0);
    const newPlatforms = this.scene.physics.add.staticGroup();

    this.generateTerrain(chunkGrid, chunkX, chunkY, chunkSize);

    const spawnX = chunkSize / 2;
    let spawnY = -1;
    for (let y = 0; y < chunkSize; y++) {
      if (chunkGrid.getTile(spawnX, y) === 1) {
        spawnY = y;
        break;
      }
    }

    const spawnPoint = {
      x: (chunkX * chunkSize + spawnX) * tileSize,
      y: (chunkY * chunkSize + spawnY - 2) * tileSize,
    };

    const meshes = GreedyMesher.mesh(chunkGrid);
    for (const mesh of meshes) {
      const tileWorldX = (chunkX * chunkSize) + mesh.x;
      const tileWorldY = (chunkY * chunkSize) + mesh.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;
      const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, 'platform');
      newPlatform.setOrigin(0, 0);
      this.scene.physics.add.existing(newPlatform, true);
      newPlatforms.add(newPlatform);
    }

    return { platforms: newPlatforms, spawnPoint, grid: chunkGrid };
  }
}
