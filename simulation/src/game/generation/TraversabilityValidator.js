import Physics from './Physics';
import * as Phaser from 'phaser';

export default class TraversabilityValidator {
  constructor(grid, pcp) {
    this.grid = grid;
    this.pcp = pcp;
    this.physics = new Physics(pcp);
  }

  isTraversable(startPoint, endPoint) {
    const queue = [startPoint];
    const visited = new Set();
    visited.add(`${startPoint.x},${startPoint.y}`);

    while (queue.length > 0) {
      const currentPoint = queue.shift();

      if (currentPoint.x === endPoint.x && currentPoint.y === endPoint.y) {
        return true;
      }

      // Get neighbors
      const neighbors = this.getNeighbors(currentPoint);

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  getNeighbors(point) {
    const neighbors = [];
    const { x, y } = point;

    // Horizontal movement
    if (this.isWalkable(x + 1, y)) neighbors.push(new Phaser.Math.Vector2(x + 1, y));
    if (this.isWalkable(x - 1, y)) neighbors.push(new Phaser.Math.Vector2(x - 1, y));

    // Jumping
    const maxJumpHeight = this.physics.calculateMaxJumpHeight() / 16; // Convert to tiles
    for (let i = 1; i <= maxJumpHeight; i++) {
      if (this.isWalkable(x, y - i)) {
        // Check for obstructions
        let obstructed = false;
        for (let j = 1; j < i; j++) {
          if (!this.isWalkable(x, y - j)) {
            obstructed = true;
            break;
          }
        }
        if (!obstructed) {
          neighbors.push(new Phaser.Math.Vector2(x, y - i));
        }
      }
    }

    // Falling
    if (this.isWalkable(x, y + 1)) {
        neighbors.push(new Phaser.Math.Vector2(x, y + 1));
    }

    return neighbors;
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.grid.width || y < 0 || y >= this.grid.height) {
        return false;
    }
    return this.grid.getTile(x, y) === 0;
  }
}
