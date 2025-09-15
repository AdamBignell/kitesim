import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/LevelGenerator';
import Grid from '../src/game/generation/Grid';

jest.mock('../src/game/LevelGenerator', () => ({
  generateSimpleRoom: jest.fn(),
}));

describe('GameScene', () => {
  let scene;
  let mockGrid;

  beforeEach(() => {
    LevelGenerator.generateSimpleRoom.mockClear();

    // Create a simple mock grid with a few solid tiles
    mockGrid = new Grid(10, 10, 0);
    mockGrid.setTile(1, 8, 1);
    mockGrid.setTile(2, 8, 1);
    mockGrid.setTile(3, 8, 1);
    LevelGenerator.generateSimpleRoom.mockReturnValue(mockGrid);

    scene = new GameScene();
  });

  it('should be an instance of Phaser.Scene', () => {
    expect(Phaser.Scene).toHaveBeenCalledWith('default');
  });

  it('should create the player and platform group', () => {
    scene.create();
    expect(scene.physics.add.staticGroup).toHaveBeenCalled();
    expect(scene.player.setPosition).toHaveBeenCalled();
  });

  it('should use the LevelGenerator to render the level with rectangles', () => {
    // We expect 3 solid tiles in our mock grid
    const expectedPlatformCount = 3;

    scene.create();

    // 1. Check that our generator was called
    expect(LevelGenerator.generateSimpleRoom).toHaveBeenCalledTimes(1);

    // 2. Check that rectangles were created for each solid tile
    expect(scene.add.rectangle).toHaveBeenCalledTimes(expectedPlatformCount);

    // 3. Check that the created rectangles were added to the platforms group
    expect(scene.platforms.add).toHaveBeenCalledTimes(expectedPlatformCount);

    // 4. Check that the collider was added
    expect(scene.physics.add.collider).toHaveBeenCalledWith(scene.player, scene.platforms);
  });
});
