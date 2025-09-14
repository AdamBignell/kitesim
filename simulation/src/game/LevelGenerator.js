import * as Phaser from 'phaser';

export default class LevelGenerator { constructor(scene) { this.scene = scene; }
/**

Generates a series of traversable platforms.
@param {Phaser.Physics.Arcade.StaticGroup} platformsGroup - The group to add platforms to.
@param {number} numPlatforms - The total number of platforms to generate. */
  generate(platformsGroup, numPlatforms) {
    // --- Define Character Jump Constraints --- // These values determine how far apart platforms can be.
    const MAX_JUMP_WIDTH = 250;
    const MIN_JUMP_WIDTH = 80;
    const MAX_JUMP_HEIGHT = 200;
    const { width, height } = this.scene.scale;

    // 1. Create the starting floor platform
    const floor = this.scene.add.rectangle(width / 2, height, width, 40);
    platformsGroup.add(floor);


    let lastPlatform = { x: 100, y: height - 50 };

    // 2. Generate the main platforms
    for (let i = 0; i < numPlatforms; i++) {
      const nextX = lastPlatform.x + Phaser.Math.Between(MIN_JUMP_WIDTH, MAX_JUMP_WIDTH);
      const nextY = lastPlatform.y + Phaser.Math.Between(-MAX_JUMP_HEIGHT, MAX_JUMP_HEIGHT);

      // Clamp Y to stay within a reasonable vertical range
      const clampedY = Phaser.Math.Clamp(nextY, height * 0.25, height * 0.9);

      // If the next platform is off-screen horizontally, wrap it around
      if (nextX > width - 100) {
        lastPlatform = { x: 100, y: height - 50 };
        continue; // Skip this iteration and start fresh on the left
      }

      const platformWidth = Phaser.Math.Between(100, 250);
      const platform = this.scene.add.rectangle(nextX, clampedY, platformWidth, 20, 0x000000);
      platformsGroup.add(platform);

      lastPlatform = { x: nextX, y: clampedY };
    }

    platformsGroup.refresh();
} }
