/**
 * A class to implement the greedy meshing algorithm for combining tiles into larger rectangles.
 */
export default class GreedyMesher {
  /**
   * Applies the greedy meshing algorithm to a grid.
   * @param {Grid} grid - The grid to process.
   * @returns {Array<{x: number, y: number, width: number, height: number}>} - A list of rectangles.
   */
  static mesh(grid) {
    const meshes = [];
    const visited = new Set();
    const width = grid.width;
    const height = grid.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = grid.getTile(x, y);
        const key = `${x},${y}`;

        if (tile !== 0 && !visited.has(key)) {
          let meshWidth = 1;
          while (
            x + meshWidth < width &&
            grid.getTile(x + meshWidth, y) === tile &&
            !visited.has(`${x + meshWidth},${y}`)
          ) {
            meshWidth++;
          }

          let meshHeight = 1;
          let canExtend = true;
          while (y + meshHeight < height) {
            for (let i = 0; i < meshWidth; i++) {
              if (
                grid.getTile(x + i, y + meshHeight) !== tile ||
                visited.has(`${x + i},${y + meshHeight}`)
              ) {
                canExtend = false;
                break;
              }
            }
            if (canExtend) {
              meshHeight++;
            } else {
              break;
            }
          }

          for (let my = 0; my < meshHeight; my++) {
            for (let mx = 0; mx < meshWidth; mx++) {
              visited.add(`${x + mx},${y + my}`);
            }
          }

          meshes.push({ x, y, width: meshWidth, height: meshHeight });
        }
      }
    }

    return meshes;
  }
}
