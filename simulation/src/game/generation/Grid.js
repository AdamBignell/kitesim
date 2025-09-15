/**
 * A class to manage the 2D tilemap data, providing a clean abstraction over a raw 2D array.
 */
export default class Grid {
  /**
   * @param {number} width - The width of the grid.
   * @param {number} height - The height of the grid.
   * @param {any} [defaultTile=0] - The default tile type to initialize the grid with.
   */
  constructor(width, height, defaultTile = 0) {
    /** @private @type {number} */
    this.width = width;
    /** @private @type {number} */
    this.height = height;
    /** @private @type {any[][]} */
    this.grid = [];
    this.initialize(width, height, defaultTile);
  }

  /**
   * Initializes or re-initializes the grid with a default tile type.
   * @param {number} width - The new width of the grid.
   * @param {number} height - The new height of the grid.
   * @param {any} defaultTile - The tile type to fill the grid with.
   */
  initialize(width, height, defaultTile) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => defaultTile)
    );
  }

  /**
   * Checks if the given coordinates are within the grid boundaries.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {boolean} - True if the coordinates are valid, false otherwise.
   * @private
   */
  _isValid(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Gets the tile type at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {any | undefined} - The tile type at the given coordinates, or undefined if out of bounds.
   */
  getTile(x, y) {
    if (!this._isValid(x, y)) {
      console.warn(`Coordinates (${x}, ${y}) are out of bounds.`);
      return undefined;
    }
    return this.grid[y][x];
  }

  /**
   * Sets the tile type at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {any} tileType - The new tile type.
   */
  setTile(x, y, tileType) {
    if (!this._isValid(x, y)) {
      console.warn(`Coordinates (${x}, ${y}) are out of bounds. Cannot set tile.`);
      return;
    }
    this.grid[y][x] = tileType;
  }

  /**
   * Fills a rectangular area of the grid with a value.
   * @param {number} x - The starting x-coordinate.
   * @param {number} y - The starting y-coordinate.
   * @param {number} width - The width of the rectangle.
   * @param {number} height - The height of the rectangle.
   * @param {*} value - The value to fill with.
   */
  fillRect(x, y, width, height, value) {
    for (let j = y; j < y + height; j++) {
      for (let i = x; i < x + width; i++) {
        this.setTile(i, j, value);
      }
    }
  }

  /**
   * Converts the grid into a standard 2D integer array.
   * Assumes tile types are numbers (e.g., 0 for empty, 1 for solid).
   * @returns {number[][]} - The 2D integer array representation of the grid.
   */
  toArray() {
    return this.grid.map(row => row.map(tile => Number(tile)));
  }
}
