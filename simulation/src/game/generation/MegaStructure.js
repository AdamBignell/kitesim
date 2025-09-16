import * as Phaser from 'phaser';

/**
 * Creates a smooth, curved terrain surface for a chunk.
 * Instead of a grid, this function returns a Phaser.Curves.Spline object
 * that defines the shape of the hills.
 *
 * @param {number} widthInTiles - The width of the chunk in tiles.
 * @param {object} options - Configuration options for terrain generation.
 * @param {number} [options.heightInTiles=64] - The height of the chunk in tiles.
 * @param {number} [options.tileSize=32] - The size of a single tile in pixels.
 * @param {number} [options.numPoints=15] - How many "anchor" points for the spline. More points = more variation.
 * @param {number} [options.minHillHeight=50] - The minimum height change for a hill/valley in pixels.
 * @param {number} [options.maxHillHeight=150] - The maximum height change for a hill/valley in pixels.
 * @returns {Phaser.Curves.Spline} A spline object representing the terrain surface.
 */
export function createFloor(widthInTiles, {
    heightInTiles = 64,
    tileSize = 32,
    numPoints = 15,
    minHillHeight = 50,
    maxHillHeight = 150
}) {
    const widthInPixels = widthInTiles * tileSize;
    const heightInPixels = heightInTiles * tileSize;

    const points = [];
    const segmentWidth = widthInPixels / (numPoints - 1);

    // Start the terrain around 60% of the way down the chunk.
    let currentY = heightInPixels * 0.6;

    // Create the anchor points for our smooth curve
    for (let i = 0; i < numPoints; i++) {
        const x = i * segmentWidth;

        if (i === 0 || i === numPoints - 1) {
            // Start and end flat to allow for smoother chunk-to-chunk transitions.
            points.push(x, currentY);
        } else {
            // Add a random hill or valley.
            const randomHeightChange = Phaser.Math.FloatBetween(-minHillHeight, maxHillHeight);
            let newY = currentY + randomHeightChange;

            // Clamp the height to stay within the chunk's vertical bounds, with some padding.
            const topPadding = heightInPixels * 0.25;
            const bottomPadding = heightInPixels * 0.75;
            newY = Phaser.Math.Clamp(newY, topPadding, bottomPadding);

            points.push(x, newY);
            // The next point's height is relative to this one, creating a "walk".
            currentY = newY;
        }
    }

    // Create the Spline object from these points.
    // The points array is [x1, y1, x2, y2, ...]
    const spline = new Phaser.Curves.Spline(points);
    return spline;
}
