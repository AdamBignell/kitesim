import * as Phaser from 'phaser';

export default class LevelGenerator {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Generates a simple, predictable chunk for testing purposes.
   * @param {number} chunkX - The horizontal grid coordinate of the chunk.
   * @param {number} chunkY - The vertical grid coordinate of the chunk.
   * @param {number} chunkSize - The size of the chunk in tiles.
   * @param {number} tileSize - The size of each tile in pixels.
   * @returns {Phaser.Physics.Arcade.StaticGroup} A group containing the new terrain.
   */
  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const newPlatforms = this.scene.physics.add.staticGroup();

    // Only generate a floor for chunks at y = 1 to create a ground level
    if (chunkY === 1) {
      for (let x = 0; x < chunkSize; x++) {
        const tileWorldX = (chunkX * chunkSize) + x;
        const tileWorldY = (chunkY * chunkSize); // Place all tiles at the top of the chunk

        const platformX = tileWorldX * tileSize + tileSize / 2;
        const platformY = tileWorldY * tileSize + tileSize / 2;

        const platform = newPlatforms.create(platformX, platformY, null)
          .setSize(tileSize, tileSize)
          .setVisible(true);

        platform.refreshBody();
      }
    }
    return newPlatforms;
  }
}
