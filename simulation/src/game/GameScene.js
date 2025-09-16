import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

export default class GameScene extends Phaser.Scene {
  constructor() {
    // The key 'default' is used to identify this scene.
    super('default');
  }

  init(data) {
    this.physicsMode = this.game.registry.get('physics') || 'arcade';
    const gravityConfig = this.physicsMode === 'matter'
      ? this.sys.game.config.physics.matter.gravity.y
      : this.sys.game.config.physics.arcade.gravity.y;

    this.levelGenerator = data.levelGenerator || new LevelGenerator(this, this.createPlayerCapabilitiesProfile(gravityConfig));
  }

  preload() {
    // Load the sprite sheets for the player character.
    this.load.spritesheet('idle', 'assets/sprites/idle.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk', 'assets/sprites/walk.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sprint', 'assets/sprites/sprint.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/sprites/jump.svg', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // --- Common Setup ---
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

    this.jumps = 0;
    this.maxJumps = 2;

    this.createAnimations();
    this.setupInput();

    // --- Physics-Specific Setup ---
    if (this.physicsMode === 'matter') {
      this.createMatterWorld();
    } else {
      this.createArcadeWorld();
    }

    // --- Common Finalization ---
    this.cameras.main.startFollow(this.player);
    this.playerChunkCoord = {
        x: Math.floor(this.player.x / (this.CHUNK_SIZE * this.TILE_SIZE)),
        y: Math.floor(this.player.y / (this.CHUNK_SIZE * this.TILE_SIZE))
    };
    this.updateActiveChunks();

    this.time.addEvent({
      delay: 2000,
      callback: this.updateAIAction,
      callbackScope: this,
      loop: true
    });
  }

  createArcadeWorld() {
    // Create a simple black texture for platforms
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
    graphics.generateTexture('platform', this.TILE_SIZE, this.TILE_SIZE);
    graphics.destroy();

    const { platforms: initialPlatforms, spawnPoint } = this.levelGenerator.generateInitialChunkAndSpawnPoint(this.CHUNK_SIZE, this.TILE_SIZE);

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'idle');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(false);

    const initialCollider = this.physics.add.collider(this.player, initialPlatforms);
    this.activeChunks.set('0,0', { platforms: initialPlatforms, collider: initialCollider });
  }

  createMatterWorld() {
    const { vertices, graphics, spawnPoint } = this.levelGenerator.generateInitialChunkAndSpawnPointMatter(this.CHUNK_SIZE, this.TILE_SIZE);

    this.player = this.matter.add.sprite(spawnPoint.x, spawnPoint.y, 'idle');
    this.player.setRectangle(this.TILE_SIZE * 0.8, this.TILE_SIZE);
    this.player.setFixedRotation();
    this.player.setFriction(0.01);

    let initialBody = null;
    if (vertices) {
        const Matter = Phaser.Physics.Matter.Matter;
        initialBody = Matter.Bodies.fromVertices(0, 0, [vertices], { isStatic: true });
        // The fromVertices call correctly calculates the center of mass and sets the body's position.
        // We just need to add this body to the world.
        this.matter.world.add(initialBody);
    }

    this.activeChunks.set('0,0', { body: initialBody, graphics: graphics });

    // Collision detection
    this.isPlayerOnGround = false;
    this.matter.world.on('collisionstart', (event) => {
        for (let i = 0; i < event.pairs.length; i++) {
            const pair = event.pairs[i];
            const isPlayerInvolved = pair.bodyA === this.player.body || pair.bodyB === this.player.body;
            if (isPlayerInvolved) {
                // Check if the collision normal is pointing mostly upwards.
                if (Math.abs(pair.collision.normal.y) > 0.5 && pair.collision.normal.x < 0.1) {
                    this.isPlayerOnGround = true;
                    break;
                }
            }
        }
    });
  }

  createAnimations() {
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'sprint', frames: this.anims.generateFrameNumbers('sprint', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
  }

  setupInput() {
    const GAME_KEYS = ['Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    this.input.keyboard.on('keydown', (event) => {
      if (GAME_KEYS.includes(event.code)) {
        event.preventDefault();
      }
    });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', space: 'SPACE' });
  }

  createPlayerCapabilitiesProfile(gravity) {
    return new PlayerCapabilitiesProfile({
        runSpeed: this.WALK_SPEED,
        gravity: gravity,
        jumpVelocity: -this.BASE_JUMP_FORCE,
        wallSlideSpeed: this.WALL_SLIDE_SPEED,
        wallJumpVelocity: new Phaser.Math.Vector2(this.WALL_JUMP_FORCE_X, this.WALL_JUMP_FORCE_Y),
      });
  }

  togglePlayerControl(isUICall = false) {
    if (!isUICall) {
      if (this.isAIControlled) return !this.isAIControlled;
    }
    this.isAIControlled = !this.isAIControlled;
    if (!this.isAIControlled) {
      this.player.setVelocityX(0);
    }
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

    if (this.physicsMode === 'matter') {
      this.updateMatterPlayer();
    } else {
      this.updateArcadePlayer();
    }

    this.updateAnimation();
  }

