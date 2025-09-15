import { Noise } from 'noisejs';

export default class LevelGenerator {
  constructor(scene) {
    this.scene = scene;
    // The seed ensures the same world is generated every time.
    // Change the seed to get a new world.
    this.noise = new Noise(Math.random());
  }

  /**
   * Generates tile data for a single chunk at a given chunk coordinate.
   * @param {number} chunkX - The horizontal grid coordinate of the chunk.
   * @param {number} chunkY - The vertical grid coordinate of the chunk.
   * @param {number} chunkSize - The size of the chunk in tiles.
   * @param {number} tileSize - The size of each tile in pixels.
   * @returns {Phaser.Physics.Arcade.StaticGroup} A group containing the new terrain.
   */
  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const newPlatforms = this.scene.physics.add.staticGroup();
    const NOISE_SCALE = 0.1; // Controls the "zoom" of the caves. Higher = smaller caves.
    const TERRAIN_THRESHOLD = 0.5; // Determines how much empty space vs. solid ground.

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        // Calculate the tile's absolute world position
        const tileWorldX = (chunkX * chunkSize) + x;
        const tileWorldY = (chunkY * chunkSize) + y;

        // Get a Perlin noise value for this world coordinate
        const noiseValue = this.noise.perlin2(tileWorldX * NOISE_SCALE, tileWorldY * NOISE_SCALE);

        // If the noise value is above a threshold, create a solid tile
        if (noiseValue > TERRAIN_THRESHOLD) {
          const platformX = tileWorldX * tileSize + tileSize / 2;
          const platformY = tileWorldY * tileSize + tileSize / 2;

          const platform = newPlatforms.create(platformX, platformY, null)
            .setSize(tileSize, tileSize)
            .setVisible(false); // We'll make these visible for debugging later if needed

          platform.refreshBody();
        }
      }
    }
    return newPlatforms;
  }
}
