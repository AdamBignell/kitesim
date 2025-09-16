import * as Phaser from 'phaser';

/**
 * Creates a smooth, spline-based curve for the terrain surface.
 * This function generates a series of anchor points and creates a Phaser.Curves.Spline
 * that passes through them, resulting in a free-flowing hill effect.
 *
 * @param {number} width The total pixel width of the terrain spline.
 * @param {object} options An object containing configuration for the spline generation.
 * @param {number} [options.height=600] The total pixel height of the generation area.
 * @param {number} [options.numPoints=15] The number of anchor points for the spline. More points create more detail.
 * @param {number} [options.minHillHeight=40] The minimum pixel height change between anchor points.
 * @param {number} [options.maxHillHeight=120] The maximum pixel height change between anchor points.
 * @param {number} [options.topPadding=150] The minimum pixel distance from the top of the area to prevent hills from going off-screen.
 * @param {number} [options.bottomPadding=150] The minimum pixel distance from the bottom.
 * @returns {Phaser.Curves.Spline} A spline object representing the terrain surface.
 */
export function createFloor(width, {
    height = 600,
    numPoints = 15,
    minHillHeight = 40,
    maxHillHeight = 120,
    topPadding = 150,
    bottomPadding = 150
}) {
    const points = [];
    const segmentWidth = width / (numPoints - 1);

    // Start the terrain about 60% of the way down the area.
    let y = height * 0.6;

    // Generate the anchor points for our spline
    for (let i = 0; i < numPoints; i++) {
        const x = i * segmentWidth;

        if (i > 0 && i < numPoints - 1) {
            // For intermediate points, add a random positive or negative change to the height.
            const heightChange = Phaser.Math.Between(-minHillHeight, maxHillHeight);
            y += heightChange;
        }

        // Clamp the y-coordinate to keep the terrain within the desired vertical bounds.
        const clampedY = Phaser.Math.Clamp(y, topPadding, height - bottomPadding);
        points.push(x, clampedY);

        // After the first point, update `y` to the clamped value to ensure the next point
        // is relative to the actual last point, creating a continuous walk.
        if (i > 0) {
            y = clampedY;
        }
    }

    // Create the Spline object from the generated points.
    const spline = new Phaser.Curves.Spline(points);
    return spline;
}
