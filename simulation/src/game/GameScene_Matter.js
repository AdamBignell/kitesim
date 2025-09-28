import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator_Matter'; // Point to the new Matter generator
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('default');
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
    this.WALK_SPEED = 4;
    this.SPRINT_SPEED = 7;
    this.BASE_JUMP_FORCE = -10;
    this.SPRINT_JUMP_FORCE = -12;
    this.WALL_SLIDE_SPEED = 2;
    this.WALL_JUMP_FORCE_Y = -12;
    this.WALL_JUMP_FORCE_X = 8;
    this.WALL_JUMP_LOCKOUT = 150;

    this.isWallJumping = false;
    this.isAISprinting = false;
    this.isAIControlled = true;
    this.aiAction = 'idle';
    this.lastDirection = 'right';

    this.cameras.main.setBackgroundColor('#ffffff');

    this.TILE_SIZE = 32;
    this.CHUNK_SIZE = 64;
    this.activeChunks = new Map();
    this.playerChunkCoord = { x: 0, y: 0 };
    if (!this.levelGenerator) {
        this.levelGenerator = new LevelGenerator(this, this.createPlayerCapabilitiesProfile());
    }

    const { platforms: initialPlatforms, spawnPoint } = this.levelGenerator.generateInitialChunkAndSpawnPoint(this.CHUNK_SIZE, this.TILE_SIZE);

    const { width, height } = { width: 32, height: 32 };

    const mainBody = this.matter.bodies.rectangle(0, 0, width * 0.8, height, { chamfer: { radius: 5 } });
    const bottomSensor = this.matter.bodies.rectangle(0, height * 0.5, width * 0.5, 5, { isSensor: true });
    const leftSensor = this.matter.bodies.rectangle(-width * 0.45, 0, 5, height * 0.8, { isSensor: true });
    const rightSensor = this.matter.bodies.rectangle(width * 0.45, 0, 5, height * 0.8, { isSensor: true });

    this.player = this.matter.add.sprite(spawnPoint.x, spawnPoint.y, 'idle', null, {
        parts: [mainBody, bottomSensor, leftSensor, rightSensor],
        friction: 0.01,
        label: 'player'
    });

    this.sensors = {
        bottom: this.player.body.parts[2],
        left: this.player.body.parts[3],
        right: this.player.body.parts[4],
    };

    this.player.setFixedRotation();

    this.activeChunks.set('0,0', { platforms: initialPlatforms });

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.5);

    this.playerChunkCoord = {
        x: Math.floor(this.player.x / (this.CHUNK_SIZE * this.TILE_SIZE)),
        y: Math.floor(this.player.y / (this.CHUNK_SIZE * this.TILE_SIZE))
    };
    this.updateActiveChunks();

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'sprint', frames: this.anims.generateFrameNumbers('sprint', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 1 }), frameRate: 5, repeat: -1 });

    this.jumps = 0;
    this.maxJumps = 2;

    const GAME_KEYS = ['Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    this.input.keyboard.on('keydown', (event) => { if (GAME_KEYS.includes(event.code)) { event.preventDefault(); } });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', space: 'SPACE' });

    this.time.addEvent({ delay: 2000, callback: this.updateAIAction, callbackScope: this, loop: true });
  }

  createPlayerCapabilitiesProfile() {
    return new PlayerCapabilitiesProfile({
        runSpeed: this.WALK_SPEED,
        gravity: this.matter.config.gravity.y,
        jumpVelocity: this.BASE_JUMP_FORCE,
        wallSlideSpeed: this.WALL_SLIDE_SPEED,
        wallJumpVelocity: new Phaser.Math.Vector2(this.WALL_JUMP_FORCE_X, this.WALL_JUMP_FORCE_Y),
    });
  }

  togglePlayerControl() {
    this.isAIControlled = !this.isAIControlled;
    if (!this.isAIControlled) {
      this.player.setVelocityX(0);
    }
    return !this.isAIControlled;
  }

  update() {
    // Sensor-based collision detection
    const allBodies = this.matter.world.getAllBodies();
    const isColliding = (sensor) => {
      const collisions = this.matter.query.collides(sensor, allBodies);
      for (let i = 0; i < collisions.length; i++) {
        const pair = collisions[i];
        const otherBody = pair.bodyA.isSensor ? pair.bodyB : pair.bodyA;
        if (otherBody.isStatic || (otherBody.parent && otherBody.parent.isStatic)) {
          return true;
        }
      }
      return false;
    };
    this.onGround = isColliding(this.sensors.bottom);
    this.onWallLeft = isColliding(this.sensors.left) && !this.onGround;
    this.onWallRight = isColliding(this.sensors.right) && !this.onGround;

    // --- Dynamic Chunk Loading/Unloading ---
    const playerWorldX = this.player.x;
    const playerWorldY = this.player.y;
    const chunkX = Math.floor(playerWorldX / (this.CHUNK_SIZE * this.TILE_SIZE));
    const chunkY = Math.floor(playerWorldY / (this.CHUNK_SIZE * this.TILE_SIZE));
    if (chunkX !== this.playerChunkCoord.x || chunkY !== this.playerChunkCoord.y) {
      this.playerChunkCoord = { x: chunkX, y: chunkY };
      this.updateActiveChunks();
    }

    // Reset jumps if touching the ground
    if (this.onGround) {
      this.jumps = 0;
    }

    // Check for jump input
    const isJumpKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                          Phaser.Input.Keyboard.JustDown(this.keys.up) ||
                          Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (this.isAIControlled) {
      // --- AI Control Logic ---
      const targetSpeed = this.isAISprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      if (this.aiAction === 'left') {
        this.player.setVelocityX(-targetSpeed);
      } else if (this.aiAction === 'right') {
        this.player.setVelocityX(targetSpeed);
      } else {
        this.player.setVelocityX(0);
      }
    } else {
      // --- Player Control Logic ---
      const isSprinting = this.keyShift.isDown;
      const targetSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      const isPressingLeft = this.cursors.left.isDown || this.keys.left.isDown;
      const isPressingRight = this.cursors.right.isDown || this.keys.right.isDown;

      const isWallSliding = (this.onWallLeft && isPressingLeft) || (this.onWallRight && isPressingRight);
      if (isWallSliding) {
        if (this.player.body.velocity.y > this.WALL_SLIDE_SPEED) {
          this.player.setVelocityY(this.WALL_SLIDE_SPEED);
        }
      }

      if (!this.isWallJumping) {
        if (isPressingLeft) {
          this.player.setVelocityX(-targetSpeed);
          this.lastDirection = 'left';
        } else if (isPressingRight) {
          this.player.setVelocityX(targetSpeed);
          this.lastDirection = 'right';
        } else {
          this.player.setVelocityX(0);
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

    // --- Animation Logic ---
    const velocity = this.player.body.velocity;
    if (!this.onGround) {
      this.player.anims.play('jump', true);
    } else if (Math.abs(velocity.x) > 0.1) {
      const isSprinting = this.isAIControlled ? this.isAISprinting : this.keyShift.isDown;
      this.player.anims.play(isSprinting ? 'sprint' : 'walk', true);
    } else {
      this.player.anims.play('idle', true);
    }

    // Flip sprite based on direction
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
          chunkData.platforms.destroy();
        }
      }
    }
    this.activeChunks = newActiveChunks;
  }
}
