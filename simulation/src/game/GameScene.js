import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator'; // Add this at the top

export default class GameScene extends Phaser.Scene {
  constructor() {
    // The key 'default' is used to identify this scene.
    super('default');
  }

  preload() {
    // Load the sprite sheets for the player character.
    this.load.svg('idle', 'assets/sprites/idle.svg', { width: 32, height: 32 });
    this.load.svg('walk', 'assets/sprites/walk.svg', { width: 32, height: 32 });
    this.load.svg('sprint', 'assets/sprites/sprint.svg', { width: 32, height: 32 });
    this.load.svg('jump', 'assets/sprites/jump.svg', { width: 32, height: 32 });
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
    this.player = this.physics.add.sprite(100, 450, 'idle');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Add a collider between the player and the platforms.
    this.physics.add.collider(this.player, this.platforms);

    // Create animations for the player.
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'idle', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: 'walk',
      frames: [{ key: 'walk', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: 'sprint',
      frames: [{ key: 'sprint', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: 'jump',
      frames: [{ key: 'jump', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

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

    // Reset jumps if touching the ground or the world bounds
    if (this.player.body.touching.down || this.player.body.blocked.down) {
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
      if (isJumpKeyDown && this.jumps < this.maxJumps) {
        this.jumps++;
        const jumpForce = isSprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
        this.player.setVelocityY(jumpForce);
      }
    }

    // Animation logic
    if (!this.player.body.touching.down) {
      this.player.anims.play('jump', true);
    } else if (this.player.body.velocity.x !== 0) {
      const isSprinting = this.isAIControlled ? this.isAISprinting : this.keyShift.isDown;
      this.player.anims.play(isSprinting ? 'sprint' : 'walk', true);
    } else {
      this.player.anims.play('idle', true);
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

    // 3. Decide to jump
    // 30% chance to attempt a jump
    if (Math.random() < 0.3) {
      if (this.jumps < this.maxJumps) {
        // AI can jump if it has jumps left
        this.jumps++;
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
