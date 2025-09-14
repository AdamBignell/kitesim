import * as Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // ... (Your existing preload logic for the player texture)
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0000ff, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
  }

  create() {
    // Set the background to white so we can see if the scene loads
    this.cameras.main.setBackgroundColor('#ffffff');

    // Create the platforms group once
    this.platforms = this.physics.add.staticGroup();

    // Create the player sprite once
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setCircle(16);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Add the collider between the player and platforms once
    this.physics.add.collider(this.player, this.platforms);

    // Create keyboard cursors
    this.cursors = this.input.keyboard.createCursorKeys();

    // At the top of the create() method
    this.isAIControlled = true; // Start in AI mode by default
    this.aiAction = 'idle';     // Stores the AI's current horizontal movement

    this.jumps = 0;
    this.maxJumps = 2;

    // Set up keyboard input.
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

    // --- Add Resize Listener ---
    // Listen for the resize event
    this.scale.on('resize', this.redrawLevel, this);

    // --- Initial Level Draw ---
    // Manually call redrawLevel once to draw the initial level
    this.redrawLevel({ width: this.scale.width, height: this.scale.height });

    // (Your existing AI logic and Ctrl+G listener can remain here)
  }

  // --- New Centralized Drawing Method ---
  redrawLevel(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Update the world bounds to match the new screen size
    this.physics.world.setBounds(0, 0, width, height);

    // Clear any previous platforms
    this.platforms.clear(true, true);

    // --- Redraw Platforms with Relative Coordinates ---
    // Draw the floor
    this.platforms.create(width / 2, height - 10, null)
      .setSize(width, 20)
      .setVisible(false) // Use physics debug to see it, or create a texture
      .refreshBody();

    // Draw a middle platform
    this.platforms.create(width * 0.5, height * 0.7, null)
      .setSize(width * 0.3, 20)
      .setVisible(false)
      .refreshBody();

    // Draw an upper platform
    this.platforms.create(width * 0.25, height * 0.4, null)
      .setSize(width * 0.2, 20)
      .setVisible(false)
      .refreshBody();
  }

  update() {
    // 1. Check for falling off the screen. Use this.scale.height for dynamic height.
    if (this.player.y > this.scale.height) {
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
