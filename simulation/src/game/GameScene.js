import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('default');
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
    this.WALK_SPEED = 200;
    this.SPRINT_SPEED = 550;
    this.BASE_JUMP_FORCE = -650;
    this.SPRINT_JUMP_FORCE = -750;
    this.WALL_SLIDE_SPEED = 100;
    this.WALL_JUMP_FORCE_Y = -700;
    this.WALL_JUMP_FORCE_X = 450;
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

    // --- Graphics for terrain ---
    this.terrainGraphics = this.add.graphics();

    // --- Initial World Generation ---
    const { platforms: initialPlatforms, spawnPoint, floorSpline: initialFloorSpline } = this.levelGenerator.generateInitialChunkAndSpawnPoint(this.CHUNK_SIZE, this.TILE_SIZE);

    if (initialFloorSpline) {
        this.drawSpline(initialFloorSpline, 0); // chunkX is 0
    }

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'idle');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(false);

    const initialCollider = this.physics.add.collider(this.player, initialPlatforms);
    this.activeChunks.set('0,0', { platforms: initialPlatforms, collider: initialCollider, spline: initialFloorSpline });

    this.cameras.main.startFollow(this.player);

    this.playerChunkCoord = {
        x: Math.floor(this.player.x / (this.CHUNK_SIZE * this.TILE_SIZE)),
        y: Math.floor(this.player.y / (this.CHUNK_SIZE * this.TILE_SIZE))
    };
    this.updateActiveChunks();

    // --- Animations ---
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'sprint', frames: this.anims.generateFrameNumbers('sprint', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 1 }), frameRate: 5, repeat: -1 });

    this.jumps = 0;
    this.maxJumps = 2;

    // --- Input Handling ---
    const GAME_KEYS = ['Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    this.input.keyboard.on('keydown', (event) => {
      if (GAME_KEYS.includes(event.code)) {
        event.preventDefault();
      }
    });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', space: 'SPACE' });

    // --- AI Timer ---
    this.time.addEvent({ delay: 2000, callback: this.updateAIAction, callbackScope: this, loop: true });
  }

  drawSpline(spline, chunkX) {
    const chunkPixelWidth = this.CHUNK_SIZE * this.TILE_SIZE;
    const worldXOffset = chunkX * chunkPixelWidth;

    const points = spline.getPoints(100);
    if (points.length === 0) return;

    // --- Draw the filled earth part ---
    this.terrainGraphics.fillStyle(0x664422, 1); // Brown
    this.terrainGraphics.beginPath();
    this.terrainGraphics.moveTo(worldXOffset, this.scale.height);
    this.terrainGraphics.lineTo(worldXOffset + points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        this.terrainGraphics.lineTo(worldXOffset + points[i].x, points[i].y);
    }
    this.terrainGraphics.lineTo(worldXOffset + points[points.length - 1].x, this.scale.height);
    this.terrainGraphics.closePath();
    this.terrainGraphics.fillPath();

    // --- Draw the green grass top layer ---
    this.terrainGraphics.lineStyle(10, 0x008800, 1); // Green
    this.terrainGraphics.beginPath();
    this.terrainGraphics.moveTo(worldXOffset + points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        this.terrainGraphics.lineTo(worldXOffset + points[i].x, points[i].y);
    }
    this.terrainGraphics.strokePath();
  }

  createPlayerCapabilitiesProfile() {
    return new PlayerCapabilitiesProfile({
        runSpeed: this.WALK_SPEED, gravity: this.physics.config.gravity.y, jumpVelocity: -this.BASE_JUMP_FORCE,
        wallSlideSpeed: this.WALL_SLIDE_SPEED, wallJumpVelocity: new Phaser.Math.Vector2(this.WALL_JUMP_FORCE_X, this.WALL_JUMP_FORCE_Y),
    });
  }

  togglePlayerControl(isUICall = false) {
    if (!isUICall && this.isAIControlled) { return !this.isAIControlled; }
    this.isAIControlled = !this.isAIControlled;
    if (!this.isAIControlled) { this.player.setVelocityX(0); }
    return !this.isAIControlled;
  }

  update() {
    const playerWorldX = this.player.x;
    const playerWorldY = this.player.y;
    const chunkX = Math.floor(playerWorldX / (this.CHUNK_SIZE * this.TILE_SIZE));
    const chunkY = Math.floor(playerWorldY / (this.CHUNK_SIZE * this.TILE_SIZE));

    if (chunkX !== this.playerChunkCoord.x || chunkY !== this.playerChunkCoord.y) {
      this.playerChunkCoord = { x: chunkX, y: chunkY };
      this.updateActiveChunks();
    }

    if (this.player.body.touching.down || this.player.body.blocked.down) { this.jumps = 0; }

    const isJumpKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (this.isAIControlled) {
      const targetSpeed = this.isAISprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      if (this.aiAction === 'left') { this.player.setVelocityX(-targetSpeed); }
      else if (this.aiAction === 'right') { this.player.setVelocityX(targetSpeed); }
      else { this.player.setVelocityX(0); }
    } else {
      const isSprinting = this.keyShift.isDown;
      const targetSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      const onWallLeft = this.player.body.touching.left && !this.player.body.blocked.down;
      const onWallRight = this.player.body.touching.right && !this.player.body.blocked.down;
      let isWallSliding = false;

      if ((onWallLeft && this.keys.left.isDown) || (onWallRight && this.keys.right.isDown)) {
        isWallSliding = true;
        this.player.setVelocityY(this.WALL_SLIDE_SPEED);
      }

      if (!this.isWallJumping) {
        if (this.keys.left.isDown) {
          this.player.setVelocityX(this.player.body.blocked.left && !isWallSliding ? 0 : -targetSpeed);
          this.lastDirection = 'left';
        } else if (this.keys.right.isDown) {
          this.player.setVelocityX(this.player.body.blocked.right && !isWallSliding ? 0 : targetSpeed);
          this.lastDirection = 'right';
        } else if (this.player.body.blocked.down) {
          this.player.setVelocityX(0);
        }
      }

      if (isJumpKeyDown) {
        if (isWallSliding) {
          this.isWallJumping = true;
          this.player.setVelocity(onWallLeft ? this.WALL_JUMP_FORCE_X : -this.WALL_JUMP_FORCE_X, this.WALL_JUMP_FORCE_Y);
          this.time.addEvent({ delay: this.WALL_JUMP_LOCKOUT, callback: () => { this.isWallJumping = false; }, callbackScope: this });
        } else if (this.jumps < this.maxJumps) {
          this.jumps++;
          this.player.setVelocityY(isSprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE);
        }
      }
    }

    if (!this.player.body.touching.down) { this.player.anims.play('jump', true); }
    else if (this.player.body.velocity.x !== 0) { this.player.anims.play((this.isAIControlled ? this.isAISprinting : this.keyShift.isDown) ? 'sprint' : 'walk', true); }
    else { this.player.anims.play('idle', true); }
  }

  updateAIAction() {
    if (!this.isAIControlled) return;
    const rand = Math.random();
    if (rand < 0.4) { this.aiAction = 'left'; }
    else if (rand < 0.8) { this.aiAction = 'right'; }
    else { this.aiAction = 'idle'; }
    this.isAISprinting = Math.random() < 0.4;
    if (Math.random() < 0.3 && this.jumps < this.maxJumps) {
      this.jumps++;
      this.player.setVelocityY(this.isAISprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE);
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
          const { platforms: newChunkPlatforms, floorSpline } = this.levelGenerator.generateChunk(x, y, this.CHUNK_SIZE, this.TILE_SIZE);
          const newCollider = this.physics.add.collider(this.player, newChunkPlatforms);
          newActiveChunks.set(chunkKey, { platforms: newChunkPlatforms, collider: newCollider, spline: floorSpline });
        }
      }
    }

    this.terrainGraphics.clear();
    for (const [key, chunkData] of newActiveChunks.entries()) {
        if (chunkData.spline) {
            const [chunkX] = key.split(',').map(Number);
            this.drawSpline(chunkData.spline, chunkX);
        }
    }

    for (const [key, chunkData] of this.activeChunks.entries()) {
      if (!newActiveChunks.has(key) && chunkData) {
        chunkData.platforms.destroy(true, true);
        chunkData.collider.destroy();
      }
    }

    this.activeChunks = newActiveChunks;
  }
}
