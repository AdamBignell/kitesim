import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('default');
    // Collision flags, will be updated by Matter.js events
    this.onGround = false;
    this.onWallLeft = false;
    this.onWallRight = false;
  }

  init(data) {
    this.levelGenerator = data.levelGenerator || new LevelGenerator(this, this.createPlayerCapabilitiesProfile());
  }

  preload() {
    this.load.spritesheet('idle', 'assets/sprites/idle.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk', 'assets/sprites/walk.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sprint', 'assets/sprites/sprint.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/sprites/jump.svg', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // --- MOVEMENT CONSTANTS (ADJUSTED FOR MATTER.JS) ---
    // These values are lower because Matter.js interprets velocity differently.
    this.WALK_SPEED = 4;
    this.SPRINT_SPEED = 7;
    this.BASE_JUMP_FORCE = -10; // A negative vertical velocity
    this.SPRINT_JUMP_FORCE = -12;
    this.WALL_SLIDE_SPEED = 2; // A gentle downward vertical velocity
    this.WALL_JUMP_FORCE_Y = -12;
    this.WALL_JUMP_FORCE_X = 8; // Horizontal velocity
    this.WALL_JUMP_LOCKOUT = 150; // ms

    // --- State Flags ---
    this.isWallJumping = false;
    this.isAISprinting = false;
    this.isAIControlled = true;
    this.aiAction = 'idle';
    this.lastDirection = 'right';

    this.cameras.main.setBackgroundColor('#ffffff');

    // --- World & Chunk Management Setup ---
    this.TILE_SIZE = 32;
    this.CHUNK_SIZE = 64;
    this.activeChunks = new Map();
    this.playerChunkCoord = { x: 0, y: 0 };
    if (!this.levelGenerator) {
        this.levelGenerator = new LevelGenerator(this, this.createPlayerCapabilitiesProfile());
    }

    // --- Initial World Generation ---
    const { platforms: initialPlatforms, spawnPoint } = this.levelGenerator.generateInitialChunkAndSpawnPoint(this.CHUNK_SIZE, this.TILE_SIZE);

    // --- PLAYER CREATION (MATTER.JS) ---
    this.player = this.matter.add.sprite(spawnPoint.x, spawnPoint.y, 'idle', null, {
      label: 'player' // A label for easy identification in collision events
    });

    // Define the player's collision shape
    const { width, height } = this.player;
    this.player.setRectangle(width * 0.8, height, { chamfer: { radius: 5 } }); // Make body slightly thinner and with rounded corners to prevent snagging
    this.player.setFixedRotation(); // IMPORTANT: Prevents the player from falling over
    this.player.setFriction(0.01);  // Use low friction for responsive movement

    // Store the initial chunk. No separate collider object is needed for Matter.js.
    this.activeChunks.set('0,0', { platforms: initialPlatforms });

    // --- Camera ---
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.5);

    // --- Initial Chunk Loading ---
    this.playerChunkCoord = {
        x: Math.floor(this.player.x / (this.CHUNK_SIZE * this.TILE_SIZE)),
        y: Math.floor(this.player.y / (this.CHUNK_SIZE * this.TILE_SIZE))
    };
    this.updateActiveChunks();

    // --- COLLISION HANDLING (MATTER.JS) ---
    this.matter.world.on('collisionactive', (event) => {
      for (let i = 0; i < event.pairs.length; i++) {
        const pair = event.pairs[i];

        let playerBody;
        let otherBody;
        // Identify which body is the player and which is the other object
        if (pair.bodyA.label === 'player') {
          playerBody = pair.bodyA;
          otherBody = pair.bodyB;
        } else if (pair.bodyB.label === 'player') {
          playerBody = pair.bodyB;
          otherBody = pair.bodyA;
        } else {
          continue; // Skip any collisions that don't involve the player
        }

        // Check if the player is colliding with a static body (the terrain)
        if (otherBody.isStatic) {
          const collisionNormal = pair.collision.normal;
          // Check if the collision is from below (the player is on the ground)
          if (collisionNormal.y < -0.5) {
            this.onGround = true;
          }
          // Check if the collision is from the right (player is touching a wall on their left)
          if (collisionNormal.x > 0.5) {
            this.onWallLeft = true;
          }
          // Check if the collision is from the left (player is touching a wall on their right)
          if (collisionNormal.x < -0.5) {
            this.onWallRight = true;
          }
        }
      }
    });

    // --- Player Animations (no changes) ---
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'sprint', frames: this.anims.generateFrameNumbers('sprint', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 1 }), frameRate: 5, repeat: -1 });

    this.jumps = 0;
    this.maxJumps = 2;

    // --- Input Setup (no changes) ---
    const GAME_KEYS = ['Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    this.input.keyboard.on('keydown', (event) => { if (GAME_KEYS.includes(event.code)) { event.preventDefault(); } });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', space: 'SPACE' });

    // --- AI Timer ---
    this.time.addEvent({ delay: 2000, callback: this.updateAIAction, callbackScope: this, loop: true });
  }

  createPlayerCapabilitiesProfile() {
    return new PlayerCapabilitiesProfile({
        runSpeed: this.WALK_SPEED,
        gravity: this.matter.config.gravity.y, // Use gravity from Matter config
        jumpVelocity: this.BASE_JUMP_FORCE,
        wallSlideSpeed: this.WALL_SLIDE_SPEED,
        wallJumpVelocity: new Phaser.Math.Vector2(this.WALL_JUMP_FORCE_X, this.WALL_JUMP_FORCE_Y),
    });
  }

  togglePlayerControl(isUICall = false) {
    if (!isUICall && this.isAIControlled) return !this.isAIControlled;
    this.isAIControlled = !this.isAIControlled;
    if (!this.isAIControlled) this.player.setVelocityX(0);
    return !this.isAIControlled;
  }

  update() {
    // --- Reset collision flags at the start of each frame ---
    // The 'collisionactive' event will set them to true if a collision is ongoing.
    this.onGround = false;
    this.onWallLeft = false;
    this.onWallRight = false;

    // --- Dynamic Chunk Loading ---
    const playerWorldX = this.player.x;
    const playerWorldY = this.player.y;
    const chunkX = Math.floor(playerWorldX / (this.CHUNK_SIZE * this.TILE_SIZE));
    const chunkY = Math.floor(playerWorldY / (this.CHUNK_SIZE * this.TILE_SIZE));

    if (chunkX !== this.playerChunkCoord.x || chunkY !== this.playerChunkCoord.y) {
      this.playerChunkCoord = { x: chunkX, y: chunkY };
      this.updateActiveChunks();
    }

    // Reset jumps if on the ground
    if (this.onGround) {
      this.jumps = 0;
    }

    const isJumpKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (this.isAIControlled) {
      // --- AI Control Logic ---
      const targetSpeed = this.isAISprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      if (this.aiAction === 'left') this.player.setVelocityX(-targetSpeed);
      else if (this.aiAction === 'right') this.player.setVelocityX(targetSpeed);
      else this.player.setVelocityX(0);
    } else {
      // --- Player Control Logic ---
      const isSprinting = this.keyShift.isDown;
      const targetSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      const isPressingLeft = this.cursors.left.isDown || this.keys.left.isDown;
      const isPressingRight = this.cursors.right.isDown || this.keys.right.isDown;

      // Wall slide logic
      const isWallSliding = ((this.onWallLeft && isPressingLeft) || (this.onWallRight && isPressingRight)) && !this.onGround;
      if (isWallSliding) {
        this.player.setVelocityY(this.WALL_SLIDE_SPEED);
      }

      // Horizontal Movement
      if (!this.isWallJumping) {
        if (isPressingLeft) {
          this.player.setVelocityX(-targetSpeed);
        } else if (isPressingRight) {
          this.player.setVelocityX(targetSpeed);
        } else {
          this.player.setVelocityX(0); // Stop if no horizontal input
        }
      }

      // Jumping
      if (isJumpKeyDown) {
        if (isWallSliding) {
          this.isWallJumping = true;
          const wallJumpX = this.onWallLeft ? this.WALL_JUMP_FORCE_X : -this.WALL_JUMP_FORCE_X;
          this.player.setVelocity(wallJumpX, this.WALL_JUMP_FORCE_Y);
          this.time.addEvent({ delay: this.WALL_JUMP_LOCKOUT, callback: () => { this.isWallJumping = false; }, callbackScope: this });
        } else if (this.jumps < this.maxJumps) {
          this.jumps++;
          const jumpForce = isSprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
          this.player.setVelocityY(jumpForce);
        }
      }
    }

    // --- Animation & Sprite Flipping ---
    const velocity = this.player.body.velocity;
    if (!this.onGround) {
      this.player.anims.play('jump', true);
    } else if (Math.abs(velocity.x) > 0.1) {
      const isSprinting = this.isAIControlled ? this.isAISprinting : this.keyShift.isDown;
      this.player.anims.play(isSprinting ? 'sprint' : 'walk', true);
    } else {
      this.player.anims.play('idle', true);
    }

    if (velocity.x < -0.1) {
      this.player.setFlipX(true);
    } else if (velocity.x > 0.1) {
      this.player.setFlipX(false);
    }
  }

  updateAIAction() {
    if (!this.isAIControlled) return;
    const rand = Math.random();
    if (rand < 0.4) this.aiAction = 'left';
    else if (rand < 0.8) this.aiAction = 'right';
    else this.aiAction = 'idle';
    this.isAISprinting = Math.random() < 0.4;
    if (Math.random() < 0.3 && this.jumps < this.maxJumps) {
      this.jumps++;
      const jumpForce = this.isAISprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
      this.player.setVelocityY(jumpForce);
    }
  }

  updateActiveChunks() {
    const { x: playerChunkX, y: playerChunkY } = this.playerChunkCoord;
    const loadRadius = 1;
    const newActiveChunks = new Map();

    for (let y = playerChunkY - loadRadius; y <= playerChunkY + loadRadius; y++) {
      for (let x = playerChunkX - loadRadius; x <= playerChunkX + loadRadius; x++) {
        const chunkKey = `${x},${y}`;
        let chunkData = this.activeChunks.get(chunkKey);
        if (chunkData) {
          newActiveChunks.set(chunkKey, chunkData);
        } else {
          const { platforms: newChunkPlatforms } = this.levelGenerator.generateChunk(x, y, this.CHUNK_SIZE, this.TILE_SIZE);
          newActiveChunks.set(chunkKey, { platforms: newChunkPlatforms });
        }
      }
    }

    for (const [key, chunkData] of this.activeChunks.entries()) {
      if (!newActiveChunks.has(key)) {
        if (chunkData && chunkData.platforms) {
          // The container's custom destroy method handles its own cleanup
          chunkData.platforms.destroy();
        }
      }
    }
    this.activeChunks = newActiveChunks;
  }
}
