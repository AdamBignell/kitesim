import * as Phaser from 'phaser';

export default class LevelGenerator { constructor(scene) { this.scene = scene; }
/**

Generates a series of traversable platforms.
@param {Phaser.Physics.Arcade.StaticGroup} platformsGroup - The group to add platforms to.
@param {number} numPlatforms - The total number of platforms to generate. */
  generate(platformsGroup) {
    const { width, height } = this.scene.scale;
    const wallThickness = 20;
    const openingSize = 100;

    // --- Create Outer Walls with Openings ---

    // Floor (with opening)
    const floorLeftWidth = width / 2 - openingSize / 2;
    const floorRightWidth = width / 2 - openingSize / 2;
    const floorLeft = this.scene.add.rectangle(floorLeftWidth / 2, height - wallThickness / 2, floorLeftWidth, wallThickness, 0x000000);
    const floorRight = this.scene.add.rectangle(width - floorRightWidth / 2, height - wallThickness / 2, floorRightWidth, wallThickness, 0x000000);
    platformsGroup.add(floorLeft);
    platformsGroup.add(floorRight);

    // Ceiling (with opening)
    const ceilLeftWidth = width / 2 - openingSize / 2;
    const ceilRightWidth = width / 2 - openingSize / 2;
    const ceilLeft = this.scene.add.rectangle(ceilLeftWidth / 2, wallThickness / 2, ceilLeftWidth, wallThickness, 0x000000);
    const ceilRight = this.scene.add.rectangle(width - ceilRightWidth / 2, wallThickness / 2, ceilRightWidth, wallThickness, 0x000000);
    platformsGroup.add(ceilLeft);
    platformsGroup.add(ceilRight);

    // Left Wall (with opening)
    const leftWallTopHeight = height / 2 - openingSize / 2;
    const leftWallBottomHeight = height / 2 - openingSize / 2;
    const leftWallTop = this.scene.add.rectangle(wallThickness / 2, leftWallTopHeight / 2, wallThickness, leftWallTopHeight, 0x000000);
    const leftWallBottom = this.scene.add.rectangle(wallThickness / 2, height - leftWallBottomHeight / 2, wallThickness, leftWallBottomHeight, 0x000000);
    platformsGroup.add(leftWallTop);
    platformsGroup.add(leftWallBottom);

    // Right Wall (with opening)
    const rightWallTopHeight = height / 2 - openingSize / 2;
    const rightWallBottomHeight = height / 2 - openingSize / 2;
    const rightWallTop = this.scene.add.rectangle(width - wallThickness / 2, rightWallTopHeight / 2, wallThickness, rightWallTopHeight, 0x000000);
    const rightWallBottom = this.scene.add.rectangle(width - wallThickness / 2, height - rightWallBottomHeight / 2, wallThickness, rightWallBottomHeight, 0x000000);
    platformsGroup.add(rightWallTop);
    platformsGroup.add(rightWallBottom);

    // --- Add Internal Platforms for Traversal ---

    // Central starting platform
    const centerPlatform = this.scene.add.rectangle(width / 2, height - 100, 150, 20, 0x000000);
    platformsGroup.add(centerPlatform);

    // Platforms to reach side openings
    const leftMidPlatform = this.scene.add.rectangle(150, height / 2 + 50, 100, 20, 0x000000);
    const rightMidPlatform = this.scene.add.rectangle(width - 150, height / 2 + 50, 100, 20, 0x000000);
    platformsGroup.add(leftMidPlatform);
    platformsGroup.add(rightMidPlatform);

    // Platform to reach top opening
    const topPlatform = this.scene.add.rectangle(width / 2, 150, 100, 20, 0x000000);
    platformsGroup.add(topPlatform);


    platformsGroup.refresh();
  }
}
