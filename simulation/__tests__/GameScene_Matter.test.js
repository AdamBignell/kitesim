import GameScene from '../src/game/GameScene_Matter';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/LevelGenerator_Matter';

jest.mock('../src/game/LevelGenerator_Matter', () => {
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

describe('GameScene_Matter', () => {
  let scene;
  let levelGenerator;

  beforeEach(() => {
    levelGenerator = new LevelGenerator();
    scene = new GameScene();
    scene.sys = new Phaser.Scene().sys;
    scene.init = GameScene.prototype.init.bind(scene);
    scene.init({ levelGenerator });
    scene.create = GameScene.prototype.create.bind(scene);
    scene.updateActiveChunks = GameScene.prototype.updateActiveChunks.bind(scene);

    // Mock the matter physics object
    scene.matter = {
      add: {
        sprite: jest.fn().mockReturnValue({
          setRectangle: jest.fn(),
          setFixedRotation: jest.fn(),
          setFriction: jest.fn(),
          body: { velocity: { x: 0, y: 0 } },
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

    // Mock other scene properties
    scene.anims = scene.sys.game.scene.scenes[0].anims;
    scene.input = scene.sys.game.scene.scenes[0].input;
    scene.time = scene.sys.game.scene.scenes[0].time;
    scene.cameras = { main: { setBackgroundColor: jest.fn(), startFollow: jest.fn(), setZoom: jest.fn() } };
  });

  it('should create the player using Matter physics', () => {
    scene.create();
    expect(scene.matter.add.sprite).toHaveBeenCalledWith(150, 250, 'idle', null, expect.any(Object));
  });
});