  updateArcadePlayer() {
    if (this.player.body.touching.down || this.player.body.blocked.down) {
      this.jumps = 0;
    }

    const isJumpKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (this.isAIControlled) {
      const targetSpeed = this.isAISprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      if (this.aiAction === 'left') this.player.setVelocityX(-targetSpeed);
      else if (this.aiAction === 'right') this.player.setVelocityX(targetSpeed);
      else this.player.setVelocityX(0);
    } else {
      const isSprinting = this.keyShift.isDown;
      const targetSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      const onWallLeft = this.player.body.touching.left && !this.player.body.blocked.down;
      const onWallRight = this.player.body.touching.right && !this.player.body.blocked.down;
      let isWallSliding = (onWallLeft && this.cursors.left.isDown) || (onWallRight && this.cursors.right.isDown);

      if (isWallSliding && this.player.body.velocity.y >= 0) {
        this.player.setVelocityY(this.WALL_SLIDE_SPEED);
      }

      if (!this.isWallJumping) {
        if (this.cursors.left.isDown || this.keys.left.isDown) {
          this.player.setVelocityX(-targetSpeed);
          this.lastDirection = 'left';
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
          this.player.setVelocityX(targetSpeed);
          this.lastDirection = 'right';
        } else {
          this.player.setVelocityX(0);
        }
      }

      if (isJumpKeyDown) {
        if (isWallSliding) {
          this.isWallJumping = true;
          const wallJumpX = onWallLeft ? this.WALL_JUMP_FORCE_X : -this.WALL_JUMP_FORCE_X;
          this.player.setVelocity(wallJumpX, this.WALL_JUMP_FORCE_Y);
          this.time.delayedCall(this.WALL_JUMP_LOCKOUT, () => { this.isWallJumping = false; });
        } else if (this.jumps < this.maxJumps) {
          this.jumps++;
          const jumpForce = isSprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
          this.player.setVelocityY(jumpForce);
        }
      }
    }
  }

  updateMatterPlayer() {
     if (this.isPlayerOnGround) {
        this.jumps = 0;
    }
    // Reset for next frame
    this.isPlayerOnGround = false;

    const isJumpKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (this.isAIControlled) {
      const targetSpeed = this.isAISprinting ? this.SPRINT_SPEED : this.WALK_SPEED;
      if (this.aiAction === 'left') this.player.setVelocityX(-targetSpeed / 50); // Matter velocities are different
      else if (this.aiAction === 'right') this.player.setVelocityX(targetSpeed / 50);
      else this.player.setVelocityX(0);
    } else {
      const isSprinting = this.keyShift.isDown;
      const targetSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

      if (this.cursors.left.isDown || this.keys.left.isDown) {
        this.player.setVelocityX(-targetSpeed / 50);
        this.lastDirection = 'left';
      } else if (this.cursors.right.isDown || this.keys.right.isDown) {
        this.player.setVelocityX(targetSpeed / 50);
        this.lastDirection = 'right';
      } else {
        this.player.setVelocityX(0);
      }

      if (isJumpKeyDown && this.jumps < this.maxJumps) {
        this.jumps++;
        // Matter.js jump force needs to be an impulse (applyForce) or a direct velocity set.
        // Arcade's velocity is pixels/second, Matter's is pixels/step. They are not 1:1.
        // This will require tuning. Let's start with a scaled value.
        const jumpForce = (isSprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE) / 50;
        this.player.setVelocityY(jumpForce);
      }
    }
  }

  updateAnimation() {
    const onGround = this.physicsMode === 'matter' ? this.isPlayerOnGround : (this.player.body.touching.down || this.player.body.blocked.down);
    const velocityX = this.player.body.velocity.x;

    if (!onGround) {
      this.player.anims.play('jump', true);
    } else if (Math.abs(velocityX) > 0.1) {
      const isSprinting = this.isAIControlled ? this.isAISprinting : this.keyShift.isDown;
      this.player.anims.play(isSprinting ? 'sprint' : 'walk', true);
    } else {
      this.player.anims.play('idle', true);
    }
  }

  updateAIAction() {
    if (!this.isAIControlled) return;

    const rand = Math.random();
    if (rand < 0.4) this.aiAction = 'left';
    else if (rand < 0.8) this.aiAction = 'right';
    else this.aiAction = 'idle';

    this.isAISprinting = Math.random() < 0.4;

    if (Math.random() < 0.3) {
      if (this.physicsMode === 'matter' && this.isPlayerOnGround) {
          const jumpForce = (this.isAISprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE) / 50;
          this.player.setVelocityY(jumpForce);
      } else if (this.physicsMode === 'arcade' && (this.player.body.touching.down || this.player.body.blocked.down)) {
          const jumpForce = this.isAISprinting ? this.SPRINT_JUMP_FORCE : this.BASE_JUMP_FORCE;
          this.player.setVelocityY(jumpForce);
      }
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
          if (this.physicsMode === 'matter') {
            const { vertices, graphics } = this.levelGenerator.generateChunkMatter(x, y, this.CHUNK_SIZE, this.TILE_SIZE);
            let body = null;
            if (vertices) {
                const Matter = Phaser.Physics.Matter.Matter;
                body = Matter.Bodies.fromVertices(0, 0, [vertices], { isStatic: true });
                this.matter.world.add(body);
                Matter.Body.setPosition(body, body.position);
            }
            newActiveChunks.set(chunkKey, { body: body, graphics: graphics });
          } else {
            const { platforms: newChunkPlatforms } = this.levelGenerator.generateChunk(x, y, this.CHUNK_SIZE, this.TILE_SIZE);
            const newCollider = this.physics.add.collider(this.player, newChunkPlatforms);
            newActiveChunks.set(chunkKey, { platforms: newChunkPlatforms, collider: newCollider });
          }
        }
      }
    }

    for (const [key, chunkData] of this.activeChunks.entries()) {
      if (!newActiveChunks.has(key)) {
        if (chunkData) {
          if (this.physicsMode === 'matter') {
            if (chunkData.body) this.matter.world.remove(chunkData.body);
            if (chunkData.graphics) chunkData.graphics.destroy();
          } else {
            if (chunkData.platforms) chunkData.platforms.destroy(true, true);
            if (chunkData.collider) chunkData.collider.destroy();
          }
        }
      }
    }
    this.activeChunks = newActiveChunks;
  }
}
