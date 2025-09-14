import * as Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    // The key 'GameScene' is used to identify this scene.
    super('GameScene');
  }

  preload() {
    // Create a texture for the player character.
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0000ff, 1);
    // The circle is drawn at (16, 16) with a radius of 16,
    // so the texture will be 32x32.
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
  }

  create() {
    // This method is called once when the scene is created.
    // Set the background color to white.
    this.cameras.main.setBackgroundColor('#ffffff');

    // Create a static group for platforms.
    const platforms = this.physics.add.staticGroup();

    // Create the ground and two platforms.
    // We create them as black rectangles and then add them to the static physics group.
    const ground = this.add.rectangle(400, 584, 800, 32, 0x000000);
    platforms.add(ground);

    const platform1 = this.add.rectangle(600, 450, 200, 32, 0x000000);
    platforms.add(platform1);

    const platform2 = this.add.rectangle(200, 350, 200, 32, 0x000000);
    platforms.add(platform2);

    // After adding Game Objects to a static group, we must refresh the group.
    // This creates the physics bodies for the objects, making them solid.
    platforms.refresh();

    // Create the player sprite.
    this.player = this.physics.add.sprite(100, 450, 'player');
    // Set the physics body to a circle to match the visual representation.
    this.player.setCircle(16);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Add a collider between the player and the platforms.
    this.physics.add.collider(this.player, platforms);

    // Set up keyboard input.
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // This is where the main simulation logic will go.
    if (!this.cursors || !this.player) {
      // Do nothing if cursors or player are not initialized yet.
      return;
    }

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    // Jumping
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-550);
    }
  }
}
