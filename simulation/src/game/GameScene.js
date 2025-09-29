import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

/**
 * @class GameScene
 * @description The main Phaser scene for the game. It is designed to be physics-agnostic.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('default');
  }

  /**
   * Initializes the scene with data passed from the scene manager.
   * @param {object} data - The initialization data.
   * @param {PhysicsAdapter} data.physicsAdapter - The adapter for the active physics engine.
   */
  init(data) {
    if (!data.physicsAdapter) {
        throw new Error("GameScene requires a 'physicsAdapter' in its init data.");
    }
    this.physicsAdapter = data.physicsAdapter;
    this.constants = this.physicsAdapter.getConstants();

    this.levelGenerator = new LevelGenerator(this, this.createPlayerCapabilitiesProfile(), this.physicsAdapter);
  }

  preload() {
    this.load.spritesheet('idle', 'assets/sprites/idle.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk', 'assets/sprites/walk.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sprint', 'assets/sprites/sprint.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/sprites/jump.svg', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.physicsAdapter.initialize();

    // State variables
    this.isWallJumping = false;
    this.isAISprinting = false;
    this.isAIControlled = true;
    this.aiAction = 'idle';
    this.lastDirection = 'right';
    this.jumps = 0;
    this.maxJumps = 2;

    this.cameras.main.setBackgroundColor('#ffffff');

    // World & Chunk Management
    this.TILE_SIZE = 32;
    this.CHUNK_SIZE = 64;
    this.activeChunks = new Map();
    this.playerChunkCoord = { x: 0, y: 0 };

    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
    graphics.generateTexture('platform_solid', this.TILE_SIZE, this.TILE_SIZE);
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
    graphics.generateTexture('platform_one_way', this.TILE_SIZE, this.TILE_SIZE);
    graphics.fillStyle(0x808080, 1);
    graphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
    graphics.generateTexture('platform_prefab', this.TILE_SIZE, this.TILE_SIZE);
    graphics.destroy();

    const { platforms, oneWayPlatforms, spawnPoint } = this.levelGenerator.generateInitialChunkAndSpawnPoint(this.CHUNK_SIZE, this.TILE_SIZE);

    this.player = this.physicsAdapter.createPlayer(spawnPoint.x, spawnPoint.y);

    const initialCollider = this.physicsAdapter.addCollider(this.player, platforms);
    let initialOneWayCollider = null;
    if (oneWayPlatforms) {
        const processCallback = (player, platform) => {
            if (player.body.velocity.y < 0) {
                return false;
            }
            return player.y + player.height / 2 <= platform.y;
        };
        initialOneWayCollider = this.physicsAdapter.addCollider(this.player, oneWayPlatforms, null, processCallback);
    }

    this.activeChunks.set('0,0', { platforms, oneWayPlatforms, collider: initialCollider, oneWayCollider: initialOneWayCollider });

    this.cameras.main.startFollow(this.player);

    this.playerChunkCoord = {
        x: Math.floor(this.player.x / (this.CHUNK_SIZE * this.TILE_SIZE)),
        y: Math.floor(this.player.y / (this.CHUNK_SIZE * this.TILE_SIZE))
    };
    this.updateActiveChunks();

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'sprint', frames: this.anims.generateFrameNumbers('sprint', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 1 }), frameRate: 5, repeat: -1 });

    const GAME_KEYS = ['Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    this.input.keyboard.on('keydown', (event) => { if (GAME_KEYS.includes(event.code)) { event.preventDefault(); } });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', space: 'SPACE' });

    this.time.addEvent({ delay: 2000, callback: this.updateAIAction, callbackScope: this, loop: true });
  }

  createPlayerCapabilitiesProfile() {
    const gravity = this.physicsAdapter.getGravity().y;
    return new PlayerCapabilitiesProfile({
        runSpeed: this.constants.WALK_SPEED,
        gravity: gravity,
        jumpVelocity: -this.constants.BASE_JUMP_FORCE,
        wallSlideSpeed: this.constants.WALL_SLIDE_SPEED,
        wallJumpVelocity: new Phaser.Math.Vector2(this.constants.WALL_JUMP_FORCE_X, this.constants.WALL_JUMP_FORCE_Y),
    });
  }

  togglePlayerControl(isUICall = false) {
    if (!isUICall && this.isAIControlled) return !this.isAIControlled;
    this.isAIControlled = !this.isAIControlled;
    if (!this.isAIControlled) {
      this.physicsAdapter.setPlayerVelocityX(this.player, 0);
    }
    return !this.isAIControlled;
  }

  update() {
    const chunkX = Math.floor(this.player.x / (this.CHUNK_SIZE * this.TILE_SIZE));
    const chunkY = Math.floor(this.player.y / (this.CHUNK_SIZE * this.TILE_SIZE));
    if (chunkX !== this.playerChunkCoord.x || chunkY !== this.playerChunkCoord.y) {
      this.playerChunkCoord = { x: chunkX, y: chunkY };
      this.updateActiveChunks();
    }

    const collisions = this.physicsAdapter.checkCollisions(this.player);
    const { onGround, onWallLeft, onWallRight } = collisions;

    if (onGround) {
      this.jumps = 0;
    }

    const isJumpKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (this.isAIControlled) {
      const targetSpeed = this.isAISprinting ? this.constants.SPRINT_SPEED : this.constants.WALK_SPEED;
      if (this.aiAction === 'left') this.physicsAdapter.setPlayerVelocityX(this.player, -targetSpeed);
      else if (this.aiAction === 'right') this.physicsAdapter.setPlayerVelocityX(this.player, targetSpeed);
      else this.physicsAdapter.setPlayerVelocityX(this.player, 0);
    } else {
      const isSprinting = this.keyShift.isDown;
      const targetSpeed = isSprinting ? this.constants.SPRINT_SPEED : this.constants.WALK_SPEED;
      const isPressingLeft = this.cursors.left.isDown || this.keys.left.isDown;
      const isPressingRight = this.cursors.right.isDown || this.keys.right.isDown;

      const isWallSliding = (onWallLeft && isPressingLeft) || (onWallRight && isPressingRight);
      if (isWallSliding && this.physicsAdapter.getPlayerVelocity(this.player).y >= 0) {
        this.physicsAdapter.setPlayerVelocityY(this.player, this.constants.WALL_SLIDE_SPEED);
      }

      if (!this.isWallJumping) {
        if (isPressingLeft) {
          this.physicsAdapter.setPlayerVelocityX(this.player, -targetSpeed);
          this.lastDirection = 'left';
        } else if (isPressingRight) {
          this.physicsAdapter.setPlayerVelocityX(this.player, targetSpeed);
          this.lastDirection = 'right';
        } else {
          this.physicsAdapter.setPlayerVelocityX(this.player, 0);
        }
      }

      if (isJumpKeyDown) {
        if (isWallSliding) {
          this.isWallJumping = true;
          const wallJumpX = onWallLeft ? this.constants.WALL_JUMP_FORCE_X : -this.constants.WALL_JUMP_FORCE_X;
          this.physicsAdapter.setPlayerVelocity(this.player, wallJumpX, this.constants.WALL_JUMP_FORCE_Y);
          this.time.addEvent({ delay: this.constants.WALL_JUMP_LOCKOUT, callback: () => { this.isWallJumping = false; } });
        } else if (this.jumps < this.maxJumps) {
          this.jumps++;
          const jumpForce = isSprinting ? this.constants.SPRINT_JUMP_FORCE : this.constants.BASE_JUMP_FORCE;
          this.physicsAdapter.setPlayerVelocityY(this.player, jumpForce);
        }
      }
    }

    const velocity = this.physicsAdapter.getPlayerVelocity(this.player);
    if (!onGround) {
      this.player.anims.play('jump', true);
    } else if (Math.abs(velocity.x) > 0.1) {
      const isSprinting = this.isAIControlled ? this.isAISprinting : this.keyShift.isDown;
      this.player.anims.play(isSprinting ? 'sprint' : 'walk', true);
    } else {
      this.player.anims.play('idle', true);
    }

    if (velocity.x < -0.1) { this.player.setFlipX(true); }
    else if (velocity.x > 0.1) { this.player.setFlipX(false); }
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
      const jumpForce = this.isAISprinting ? this.constants.SPRINT_JUMP_FORCE : this.constants.BASE_JUMP_FORCE;
      this.physicsAdapter.setPlayerVelocityY(this.player, jumpForce);
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
          const { platforms, oneWayPlatforms } = this.levelGenerator.generateChunk(x, y, this.CHUNK_SIZE, this.TILE_SIZE);
          const collider = this.physicsAdapter.addCollider(this.player, platforms);
          let oneWayCollider = null;
          if (oneWayPlatforms) {
              const processCallback = (player, platform) => player.body.velocity.y >= 0;
              oneWayCollider = this.physicsAdapter.addCollider(this.player, oneWayPlatforms, null, processCallback);
          }
          newActiveChunks.set(chunkKey, { platforms, oneWayPlatforms, collider, oneWayCollider });
        }
      }
    }

    for (const [key, chunkData] of this.activeChunks.entries()) {
      if (!newActiveChunks.has(key) && chunkData) {
        if (chunkData.platforms) chunkData.platforms.destroy();
        if (chunkData.oneWayPlatforms) chunkData.oneWayPlatforms.destroy();
        if (chunkData.collider) chunkData.collider.destroy();
        if (chunkData.oneWayCollider) chunkData.oneWayCollider.destroy();
      }
    }
    this.activeChunks = newActiveChunks;
  }
}