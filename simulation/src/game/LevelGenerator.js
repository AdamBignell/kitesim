import * as Phaser from 'phaser';
import GreedyMesher from './generation/GreedyMesher';
import LevelGeneratorLogic from './generation/LevelGeneratorLogic';

export default class LevelGenerator {
  constructor(scene, pcp, seed = 'default-seed') {
    this.scene = scene;
    this.logic = new LevelGeneratorLogic(pcp, seed);
  }

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkGrid = this.logic.generateChunk(chunkX, chunkY, chunkSize, tileSize);
    const newPlatforms = this.scene.physics.add.staticGroup();

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

    return newPlatforms;
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const { chunkGrid, spawnPoint } = this.logic.generateInitialChunkAndSpawnPoint(chunkSize, tileSize);
    const newPlatforms = this.scene.physics.add.staticGroup();

    const meshes = GreedyMesher.mesh(chunkGrid);
    for (const mesh of meshes) {
      const tileWorldX = mesh.x;
      const tileWorldY = mesh.y;
      const platformX = tileWorldX * tileSize;
      const platformY = tileWorldY * tileSize;
      const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, 'platform');
      newPlatform.setOrigin(0,0);
      this.scene.physics.add.existing(newPlatform, true);
      newPlatforms.add(newPlatform);
    }

    return { platforms: newPlatforms, spawnPoint };
  }

  // The following methods are now part of LevelGeneratorLogic
  // and are no longer needed here.
  // canPlace(chunkGrid, structure, x, y, placedStructures)
  // placeStructure(chunkGrid, placed, placedStructures)
  // placeStructures(chunkGrid, placedStructures, width, height, chunkX, chunkY)
}
