import Grid from './Grid';

/**
 * A class to validate the traversability of a composed room.
 */
export default class TraversalValidator {
  /**
   * @param {Room} room - The room to validate.
   */
  constructor(room) {
    this.room = room;
    this.grid = room.grid;
  }

  /**
   * Checks if the room is traversable using a Breadth-First Search (BFS) algorithm.
   * @returns {boolean} - True if the room is traversable, false otherwise.
   */
  isTraversable() {
    const { width, height } = this.grid;
    const visited = new Grid(width, height, false);
    const queue = [];

    // Find the first non-empty tile to start the search from
    let startNode = null;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.grid.getTile(x, y) !== null) {
          startNode = { x, y };
          break;
        }
      }
      if (startNode) break;
    }

    // If there are no tiles, the room is trivially traversable
    if (!startNode) {
      return true;
    }

    queue.push(startNode);
    visited.setTile(startNode.x, startNode.y, true);
    let count = 1;

    while (queue.length > 0) {
      const { x, y } = queue.shift();

      // Get neighbors
      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ];

      for (const neighbor of neighbors) {
        const { x: nx, y: ny } = neighbor;
        if (
          this.grid._isValid(nx, ny) &&
          this.grid.getTile(nx, ny) !== null &&
          !visited.getTile(nx, ny)
        ) {
          visited.setTile(nx, ny, true);
          queue.push(neighbor);
          count++;
        }
      }
    }

    // Check if all non-empty tiles were visited
    let totalTiles = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.grid.getTile(x, y) !== null) {
          totalTiles++;
        }
      }
    }

    return count === totalTiles;
  }
}
