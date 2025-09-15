import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/generation/LevelGenerator';

// The phaser module is mocked in jest.config.js
jest.mock('../src/game/generation/LevelGenerator');

describe('GameScene', () => {
  let scene;

  beforeEach(() => {
    // Create a new instance of the scene before each test
    scene = new GameScene();
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

  it('should create the player and platform groups', () => {
    scene.create();
    expect(scene.physics.add.staticGroup).toHaveBeenCalled();
    // The player is created at (100, 450) in GameScene.js
    expect(scene.physics.add.sprite).toHaveBeenCalledWith(100, 450, 'idle');
  });

  it('should have a togglePlayerControl method', () => {
    // This test is not in the original plan, but it's good to have
    // to ensure methods are correctly bound to the scene instance.
    expect(typeof scene.togglePlayerControl).toBe('function');
  });

  it('should use the LevelGenerator to create the level', () => {
    scene.create(); // The create method calls redrawLevel

    expect(LevelGenerator).toHaveBeenCalledTimes(1);
    const generatorInstance = LevelGenerator.mock.instances[0];
    const mockGenerate = generatorInstance.generate;

    // Check that our generator's method was called
    expect(mockGenerate).toHaveBeenCalled();
    expect(mockGenerate).toHaveBeenCalledWith(scene.platforms, expect.any(Number));
  });
});
