import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

export default class GameScene extends Phaser.Scene {
  constructor() {
    // The key 'default' is used to identify this scene.
    super('default');
  }

  init(data) {
    this.levelGenerator = data.levelGenerator || new LevelGenerator(this, this.createPlayerCapabilitiesProfile());
  }

  preload() {
    // Load the sprite sheets for the player character.
    this.load.spritesheet('idle', 'assets/sprites/idle.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk', 'assets/sprites/walk.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sprint', 'assets/sprites/sprint.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/sprites/jump.svg', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // In create()
    this.WALK_SPEED = 200;
    this.SPRINT_SPEED = 450;
    this.BASE_JUMP_FORCE = -650;
    this.SPRINT_JUMP_FORCE = -750;
    this.WALL_SLIDE_SPEED = 100;
    this.WALL_JUMP_FORCE_Y = -550;
    this.WALL_JUMP_FORCE_X = 450;
    this.WALL_JUMP_LOCKOUT = 250; // ms of input lockout

    // In create(), near this.isAIControlled
    this.isWallJumping = false;
    this.isAISprinting = false;
    // At the top of the create() method
    this.isAIControlled = true; // Start in AI mode by default
    this.aiAction = 'idle';     // Stores the AI's current horizontal movement
    this.lastDirection = 'right'; // 'left' or 'right'

    // This method is called once when the scene is created.
    // Set the background color to white.
    this.cameras.main.setBackgroundColor('#ffffff');

    // --- World & Chunk Management Setup ---
    this.TILE_SIZE = 32;
    this.CHUNK_SIZE = 64; // Chunks are 64x64 tiles
    this.activeChunks = new Map();
    this.playerChunkCoord = { x: 0, y: 0 };
    if (!this.levelGenerator) {
        this.levelGenerator = new LevelGenerator(this, this.createPlayerCapabilitiesProfile());
    }


    // --- Initial World Generation and Player Setup ---
    // Create a simple black texture for platforms
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
    graphics.generateTexture('platform', this.TILE_SIZE, this.TILE_SIZE);
    graphics.destroy();
    // Generate the initial chunk and get the spawn point
    const { platforms: initialPlatforms, spawnPoint } = this.levelGenerator.generateInitialChunkAndSpawnPoint(this.CHUNK_SIZE, this.TILE_SIZE);

    // Create the player at the dynamic spawn point
    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'idle');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(false); // World bounds are managed by chunk loading

    // Store the initial chunk in our active chunks map
    const initialCollider = this.physics.add.collider(this.player, initialPlatforms);
    this.activeChunks.set('0,0', { platforms: initialPlatforms, collider: initialCollider });

    // --- Camera ---
    this.cameras.main.startFollow(this.player);

    // --- Initial Chunk Loading ---
    // The initial chunk is already loaded, so we just need to load surrounding ones.
    // We'll set the player's initial chunk coordinate and then call updateActiveChunks.
    this.playerChunkCoord = {
        x: Math.floor(this.player.x / (this.CHUNK_SIZE * this.TILE_SIZE)),
        y: Math.floor(this.player.y / (this.CHUNK_SIZE * this.TILE_SIZE))
    };
    this.updateActiveChunks();

    // Create animations for the player.
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'sprint',
      frames: this.anims.generateFrameNumbers('sprint', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 1 }),
      frameRate: 5,
      repeat: -1
    });

    this.jumps = 0;
    this.maxJumps = 2;

    // Set up keyboard input.
    // --- INPUT CAPTURE SOLUTION ---
    // We list all the key codes the game should "own"
    const GAME_KEYS = [
      'Space',
      'ShiftLeft',
      'ShiftRight',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD'
    ];

    // Listen for ANY keydown event
    this.input.keyboard.on('keydown', (event) => {
      // Check if the pressed key is one of our designated game keys
      if (GAME_KEYS.includes(event.code)) {
        // THIS IS THE FIX:
        // Stop the browser from performing its default action (like clicking a button)
        event.preventDefault();
      }
    });
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

  createPlayerCapabilitiesProfile() {
    return new PlayerCapabilitiesProfile({
        runSpeed: this.WALK_SPEED,
        gravity: this.physics.config.gravity.y,
        jumpVelocity: -this.BASE_JUMP_FORCE,
        wallSlideSpeed: this.WALL_SLIDE_SPEED,
        wallJumpVelocity: new Phaser.Math.Vector2(this.WALL_JUMP_FORCE_X, this.WALL_JUMP_FORCE_Y),
      });
  }

  togglePlayerControl(isUICall = false) {
    if (!isUICall) {
      // If the call is not from the UI, check if AI is already active.
      // If AI is active, do nothing. This prevents accidental toggling from keyboard events.
      if (this.isAIControlled) {
        return !this.isAIControlled;
      }
    }

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
    // --- Dynamic Chunk Loading/Unloading ---
    const playerWorldX = this.player.x;
    const playerWorldY = this.player.y;

    const chunkX = Math.floor(playerWorldX / (this.CHUNK_SIZE * this.TILE_SIZE));
    const chunkY = Math.floor(playerWorldY / (this.CHUNK_SIZE * this.TILE_SIZE));

    // If the player has moved to a new chunk, update the world
    if (chunkX !== this.playerChunkCoord.x || chunkY !== this.playerChunkCoord.y) {
      this.playerChunkCoord = { x: chunkX, y: chunkY };
      this.updateActiveChunks();
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

      // Wall slide and jump logic
      const onWallLeft = this.player.body.touching.left && !this.player.body.touching.down;
      const onWallRight = this.player.body.touching.right && !this.player.body.touching.down;
      let isWallSliding = false;

      if ((onWallLeft && (this.cursors.left.isDown || this.keys.left.isDown)) ||
          (onWallRight && (this.cursors.right.isDown || this.keys.right.isDown))) {
        isWallSliding = true;
      }

      if (isWallSliding) {
        this.player.setVelocityY(this.WALL_SLIDE_SPEED);
      }

      // Horizontal Movement
      if (!this.isWallJumping) {
        const isPressingLeft = this.cursors.left.isDown || this.keys.left.isDown;
        const isPressingRight = this.cursors.right.isDown || this.keys.right.isDown;

        if (isPressingLeft) {
          // Prevents sticking to walls when on the ground
          if (this.player.body.blocked.left && !isWallSliding) {
            this.player.setVelocityX(0);
          } else {
            this.player.setVelocityX(-targetSpeed);
          }
          this.lastDirection = 'left';
        } else if (isPressingRight) {
          // Prevents sticking to walls when on the ground
          if (this.player.body.blocked.right && !isWallSliding) {
            this.player.setVelocityX(0);
          } else {
            this.player.setVelocityX(targetSpeed);
          }
          this.lastDirection = 'right';
        } else if (this.player.body.touching.down || this.player.body.blocked.down) {
          // Only stop horizontal movement if on the ground
          this.player.setVelocityX(0);
        }
      }

      // Jumping
      if (isJumpKeyDown) {
        if (isWallSliding) {
          // Wall jump
          this.isWallJumping = true;
          const wallJumpX = onWallLeft ? this.WALL_JUMP_FORCE_X : -this.WALL_JUMP_FORCE_X;
          this.player.setVelocity(wallJumpX, this.WALL_JUMP_FORCE_Y);

          this.time.addEvent({
            delay: this.WALL_JUMP_LOCKOUT,
            callback: () => {
              this.isWallJumping = false;
            },
            callbackScope: this
          });
        } else if (this.jumps < this.maxJumps) {
          // Regular jump
          this.jumps++;
          const jumpForce = isSprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
          this.player.setVelocityY(jumpForce);
        }
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
    if (!this.isAIControlled) return;

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

  // --- New Chunk Management Method ---
  updateActiveChunks() {
    const { x: playerChunkX, y: playerChunkY } = this.playerChunkCoord;
    const loadRadius = 1; // Load a 3x3 grid of chunks (1 chunk in each direction)
    const newActiveChunks = new Map();

    // Identify and load chunks in the new radius
    for (let y = playerChunkY - loadRadius; y <= playerChunkY + loadRadius; y++) {
      for (let x = playerChunkX - loadRadius; x <= playerChunkX + loadRadius; x++) {
        const chunkKey = `${x},${y}`;
        let chunkData = this.activeChunks.get(chunkKey);

        if (chunkData) {
          // The chunk is already active, so just carry it over
          newActiveChunks.set(chunkKey, chunkData);
        } else {
          // This is a new chunk that needs to be generated
          const { platforms: newChunkPlatforms } = this.levelGenerator.generateChunk(x, y, this.CHUNK_SIZE, this.TILE_SIZE);
          const newCollider = this.physics.add.collider(this.player, newChunkPlatforms);
          newActiveChunks.set(chunkKey, { platforms: newChunkPlatforms, collider: newCollider });
        }
      }
    }

    // Unload old chunks that are no longer in the active radius
    for (const [key, chunkData] of this.activeChunks.entries()) {
      if (!newActiveChunks.has(key)) {
        if (chunkData) {
          // Destroy the platforms and their physics bodies
          chunkData.platforms.destroy(true, true);
          // Destroy the collider object
          chunkData.collider.destroy();
        }
      }
    }

    // Replace the old map with the new one
    this.activeChunks = newActiveChunks;
  }
}
