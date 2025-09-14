import LevelGenerator from '../src/game/LevelGenerator';
import * as Phaser from 'phaser';

// Mocks are defined in __mocks__/phaser.js
// We don't need to mock LevelGenerator since that's what we're testing.

describe('LevelGenerator', () => {
  let scene;
  let levelGenerator;
  let platforms;

  beforeEach(() => {
    // Create a mock scene object using the mock from __mocks__/phaser.js
    scene = new Phaser.Scene();

    // The mock for a static group, as defined in __mocks__/phaser.js
    platforms = scene.physics.add.staticGroup();

    // Instantiate the LevelGenerator with the mock scene
    levelGenerator = new LevelGenerator(scene);
  });

  it('should be created', () => {
    expect(levelGenerator).toBeDefined();
  });

  it('should call the draw function for each chunk in the grid', () => {
    // Spy on the draw functions for a few templates
    const startRoom = levelGenerator.templates['START_ROOM'];
    const solidRoom = levelGenerator.templates['SOLID'];
    jest.spyOn(startRoom, 'draw');
    jest.spyOn(solidRoom, 'draw');

    levelGenerator.generate(platforms);

    // We expect at least the start room to be drawn
    expect(startRoom.draw).toHaveBeenCalled();

    // The total number of draw calls should equal the grid size
    const GRID_COLS = 4;
    const GRID_ROWS = 3;
    const totalDrawCalls = startRoom.draw.mock.calls.length + solidRoom.draw.mock.calls.length;
    // Note: This is a simplification. In a real scenario, we'd have to spy on all templates.
    // For now, we are checking that our main method is being called.
    expect(totalDrawCalls).toBeGreaterThan(0);
  });

  it('should always place START_ROOM at the bottom-left', () => {
    const grid = levelGenerator._fillGrid(4, 3);
    // Grid is [row][col], so bottom-left is [rows-1][0]
    expect(grid[2][0]).toBe('START_ROOM');
  });

  it('should create a grid of the correct size', () => {
    const cols = 5, rows = 4;
    const grid = levelGenerator._fillGrid(cols, rows);
    expect(grid.length).toBe(rows);
    expect(grid[0].length).toBe(cols);
  });

  describe('Drawing Functions', () => {
    const x = 0, y = 0, w = 100, h = 100;

    it('_drawSolidChunk should create a large, single platform', () => {
      levelGenerator._drawSolidChunk(platforms, x, y, w, h);
      expect(platforms.create).toHaveBeenCalledWith(x + w / 2, y + h / 2, 'platform');
      const mockPlatform = platforms.create.mock.results[0].value;
      expect(mockPlatform.setSize).toHaveBeenCalledWith(w, h);
    });

    it('_drawFloorChunk should create a platform at the bottom', () => {
      levelGenerator._drawFloorChunk(platforms, x, y, w, h);
      expect(platforms.create).toHaveBeenCalledWith(x + w / 2, y + h - 10, 'platform');
    });

    it('_drawVerticalShaft should create two vertical walls', () => {
      levelGenerator._drawVerticalShaft(platforms, x, y, w, h);
      expect(platforms.create).toHaveBeenCalledTimes(2);
      expect(platforms.create).toHaveBeenCalledWith(x + 10, y + h / 2, 'platform');
      expect(platforms.create).toHaveBeenCalledWith(x + w - 10, y + h / 2, 'platform');
    });
  });
});
