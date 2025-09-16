/**
 * @enum {number}
 */
export const TileType = {
  EMPTY: 0,
  SOLID: 1,
  SLOPE_45_RIGHT: 2,
  SLOPE_45_LEFT: 3,
};

export default class Tile {
  /**
   * @param {TileType} type - The type of the tile.
   */
  constructor(type = TileType.EMPTY) {
    this.type = type;
  }
}
