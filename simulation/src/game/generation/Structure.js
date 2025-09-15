import Grid from './Grid';

/**
 * @typedef {'top' | 'bottom' | 'left' | 'right'} SnapPointType
 */

/**
 * Represents a prefabricated structure that can be placed in the world.
 */
export default class Structure {
  /**
   * @param {number} width - The width of the structure in tiles.
   * @param {number} height - The height of the structure in tiles.
   * @param {Grid} grid - The grid of tiles representing the structure.
   * @param {Map<SnapPointType, {x: number, y: number}[]>} snapPoints - The snap points for connecting to other structures.
   */
  constructor(width, height, grid, snapPoints) {
    this.width = width;
    this.height = height;
    this.grid = grid;
    this.snapPoints = snapPoints;
  }
}
