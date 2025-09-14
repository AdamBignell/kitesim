import * as Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    // The key 'default' is used to identify this scene.
    super('default');
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
    // At the top of the create() method
    this.isAIControlled = true; // Start in AI mode by default
    this.aiAction = 'idle';     // Stores the AI's current horizontal movement

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

    this.jumps = 0;
    this.maxJumps = 2;

    // Set up keyboard input.
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      left: 'A',
      right: 'D',
      space: 'SPACE'
    });

    // In the create() method
    this.time.addEvent({
      delay: 2000, // AI makes a new decision every 2 seconds
      callback: this.updateAIAction,
      callbackScope: this,
      loop: true
    });
  }

  togglePlayerControl() {
    this.isAIControlled = !this.isAIControlled;
    console.log(`Control mode switched. AI active: ${this.isAIControlled}`);

    // If we switch to player control, reset the player's velocity
    if (!this.isAIControlled) {
      this.player.setVelocityX(0);
    }
    // Return the new state of player control
    return !this.isAIControlled;
  }

  update() {
    // 1. Check for falling off the screen
    if (this.player.y > this.game.config.height) {
      this.player.setVelocity(0, 0); // Stop its movement
      this.player.setPosition(100, 450); // Reset to the start position
      return; // Skip the rest of the update loop for this frame
    }

    // Reset jumps if touching the ground
    if (this.player.body.touching.down) {
      this.jumps = 0;
    }

    // Check for jump input
    const isJumpKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                          Phaser.Input.Keyboard.JustDown(this.keys.up) ||
                          Phaser.Input.Keyboard.JustDown(this.keys.space);

    // 2. Check which control mode is active
    if (this.isAIControlled) {
      // --- AI Control Logic ---
      if (this.aiAction === 'left') {
        this.player.setVelocityX(-200);
      } else if (this.aiAction === 'right') {
        this.player.setVelocityX(200);
      } else { // 'idle'
        this.player.setVelocityX(0);
      }
    } else {
      // --- Player Control Logic ---
      if (this.cursors.left.isDown || this.keys.left.isDown) {
        this.player.setVelocityX(-200);
      } else if (this.cursors.right.isDown || this.keys.right.isDown) {
        this.player.setVelocityX(200);
      } else {
        this.player.setVelocityX(0);
      }

      if (isJumpKeyDown && this.jumps < this.maxJumps) {
        this.jumps++;
        this.player.setVelocityY(-550);
      }
    }
  }

  // Add this new method to the GameScene class, outside of create() or update()
  updateAIAction() {
    // Randomly choose a horizontal direction
    const rand = Math.random();
    if (rand < 0.4) {
      this.aiAction = 'left';
    } else if (rand < 0.8) {
      this.aiAction = 'right';
    } else {
      this.aiAction = 'idle';
    }

    // Separately, decide if the AI should try to jump
    if (Math.random() < 0.3 && this.jumps < this.maxJumps) {
      this.jumps++;
      this.player.setVelocityY(-550); // Same jump force as the player
    }
  }
}
