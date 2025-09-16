import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/LevelGenerator';
import { TileType } from '../src/game/generation/Tile';

jest.mock('phaser');
// The phaser module is mocked in jest.config.js
jest.mock('../src/game/LevelGenerator', () => {
    return jest.fn().mockImplementation(() => {
        return {
            generateChunk: jest.fn().mockReturnValue({
                platforms: { destroy: jest.fn() }
            }),
            generateInitialChunkAndSpawnPoint: jest.fn().mockReturnValue({
                platforms: { destroy: jest.fn() },
                spawnPoint: { x: 150, y: 250 },
                surfaceTiles: [],
            })
        };
    });
});

describe('GameScene', () => {
  let scene;
  let levelGenerator;

  beforeEach(() => {
    levelGenerator = new LevelGenerator();
    // Create a new instance of the scene before each test
    scene = new GameScene();
    scene.sys = new Phaser.Scene().sys;
    scene.init = GameScene.prototype.init.bind(scene);
    scene.init({ levelGenerator });
    // Manually add the methods that are part of the scene's lifecycle
    scene.create = GameScene.prototype.create.bind(scene);
    scene.update = GameScene.prototype.update.bind(scene);
    scene.preload = GameScene.prototype.preload.bind(scene);
    scene.togglePlayerControl = GameScene.prototype.togglePlayerControl.bind(scene);
    scene.updateActiveChunks = GameScene.prototype.updateActiveChunks.bind(scene);
    scene.createPlayerCapabilitiesProfile = GameScene.prototype.createPlayerCapabilitiesProfile.bind(scene);
    scene.handleSlopePhysics = GameScene.prototype.handleSlopePhysics.bind(scene);

    // Mock the necessary properties on the scene instance
    scene.physics = scene.sys.game.scene.scenes[0].physics;
    scene.anims = scene.sys.game.scene.scenes[0].anims;
    scene.input = scene.sys.game.scene.scenes[0].input;
    scene.time = scene.sys.game.scene.scenes[0].time;
    scene.cameras = { main: { setBackgroundColor: jest.fn(), startFollow: jest.fn() } };
    scene.add = {
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn(),
        fillRect: jest.fn(),
        generateTexture: jest.fn(),
        destroy: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fillPath: jest.fn(),
        clear: jest.fn(),
      }),
      tileSprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn(),
      }),
    };

    // Mock player
    scene.player = {
      getBounds: jest.fn(),
      body: {
        bottom: 32,
        center: { x: 16 },
        velocity: { x: 100, y: 0 },
        setAllowGravity: jest.fn(),
      },
      setVelocityY: jest.fn(),
    };

    // Mock active chunks
    scene.activeChunks = new Map();
    scene.playerChunkCoord = { x: 0, y: 0 };


    LevelGenerator.mockClear();
  });

  it('should be an instance of Phaser.Scene', () => {
    // Check that the super constructor was called with the correct scene key
    expect(Phaser.Scene).toHaveBeenCalledWith('default');
  });

  it('should set the background color to white on create', () => {
    scene.create();
    expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#ffffff');
  });

  it('should create the player at the spawn point', () => {
    scene.create();
    // The player is created at the spawnPoint from the level generator
    expect(scene.physics.add.sprite).toHaveBeenCalledWith(150, 250, 'idle');
  });

  it('should have a togglePlayerControl method', () => {
    // This test is not in the original plan, but it's good to have
    // to ensure methods are correctly bound to the scene instance.
    expect(typeof scene.togglePlayerControl).toBe('function');
  });

  it('should use the LevelGenerator to create the initial level', () => {
    scene.create(); // The create method calls generateInitialChunkAndSpawnPoint

    expect(levelGenerator.generateInitialChunkAndSpawnPoint).toHaveBeenCalled();
  });

  describe('handleSlopePhysics', () => {
    it('should disable gravity and set velocity when on a left slope', () => {
      const surfaceTiles = [{ x: 0, y: 0, tile: { type: TileType.SLOPE_45_LEFT } }];
      scene.activeChunks.set('0,0', { surfaceTiles });
      scene.player.getBounds.mockReturnValue({ x: 0, y: 0, width: 32, height: 32 });
      scene.player.body.center.x = 16;
      scene.player.body.bottom = 32;
      Phaser.Geom.Intersects.RectangleToRectangle.mockReturnValue(true);

      scene.handleSlopePhysics();

      expect(scene.player.body.setAllowGravity).toHaveBeenCalledWith(false);
      expect(scene.player.setVelocityY).toHaveBeenCalledWith(100);
    });

    it('should disable gravity and set velocity when on a right slope', () => {
      const surfaceTiles = [{ x: 0, y: 0, tile: { type: TileType.SLOPE_45_RIGHT } }];
      scene.activeChunks.set('0,0', { surfaceTiles });
      scene.player.getBounds.mockReturnValue({ x: 0, y: 0, width: 32, height: 32 });
      scene.player.body.center.x = 16;
      scene.player.body.bottom = 32;
      Phaser.Geom.Intersects.RectangleToRectangle.mockReturnValue(true);

      scene.handleSlopePhysics();

      expect(scene.player.body.setAllowGravity).toHaveBeenCalledWith(false);
      expect(scene.player.setVelocityY).toHaveBeenCalledWith(-100);
    });

    it('should enable gravity when not on a slope', () => {
      scene.activeChunks.set('0,0', { surfaceTiles: [] });
      scene.player.getBounds.mockReturnValue({ x: 100, y: 100, width: 32, height: 32 });
      Phaser.Geom.Intersects.RectangleToRectangle.mockReturnValue(false);

      scene.handleSlopePhysics();

      expect(scene.player.body.setAllowGravity).toHaveBeenCalledWith(true);
    });
  });
});
