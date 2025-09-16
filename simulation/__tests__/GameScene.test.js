import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/LevelGenerator';

// The phaser module is mocked in jest.config.js
jest.mock('../src/game/LevelGenerator', () => {
    return jest.fn().mockImplementation(() => {
        return {
            generateChunk: jest.fn().mockReturnValue({
                platforms: { destroy: jest.fn() }
            }),
            generateInitialChunkAndSpawnPoint: jest.fn().mockReturnValue({
                platforms: { destroy: jest.fn() },
                spawnPoint: { x: 150, y: 250 }
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

    // Mock the necessary properties on the scene instance
    scene.matter = {
      add: {
        sprite: jest.fn().mockReturnValue({
          setRectangle: jest.fn(),
          setFixedRotation: jest.fn(),
          setFriction: jest.fn(),
          anims: {
            play: jest.fn(),
          },
          body: {
            velocity: { x: 0, y: 0 }
          },
          setFlipX: jest.fn(),
        }),
      },
      world: {
        on: jest.fn(),
      },
      config: {
          gravity: { y: 1 }
      }
    };
    scene.physics = scene.sys.game.scene.scenes[0].physics;
    scene.anims = scene.sys.game.scene.scenes[0].anims;
    scene.input = scene.sys.game.scene.scenes[0].input;
    scene.time = scene.sys.game.scene.scenes[0].time;
    scene.cameras = { main: { setBackgroundColor: jest.fn(), startFollow: jest.fn(), setZoom: jest.fn() } };
    scene.add = {
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn(),
        fillRect: jest.fn(),
        generateTexture: jest.fn(),
        destroy: jest.fn(),
      }),
      tileSprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn(),
      }),
    };


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
    expect(scene.matter.add.sprite).toHaveBeenCalledWith(150, 250, 'idle', null, expect.any(Object));
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
});
