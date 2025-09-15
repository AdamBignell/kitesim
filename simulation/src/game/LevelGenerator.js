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
    // Fill the entire grid with empty tiles first
    this.grid.initialize(this.grid.width, this.grid.height, TILE_TYPES.EMPTY);

    // Create the outer walls
    for (let x = 0; x < this.grid.width; x++) {
      this.grid.setTile(x, 0, TILE_TYPES.SOLID); // Ceiling
      this.grid.setTile(x, this.grid.height - 1, TILE_TYPES.SOLID); // Floor
    }
    for (let y = 0; y < this.grid.height; y++) {
      this.grid.setTile(0, y, TILE_TYPES.SOLID); // Left wall
      this.grid.setTile(this.grid.width - 1, y, TILE_TYPES.SOLID); // Right wall
    }

    // Add some platforms
    this.addPlatform(5, 30, 10);
    this.addPlatform(15, 25, 10);
    this.addPlatform(25, 20, 10);

    // Add a fall-through platform
    this.addFallThroughPlatform(35, 15, 10);

    // Add another platform high up
    this.addPlatform(20, 10, 10);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   */
  addPlatform(x, y, width) {
    for (let i = 0; i < width; i++) {
      this.grid.setTile(x + i, y, TILE_TYPES.SOLID);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   */
  addFallThroughPlatform(x, y, width) {
    for (let i = 0; i < width; i++) {
      this.grid.setTile(x + i, y, TILE_TYPES.PLATFORM);
    }
  }

  /**
   * @returns {{x: number, y: number}}
   */
  getPlayerStartPosition() {
    return { x: 100, y: 450 };
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
