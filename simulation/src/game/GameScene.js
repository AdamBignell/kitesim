import * as Phaser from 'phaser';
import LevelGenerator from './LevelGenerator';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

const TILE_SIZE = 32;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('default');
  }

  preload() {
    this.load.spritesheet('idle', 'assets/sprites/idle.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk', 'assets/sprites/walk.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sprint', 'assets/sprites/sprint.svg', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/sprites/jump.svg', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.WALK_SPEED = 200;
    this.SPRINT_SPEED = 350;
    this.BASE_JUMP_FORCE = -650;
    this.SPRINT_JUMP_FORCE = -750;
    this.WALL_SLIDE_SPEED = 100;
    this.WALL_JUMP_FORCE_Y = -550;
    this.WALL_JUMP_FORCE_X = 450;
    this.WALL_JUMP_LOCKOUT = 250;

    this.pcp = new PlayerCapabilitiesProfile({
      runSpeed: this.SPRINT_SPEED,
      gravity: this.physics.world.gravity.y,
      jumpVelocity: this.BASE_JUMP_FORCE,
      sprintJumpVelocity: this.SPRINT_JUMP_FORCE,
      wallSlideSpeed: this.WALL_SLIDE_SPEED,
      wallJumpVelocity: new Phaser.Math.Vector2(this.WALL_JUMP_FORCE_X, this.WALL_JUMP_FORCE_Y),
    });

    this.isWallJumping = false;
    this.isAIControlled = true;
    this.aiAction = 'idle';
    this.lastDirection = 'right';
    this.isAISprinting = false;

    this.cameras.main.setBackgroundColor('#ffffff');
    this.platforms = this.physics.add.staticGroup();

    this.player = this.physics.add.sprite(100, 450, 'idle');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1);
    this.physics.add.collider(this.player, this.platforms);

    this.redrawLevel(this.scale.gameSize);

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

  redrawLevel(gameSize) {
    const widthInTiles = Math.floor(gameSize.width / TILE_SIZE);
    const heightInTiles = Math.floor(gameSize.height / TILE_SIZE);

    this.physics.world.setBounds(0, 0, gameSize.width, gameSize.height);
    this.platforms.clear(true, true);

    const startPoint = new Phaser.Math.Vector2(5, heightInTiles - 5);
    const endPoint = new Phaser.Math.Vector2(widthInTiles - 5, 5);

    const grid = LevelGenerator.generateSimpleRoom(widthInTiles, heightInTiles, startPoint, endPoint, this.pcp);
    const gridArray = grid.toArray();

    for (let y = 0; y < gridArray.length; y++) {
      for (let x = 0; x < gridArray[y].length; x++) {
        if (gridArray[y][x] === 1) {
          const tileX = x * TILE_SIZE;
          const tileY = y * TILE_SIZE;
          // Use setOrigin(0,0) to align rectangles to the grid
          const platform = this.add.rectangle(tileX, tileY, TILE_SIZE, TILE_SIZE, 0x000000).setOrigin(0, 0);
          this.platforms.add(platform);
        }
      }
    }

    this.player.setPosition(startPoint.x * TILE_SIZE, startPoint.y * TILE_SIZE);
  }

  // --- Other methods ---
  togglePlayerControl(isUICall = false) {
    if (!isUICall && this.isAIControlled) return !this.isAIControlled;
    this.isAIControlled = !this.isAIControlled;
    if (!this.isAIControlled) this.player.setVelocityX(0);
    return !this.isAIControlled;
  }
  update() {
    if (this.player.y > this.game.config.height + 50) {
      this.player.setPosition(100, 450);
      this.player.setVelocity(0,0);
      return;
    }
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
      const onWallLeft = this.player.body.touching.left && !this.player.body.touching.down;
      const onWallRight = this.player.body.touching.right && !this.player.body.touching.down;
      let isWallSliding = false;
      if ((onWallLeft && (this.cursors.left.isDown || this.keys.left.isDown)) || (onWallRight && (this.cursors.right.isDown || this.keys.right.isDown))) {
        isWallSliding = true;
      }
      if (isWallSliding) this.player.setVelocityY(this.WALL_SLIDE_SPEED);
      if (!this.isWallJumping) {
        if (this.cursors.left.isDown || this.keys.left.isDown) {
          this.player.setVelocityX(-targetSpeed);
          this.lastDirection = 'left';
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
          this.player.setVelocityX(targetSpeed);
          this.lastDirection = 'right';
        } else if (this.player.body.touching.down) {
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
}
