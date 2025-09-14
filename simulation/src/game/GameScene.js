import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    // The key 'GameScene' is used to identify this scene.
    super('GameScene');
  }

  preload() {
    // This is where we will load assets like images and sounds.
    // For now, it can be empty.
  }

  create() {
    // This method is called once when the scene is created.
    // Let's set the background color of the scene.
    // Use a pleasant, distinct color like cornflower blue.
    this.cameras.main.setBackgroundColor('#6495ED');

    // Add a simple text element to the center of the screen
    // to make it obvious that the scene has loaded.
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'DisasterSword Simulation - V1',
      {
        font: '32px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  update() {
    // This method is called on every frame.
    // This is where the main simulation logic will go.
    // For now, it can be empty.
  }
}
