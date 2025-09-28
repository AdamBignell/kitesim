export default class Challenge {
    constructor(scene, playerCapabilities) {
        this.scene = scene;
        this.playerCapabilities = playerCapabilities;
    }

    /**
     * @param {Grid} grid The grid to modify.
     * @param {number} startX The starting X position of the challenge in the grid.
     * @param {number} startY The starting Y position of the challenge in the grid.
     * @param {object} config An object for challenge-specific configuration.
     */
    generate(grid, startX, startY, config) {
        // Base class does nothing. Subclasses should override this.
        console.warn("Challenge.generate() is not implemented. This should be overridden by a subclass.");
    }

    /**
     * A helper function to check if a tile is a valid placement target.
     * For example, it should be solid ground.
     * @param {Grid} grid The grid to check against.
     * @param {number} x The x-coordinate of the tile.
     * @param {number} y The y-coordinate of the tile.
     * @returns {boolean}
     */
    isSuitablePlacement(grid, x, y) {
        // Suitable if the tile itself is solid and the one above is empty
        return grid.getTile(x, y) === 1 && grid.getTile(x, y - 1) === 0;
    }
}