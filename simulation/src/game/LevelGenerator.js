import Grid from './generation/Grid.js';
import Physics from './generation/Physics.js';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile.js';

/**
 * @typedef {import('phaser').Scene} Scene
 * @typedef {import('phaser').GameObjects.Group} Group
 * @typedef {import('phaser').GameObjects.Sprite} Sprite
 * @typedef {import('phaser').Physics.Arcade.StaticGroup} StaticGroup
 */

export const TILE_TYPES = Object.freeze({
  EMPTY: 0,
  SOLID: 1,
  PLATFORM: 2, // Fall-through
});

export default class LevelGenerator {
  /** @type {Scene} */
  scene;
  /** @type {Grid} */
  grid;
  /** @type {PlayerCapabilitiesProfile} */
  pcp;

  /**
   * @param {Scene} scene - The Phaser scene.
   */
  constructor(scene) {
    this.scene = scene;
    this.grid = new Grid(50, 38); // 800x600 at 16x16 tiles
  }

  /**
   * Generates the level layout and stores it in the grid.
   */
  generate() {
    this.grid.initialize(this.grid.width, this.grid.height, TILE_TYPES.EMPTY);

    // --- Outer boundaries ---
    this.addHorizontalLine(0, this.grid.width - 1, 0, TILE_TYPES.SOLID); // Ceiling
    this.addHorizontalLine(0, this.grid.width - 1, this.grid.height - 1, TILE_TYPES.SOLID); // Floor
    this.addVerticalLine(0, this.grid.height - 1, 0, TILE_TYPES.SOLID); // Left wall
    this.addVerticalLine(0, this.grid.height - 1, this.grid.width - 1, TILE_TYPES.SOLID); // Right wall

    // --- Ground Level (Above/Below separator) ---
    const groundY = Math.floor(this.grid.height / 2);
    this.addHorizontalLine(1, this.grid.width - 2, groundY, TILE_TYPES.SOLID);

    // --- Above Ground Section (Even More dense) ---
    this.addPlatform(2, groundY - 4, 8);
    this.addFallThroughPlatform(12, groundY - 4, 5);
    this.addPlatform(20, groundY - 7, 10);
    this.addPlatform(35, groundY - 5, 10);
    this.addFallThroughPlatform(38, groundY - 10, 8);
    this.addPlatform(2, groundY - 12, 5);
    this.addPlatform(15, groundY - 14, 15);
    this.addVerticalLine(groundY-18, groundY-15, 22, TILE_TYPES.SOLID)
    this.addFallThroughPlatform(2, groundY - 18, 10)
    // Fill top-left
    this.addPlatform(1, groundY - 8, 4);
    // Fill top-right
    this.addVerticalLine(1, groundY - 1, this.grid.width - 5, TILE_TYPES.SOLID);
    this.addPlatform(this.grid.width - 15, groundY - 12, 10);


    // --- Below Ground Section (Even More maze-like) ---
    this.addHorizontalLine(1, 10, groundY + 5, TILE_TYPES.SOLID);
    this.addVerticalLine(groundY + 1, groundY + 5, 10, TILE_TYPES.SOLID);

    this.addHorizontalLine(1, 10, groundY + 12, TILE_TYPES.SOLID);
    this.addVerticalLine(groundY + 6, groundY + 12, 1, TILE_TYPES.SOLID);
    this.addPlatform(3, groundY + 8, 5);


    this.addHorizontalLine(15, 25, groundY + 8, TILE_TYPES.SOLID);
    this.addVerticalLine(groundY + 1, groundY + 8, 25, TILE_TYPES.SOLID);
    this.addVerticalLine(groundY + 8, groundY + 15, 15, TILE_TYPES.SOLID);

    this.addHorizontalLine(28, this.grid.width-2, groundY + 6, TILE_TYPES.SOLID);
    this.addHorizontalLine(28, this.grid.width-2, groundY + 14, TILE_TYPES.SOLID);
    this.addVerticalLine(groundY + 7, groundY+13, 28, TILE_TYPES.SOLID);
    // Fill bottom-right maze
    this.addHorizontalLine(30, 40, groundY + 10, TILE_TYPES.SOLID);
    this.addVerticalLine(groundY + 10, groundY + 13, 40, TILE_TYPES.SOLID);
    this.addPlatform(32, groundY + 12, 5);

    // --- Passages (wider) ---
    this.addHorizontalLine(5, 7, groundY, TILE_TYPES.EMPTY); // Opening to go down
    this.addHorizontalLine(18, 20, groundY, TILE_TYPES.EMPTY);
    this.addHorizontalLine(30, 32, groundY, TILE_TYPES.EMPTY);
    this.addHorizontalLine(45, 47, groundY, TILE_TYPES.EMPTY);

    this.addHorizontalLine(12, 14, groundY + 8, TILE_TYPES.EMPTY);
    this.addHorizontalLine(20, 22, groundY + 15, TILE_TYPES.EMPTY);
  }

  /**
   * @param {number} x1
   * @param {number} x2
   * @param {number} y
   * @param {number} tileType
   */
  addHorizontalLine(x1, x2, y, tileType) {
    for (let x = x1; x <= x2; x++) {
      this.grid.setTile(x, y, tileType);
    }
  }

  /**
   * @param {number} y1
   * @param {number} y2
   * @param {number} x
   * @param {number} tileType
   */
  addVerticalLine(y1, y2, x, tileType) {
    for (let y = y1; y <= y2; y++) {
      this.grid.setTile(x, y, tileType);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   */
  addPlatform(x, y, width) {
    this.addHorizontalLine(x, x + width - 1, y, TILE_TYPES.SOLID);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   */
  addFallThroughPlatform(x, y, width) {
    this.addHorizontalLine(x, x + width - 1, y, TILE_TYPES.PLATFORM);
  }

  /**
   * @returns {{x: number, y: number}}
   */
  getPlayerStartPosition() {
    const groundY = Math.floor(this.grid.height / 2);
    const y = groundY * 16 - 32; // Place player above the ground line
    return { x: 50, y: y };
  }

  /**
   * @param {StaticGroup} solidGroup
   * @param {StaticGroup} platformGroup
   */
  buildLevel(solidGroup, platformGroup) {
    const TILE_SIZE = 16;
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const tileType = this.grid.getTile(x, y);
        const worldX = x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = y * TILE_SIZE + TILE_SIZE / 2;

        if (tileType === TILE_TYPES.SOLID) {
          const tile = this.scene.add.rectangle(worldX, worldY, TILE_SIZE, TILE_SIZE, 0x000000);
          solidGroup.add(tile);
        } else if (tileType === TILE_TYPES.PLATFORM) {
          const tile = this.scene.add.rectangle(worldX, worldY, TILE_SIZE, TILE_SIZE, 0x0000ff);
          platformGroup.add(tile);
        }
      }
    }
    solidGroup.refresh();
    platformGroup.refresh();
  }
}
