import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';

// The phaser module is mocked in jest.config.js

describe('GameScene', () => {
  let scene;

  beforeEach(() => {
    // Create a new instance of the scene before each test
    scene = new GameScene();
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
    expect(scene.physics.add.sprite).toHaveBeenCalledWith(100, 450, 'player');
  });

  it('should have a togglePlayerControl method', () => {
    // This test is not in the original plan, but it's good to have
    // to ensure methods are correctly bound to the scene instance.
    expect(typeof scene.togglePlayerControl).toBe('function');
  });
});
