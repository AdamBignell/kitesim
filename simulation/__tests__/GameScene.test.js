import GameScene from '../src/game/GameScene';
import * as Phaser from 'phaser';
import LevelGenerator from '../src/game/LevelGenerator';
import Grid from '../src/game/generation/Grid';

// Mock the entire LevelGenerator module
jest.mock('../src/game/LevelGenerator', () => ({
  generateSimpleRoom: jest.fn(),
}));

describe('GameScene', () => {
  let scene;
  let mockGrid;

  beforeEach(() => {
    // Reset mocks before each test
    LevelGenerator.generateSimpleRoom.mockClear();

    // Setup a mock grid that the generator will return
    mockGrid = new Grid(40, 23, 0); // 1280/32, 720/32
    mockGrid.setTile(1, 1, 1); // Add a solid tile to be safe
    LevelGenerator.generateSimpleRoom.mockReturnValue(mockGrid);

    // Create a new scene instance
    scene = new GameScene();
  });

  it('should be an instance of Phaser.Scene', () => {
    expect(Phaser.Scene).toHaveBeenCalledWith('default');
  });

  it('should set the background color to white on create', () => {
    scene.create();
    expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#ffffff');
  });

  it('should create the player and a tilemap', () => {
    scene.create();
    // The player is created at a start position now, check if setPosition was called
    expect(scene.player.setPosition).toHaveBeenCalled();
    // Check that a tilemap was created
    expect(scene.make.tilemap).toHaveBeenCalled();
  });

  it('should have a togglePlayerControl method', () => {
    expect(typeof scene.togglePlayerControl).toBe('function');
  });

  it('should use the LevelGenerator to create and render the level', () => {
    scene.create();

    // 1. Check that our generator was called
    expect(LevelGenerator.generateSimpleRoom).toHaveBeenCalledTimes(1);

    // 2. Check that a tilemap was created with the grid data
    expect(scene.make.tilemap).toHaveBeenCalledWith({
      data: mockGrid.toArray(),
      tileWidth: 32,
      tileHeight: 32,
    });

    // 3. Check that the tileset and layer were created
    const mockMapInstance = scene.make.tilemap.mock.results[0].value;
    expect(mockMapInstance.addTilesetImage).toHaveBeenCalledWith('tile');
    expect(mockMapInstance.createLayer).toHaveBeenCalled();

    // 4. Check that collision was set
    expect(mockMapInstance.setCollision).toHaveBeenCalledWith(1);

    // 5. Check that a collider was added
    const mockLayerInstance = mockMapInstance.createLayer.mock.results[0].value;
    expect(scene.physics.add.collider).toHaveBeenCalledWith(scene.player, mockLayerInstance);
  });
});
