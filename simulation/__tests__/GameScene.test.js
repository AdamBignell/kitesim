import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/LevelGenerator';

// The phaser module is mocked in jest.config.js
jest.mock('../src/game/LevelGenerator');

describe('GameScene', () => {
  let scene;

  beforeEach(() => {
    LevelGenerator.mockClear();
    LevelGenerator.mockImplementation(() => {
      return {
        generate: jest.fn(),
        buildLevel: jest.fn(),
        getPlayerStartPosition: jest.fn().mockReturnValue({ x: 100, y: 450 }),
      };
    });
    scene = new GameScene();
    // Clear the mock for staticGroup before each test
    if (scene.physics.add.staticGroup.mockClear) {
      scene.physics.add.staticGroup.mockClear();
    }
  });

  it('should be an instance of Phaser.Scene', () => {
    expect(Phaser.Scene).toHaveBeenCalledWith('default');
  });

  it('should set the background color to white on create', () => {
    scene.create();
    expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#ffffff');
  });

  it('should create the player and platform groups', () => {
    scene.create();
    expect(scene.physics.add.staticGroup).toHaveBeenCalledTimes(2);
    expect(scene.physics.add.sprite).toHaveBeenCalledWith(100, 450, 'idle');
  });

  it('should have a togglePlayerControl method', () => {
    expect(typeof scene.togglePlayerControl).toBe('function');
  });

  it('should use the LevelGenerator to create the level', () => {
    scene.create();

    const generatorInstance = scene.levelGenerator;
    expect(generatorInstance.generate).toHaveBeenCalled();
    expect(generatorInstance.buildLevel).toHaveBeenCalledWith(scene.solidPlatforms, scene.fallThroughPlatforms);
  });
});
