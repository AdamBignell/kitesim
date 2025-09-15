import * as Phaser from 'phaser';
import Room from './Room';
import structures from './structures';
import TraversalValidator from './TraversalValidator';

export default class LevelGenerator {
  constructor(scene) {
    this.scene = scene;
  }

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
    const rightWallTop = this.scene.add.rectangle(width - wallThickness /2, rightWallTopHeight / 2, wallThickness, rightWallTopHeight, 0x000000);
    const rightWallBottom = this.scene.add.rectangle(width - wallThickness / 2, height - rightWallBottomHeight / 2, wallThickness, rightWallBottomHeight, 0x000000);
    platformsGroup.add(rightWallTop);
    platformsGroup.add(rightWallBottom);

    // Generate a traversable room
    let room;
    let isValid = false;
    while (!isValid) {
      room = new Room(20, 15, structures);
      room.generateLayout();
      const validator = new TraversalValidator(room);
      isValid = validator.isTraversable();
    }

    room.render(this.scene, platformsGroup);

    platformsGroup.refresh();
  }
}
