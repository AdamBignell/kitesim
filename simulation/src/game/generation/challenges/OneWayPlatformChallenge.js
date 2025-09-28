import Challenge from './Challenge';
import * as Structures from '../structures';

export default class OneWayPlatformChallenge extends Challenge {
    generate(grid, startX, startY, config) {
        const {
            minPlatforms = 3,
            maxPlatforms = 7,
            maxHorizontalGap = 5, // Max tiles between platforms horizontally
            minHorizontalGap = 2,
            maxVerticalGap = 4,   // Max tiles between platforms vertically
            minVerticalGap = -2,  // Min (can go down)
        } = config;

        const numPlatforms = Math.floor(Math.random() * (maxPlatforms - minPlatforms + 1)) + minPlatforms;
        const structure = Structures.oneWayPlatform; // Assuming this is a 1x1 or similar structure

        let currentX = startX;
        let currentY = startY - 3; // Start slightly above the ground
        let direction = Math.random() > 0.5 ? 1 : -1; // 1 for right, -1 for left

        for (let i = 0; i < numPlatforms; i++) {
            // Place the platform
            if (grid.isInBounds(currentX, currentY)) {
                // Carve out a small area for the platform to ensure it doesn't overlap
                grid.clearRect(currentX -1, currentY - 1, structure.width + 2, structure.height + 2);
                grid.stamp(currentX, currentY, structure.grid);
            }

            // Determine the position of the next platform
            const horizontalGap = Math.floor(Math.random() * (maxHorizontalGap - minHorizontalGap + 1)) + minHorizontalGap;
            const verticalGap = Math.floor(Math.random() * (maxVerticalGap - minVerticalGap + 1)) + minVerticalGap;

            currentX += horizontalGap * direction;
            currentY -= verticalGap; // Move upwards (or downwards if verticalGap is negative)

            // Boundary checks and direction change
            if (currentX < 5 || currentX > grid.width - 5) {
                direction *= -1; // Reverse direction
                currentX += horizontalGap * direction * 2; // Move back into bounds
            }
            if (currentY < 5 || currentY > grid.height - 10) {
                // If we go too high or too low, stop generating
                break;
            }
        }
    }
}