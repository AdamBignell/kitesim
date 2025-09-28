export default class CaveGenerator {
  constructor(grid) {
    this.grid = grid;
    this.width = grid.width;
    this.height = grid.height;
  }

  generate(iterations = 5, fillProbability = 0.5, birthLimit = 4, deathLimit = 3) {
    // 1. Randomly fill the grid
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (Math.random() < fillProbability) {
          this.grid.setTile(x, y, 1);
        }
      }
    }

    // 2. Run the simulation for a number of iterations
    for (let i = 0; i < iterations; i++) {
      const newGrid = this.grid.clone();
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const neighbors = this.countAliveNeighbors(x, y);
          const oldState = this.grid.getTile(x, y);

          if (oldState === 1) { // If it's a wall
            if (neighbors < deathLimit) {
              newGrid.setTile(x, y, 0); // It dies
            }
          } else { // If it's empty
            if (neighbors > birthLimit) {
              newGrid.setTile(x, y, 1); // It's born
            }
          }
        }
      }
      this.grid = newGrid;
    }
    return this.grid;
  }

  countAliveNeighbors(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;

        const neighborX = x + i;
        const neighborY = y + j;

        if (neighborX >= 0 && neighborX < this.width && neighborY >= 0 && neighborY < this.height) {
          if (this.grid.getTile(neighborX, neighborY) === 1) {
            count++;
          }
        } else {
          // Consider out-of-bounds as a wall to keep edges solid
          count++;
        }
      }
    }
    return count;
  }
}