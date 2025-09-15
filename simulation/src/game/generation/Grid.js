/**
 * @class Grid
 * @description Manages 2D tilemap data with clean abstractions over a raw 2D array.
 */
export default class Grid {
  constructor(width, height, defaultTile = 0) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.initialize(width, height, defaultTile);
  }

  /**
   * Initializes the grid with a default tile type.
   * @param {number} width - The width of the grid.
   * @param {number} height - The height of the grid.
   * @param {*} defaultTile - The tile to fill the grid with.
   */
  initialize(width, height, defaultTile) {
    this.width = width;
    this.height = height;
    this.tiles = Array(height).fill(null).map(() => Array(width).fill(defaultTile));
  }

  /**
   * Gets the tile at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {*} The tile type or undefined if out of bounds.
   */
  getTile(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x];
    }
    return undefined; // Out of bounds
  }

  /**
   * Sets the tile at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {*} tileType - The type of tile to set.
   */
  setTile(x, y, tileType) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = tileType;
    }
  }

  /**
   * Converts the grid to a 2D integer array for Phaser.
   * @returns {number[][]}
   */
  toArray() {
    // Implementation for Phase 3
    return this.tiles;
  }
}
