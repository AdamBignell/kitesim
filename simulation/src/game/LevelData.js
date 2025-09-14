/**
 * @fileoverview This file defines the LevelData class, which serves as the
 * canonical data structure for a procedurally generated level. The LevelGenerator
 * produces an instance of this class, and the Phaser scene consumes it to build
 * the final, renderable level.
 */

export default class LevelData {
    /**
     * @param {number} width - The width of the level in tiles.
     * @param {number} height - The height of the level in tiles.
     * @param {number} tileSize - The size of each tile in pixels.
     */
    constructor(width, height, tileSize) {
        /** @type {number} */
        this.width = width;

        /** @type {number} */
        this.height = height;

        /** @type {number} */
        this.tileSize = tileSize;

        /**
         * The 2D array representing the logical grid of the level.
         * Each element is an object, e.g., { type: 'WALL', tileIndex: 2, collides: true }
         * @type {Array<Array<Object>>}
         */
        this.grid = Array(height).fill(null).map(() => Array(width).fill({ type: 'EMPTY', tileIndex: -1, collides: false }));

        /**
         * An array of objects for entities and special platforms that are not
         * part of the main tile grid.
         * e.g., { type: 'ONE_WAY_PLATFORM', x: 128, y: 256, tileKey: 'platform_oneway' }
         * @type {Array<Object>}
         */
        this.specialObjects = [];

        /**
         * The starting position for the player in pixels.
         * @type {{x: number, y: number}}
         */
        this.startPosition = { x: 0, y: 0 };

        /**
         * The end position or goal of the level in pixels.
         * @type {{x: number, y: number}}
         */
        this.endPosition = { x: 0, y: 0 };
    }
}
