import Grid from '../src/game/generation/Grid.js';

describe('Grid', () => {
  it('should initialize with a default tile', () => {
    const grid = new Grid(10, 10, 0);
    expect(grid.getTile(0, 0)).toBe(0);
    expect(grid.getTile(9, 9)).toBe(0);
  });

  it('should set and get a tile', () => {
    const grid = new Grid(10, 10, 0);
    grid.setTile(5, 5, 1);
    expect(grid.getTile(5, 5)).toBe(1);
  });

  it('should return undefined for out-of-bounds get', () => {
    const grid = new Grid(10, 10, 0);
    // Suppress console.warn for this test
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(grid.getTile(10, 10)).toBeUndefined();
    consoleWarnSpy.mockRestore();
  });

  it('should not throw for out-of-bounds set', () => {
    const grid = new Grid(10, 10, 0);
    // Suppress console.warn for this test
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => grid.setTile(10, 10, 1)).not.toThrow();
    consoleWarnSpy.mockRestore();
  });

  it('should correctly check for valid coordinates', () => {
    const grid = new Grid(10, 10, 0);
    expect(grid._isValid(5, 5)).toBe(true);
    expect(grid._isValid(10, 5)).toBe(false);
    expect(grid._isValid(5, 10)).toBe(false);
    expect(grid._isValid(-1, 5)).toBe(false);
    expect(grid._isValid(5, -1)).toBe(false);
  });
});
