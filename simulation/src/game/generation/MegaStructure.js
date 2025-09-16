import Structure from './Structure';
import Grid from './Grid';

export function createFloor(width, {
    height = 100,
    bottomPadding = 10,
    topPadding = 20,
    // Player capabilities
    maxJumpHeight = 20, // Max height player can jump, in tiles
    maxStepHeight = 2, // Max height player can walk up without jumping
    // Terrain feature probabilities
    flatProbability = 0.3,
    slopeProbability = 0.5
}) {
    const grid = new Grid(width, height, 0);
    let currentHeight = height - bottomPadding - 20;

    for (let x = 0; x < width; ) {
        const rand = Math.random();

        if (rand < flatProbability) {
            // Create a flat section
            const length = Math.floor(Math.random() * 20) + 10;
            for (let i = 0; i < length && x + i < width; i++) {
                for (let y = currentHeight; y < height; y++) {
                    grid.setTile(x + i, y, 1);
                }
            }
            x += length;
        } else if (rand < flatProbability + slopeProbability) {
            // Create a slope
            const length = Math.floor(Math.random() * 20) + 10;
            const slopeHeight = Math.floor(Math.random() * (maxJumpHeight - 1)) + 1;
            const slopeDirection = Math.random() > 0.5 ? 1 : -1;

            for (let i = 0; i < length && x + i < width; i++) {
                const y = currentHeight + Math.round((i / length) * slopeHeight * slopeDirection);
                if (y < height - bottomPadding && y >= topPadding) {
                    for (let j = y; j < height; j++) {
                        grid.setTile(x + i, j, 1);
                    }
                }
            }
            currentHeight += slopeHeight * slopeDirection;
            if (currentHeight >= height - bottomPadding) currentHeight = height - bottomPadding -1;
            if (currentHeight < topPadding) currentHeight = topPadding;
            x += length;
        } else {
            // Create a wall
            const wallHeight = Math.floor(Math.random() * (maxJumpHeight - maxStepHeight)) + maxStepHeight + 1;
            const wallDirection = Math.random() > 0.5 ? 1 : -1;
            const newHeight = currentHeight - (wallHeight * wallDirection);

            if (newHeight < height - bottomPadding && newHeight >= topPadding) {
                const wallX = x > 0 ? x - 1 : x;
                const startY = Math.min(currentHeight, newHeight);
                const endY = Math.max(currentHeight, newHeight);

                // Draw the vertical wall
                for (let y = startY; y <= endY; y++) {
                    grid.setTile(wallX, y, 1);
                }

                // Fill below the wall
                for (let y = endY + 1; y < height; y++) {
                    grid.setTile(wallX, y, 1);
                }

                currentHeight = newHeight;
            }

            // Fill the current column below the new height
            for (let y = currentHeight; y < height; y++) {
                grid.setTile(x, y, 1);
            }
            x++;
        }
    }

    const snapPoints = new Map([
        ['left', [{ x: 0, y: Math.floor(height / 2) }]],
        ['right', [{ x: width - 1, y: Math.floor(height / 2) }]],
    ]);

    return new Structure(width, height, grid, snapPoints);
}
