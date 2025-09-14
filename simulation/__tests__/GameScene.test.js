import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/LevelGenerator';

jest.mock('../src/game/LevelGenerator');

describe('GameScene', () => {
  let scene;
  let mockGenerate;

  beforeEach(() => {
    // Mock the LevelGenerator's generate function to return a valid, minimal LevelData object
    mockGenerate = jest.fn().mockReturnValue({
      width: 10,
      height: 10,
      grid: Array(10).fill(null).map(() => Array(10).fill({ type: 'EMPTY', tileIndex: -1, collides: false })),
      specialObjects: [],
      startPosition: { x: 50, y: 50 },
      endPosition: { x: 100, y: 100 },
    });

    LevelGenerator.mockImplementation(() => {
      return {
        generate: mockGenerate,
      };
    });

    scene = new GameScene();
    LevelGenerator.mockClear();
  });

  it('should be an instance of Phaser.Scene', () => {
    expect(Phaser.Scene).toHaveBeenCalledWith('default');
  });

  it('should set the background color to white on create', () => {
    scene.create();
    expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#ffffff');
  });

  it('should create the player and physics groups', () => {
    scene.create();
    // Checks that the new asset-free rendering creates physics groups
    expect(scene.physics.add.staticGroup).toHaveBeenCalled();
    expect(scene.physics.add.group).toHaveBeenCalled();
    // The player is created at (100, 450) initially, but then moved by redrawLevel
    expect(scene.physics.add.sprite).toHaveBeenCalledWith(100, 450, 'idle');
  });

  it('should have a togglePlayerControl method', () => {
    expect(typeof scene.togglePlayerControl).toBe('function');
  });

  it('should use the LevelGenerator to create the level', () => {
    scene.create();

    // The generator should be instantiated
    expect(LevelGenerator).toHaveBeenCalledTimes(1);

    // The generate method on the instance should be called
    expect(mockGenerate).toHaveBeenCalledTimes(1);

    // Verify it's called with no arguments, matching the new signature
    expect(mockGenerate).toHaveBeenCalledWith();
  });
});
