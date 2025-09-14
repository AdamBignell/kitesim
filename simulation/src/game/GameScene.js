import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator'; // Add this at the top

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
    // In create()
    this.WALK_SPEED = 200;
    this.SPRINT_SPEED = 350;
    this.BASE_JUMP_FORCE = -650;
    this.SPRINT_JUMP_FORCE = -750;

    // In create(), near this.isAIControlled
    this.isAISprinting = false;
    // At the top of the create() method
    this.isAIControlled = true; // Start in AI mode by default
    this.aiAction = 'idle';     // Stores the AI's current horizontal movement

    // This method is called once when the scene is created.
    // Set the background color to white.
    this.cameras.main.setBackgroundColor('#ffffff');
    // In the create() method: this.levelGenerator = new LevelGenerator(this);
    this.levelGenerator = new LevelGenerator(this);

    // Create a static group for platforms.
    this.platforms = this.physics.add.staticGroup();

    this.redrawLevel(this.scale.gameSize);

    // Create the player sprite.
    this.player = this.physics.add.sprite(100, 450, 'player');
    // Set the physics body to a circle to match the visual representation.
    this.player.setCircle(16);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Add a collider between the player and the platforms.
    this.physics.add.collider(this.player, this.platforms);

    this.jumps = 0;
    this.maxJumps = 2;

    // Set up keyboard input.
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
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
      const targetSpeed = this.isAISprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

      if (this.aiAction === 'left') {
        this.player.setVelocityX(-targetSpeed);
      } else if (this.aiAction === 'right') {
        this.player.setVelocityX(targetSpeed);
      } else { // 'idle'
        this.player.setVelocityX(0);
      }
    } else {
      // --- Player Control Logic ---
      const isSprinting = this.keyShift.isDown;
      const targetSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

      // Horizontal Movement
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-targetSpeed);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(targetSpeed);
      } else {
        this.player.setVelocityX(0);
      }

      // Jumping
      if (this.cursors.up.isDown && this.player.body.touching.down) {
        const jumpForce = isSprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
        this.player.setVelocityY(jumpForce);
      }
    }
  }

  updateAIAction() {
    if (!this.isAIControlled) return; // Your bug fix line

    // 1. Decide horizontal action
    const rand = Math.random();
    if (rand < 0.4) {
      this.aiAction = 'left';
    } else if (rand < 0.8) {
      this.aiAction = 'right';
    } else {
      this.aiAction = 'idle';
    }

    // 2. Decide sprint state (40% chance to sprint)
    this.isAISprinting = Math.random() < 0.4;

    // 3. Decide to jump (only if on ground)
    if (this.player.body.touching.down) {
      // 30% chance to attempt a jump
      if (Math.random() < 0.3) {
        // Use the correct jump force based on sprint state
        const jumpForce = this.isAISprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
        this.player.setVelocityY(jumpForce);
      }
    }
  }
  // In GameScene.js, replace the contents of redrawLevel with this:
  redrawLevel(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    // Update the world bounds
    this.physics.world.setBounds(0, 0, width, height);

    // Clear any previous platforms
    this.platforms.clear(true, true);

    // Generate a new, traversable level with 20 platforms
    this.levelGenerator.generate(this.platforms, 20);
  }
}
