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

    // --- Start of new mock setup ---
    // The scene now depends on this structure for initialization.
    // We modify the mock created by __mocks__/phaser.js to include what we need.
    scene.sys.game.config.physics = {
      arcade: { gravity: { y: 1500 } },
      matter: { gravity: { y: 1500 } },
    };
    scene.game = {
      registry: {
        get: jest.fn().mockReturnValue('arcade'), // Default to arcade for tests
      },
      config: scene.sys.game.config, // Link to the same config
    };
    // --- End of new mock setup ---

    scene.init = GameScene.prototype.init.bind(scene);
    scene.init({ levelGenerator });
    // Manually add the methods that are part of the scene's lifecycle
    scene.create = GameScene.prototype.create.bind(scene);
    scene.update = GameScene.prototype.update.bind(scene);
    scene.preload = GameScene.prototype.preload.bind(scene);
    scene.togglePlayerControl = GameScene.prototype.togglePlayerControl.bind(scene);
    scene.updateActiveChunks = GameScene.prototype.updateActiveChunks.bind(scene);
    scene.createPlayerCapabilitiesProfile = GameScene.prototype.createPlayerCapabilitiesProfile.bind(scene);
    scene.createAnimations = GameScene.prototype.createAnimations.bind(scene);
    scene.setupInput = GameScene.prototype.setupInput.bind(scene);
    scene.createArcadeWorld = GameScene.prototype.createArcadeWorld.bind(scene);
    scene.createMatterWorld = GameScene.prototype.createMatterWorld.bind(scene);
    scene.updateArcadePlayer = GameScene.prototype.updateArcadePlayer.bind(scene);
    scene.updateMatterPlayer = GameScene.prototype.updateMatterPlayer.bind(scene);
    scene.updateAnimation = GameScene.prototype.updateAnimation.bind(scene);

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
});
