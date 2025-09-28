import Challenge from './Challenge';

export default class SheerCliffClimbChallenge extends Challenge {
    generate(grid, startX, startY, config) {
        const {
            minHeight = 8,
            maxHeight = 20,
            minWidth = 7,
            maxWidth = 12,
            platformWidth = 2,
            wallSectionHeight = 4,
            wallSectionChance = 0.4
        } = config;

        // 1. Calculate a safe height that won't go out of the chunk's top boundary.
        const availableHeight = startY - 5; // Leave a 5-tile margin from the top.
        if (availableHeight < minHeight) {
            console.warn("Sheer Cliff Climb: Not enough vertical space to generate challenge.");
            return;
        }
        const cliffHeight = Math.floor(Math.random() * (Math.min(maxHeight, availableHeight) - minHeight + 1)) + minHeight;
        const cliffWidth = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
        const cliffTopY = startY - cliffHeight;

        // Ensure we don't go out of bounds horizontally.
        if (startX + cliffWidth >= grid.width) {
            console.warn("Sheer Cliff Climb: Not enough horizontal space.");
            return;
        }

        // 2. Build a solid block of terrain to represent the cliff.
        for (let y = cliffTopY; y < startY; y++) {
            for (let x = startX; x < startX + cliffWidth; x++) {
                grid.setTile(x, y, 1);
            }
        }

        // 3. Carve out a path inside this new solid block, leaving a 1-tile border for walls.
        grid.clearRect(startX + 1, cliffTopY, cliffWidth - 2, cliffHeight);

        // 4. Generate the climbable path inside the carved-out area.
        let currentY = startY - 3; // Start placing platforms a bit above the base.
        let lastPlatformSide = 'left'; // 'left' or 'right'

        while (currentY > cliffTopY + 2) {
            const verticalGap = Math.floor(Math.random() * 2) + 2; // 2-3 tiles of vertical distance
            currentY -= verticalGap;
            if (currentY <= cliffTopY) break;

            if (Math.random() < wallSectionChance) {
                // Place a wall section for wall-jumping.
                const wallX = lastPlatformSide === 'left' ? startX + cliffWidth - 2 : startX + 1;
                for (let i = 0; i < wallSectionHeight; i++) {
                    if (currentY - i > cliffTopY) {
                        grid.setTile(wallX, currentY - i, 1);
                    }
                }
            } else {
                // Place a small platform.
                let platformX;
                if (lastPlatformSide === 'left') {
                    platformX = startX + 2;
                } else {
                    platformX = startX + cliffWidth - 1 - platformWidth - 1;
                }
                for (let i = 0; i < platformWidth; i++) {
                    grid.setTile(platformX + i, currentY, 1);
                }
            }
            // Alternate sides for the next placement.
            lastPlatformSide = lastPlatformSide === 'left' ? 'right' : 'left';
        }

        // 5. Place a reward platform and a collectible at the top.
        const rewardX = startX + Math.floor(cliffWidth / 2) - 1;
        const rewardPlatformY = cliffTopY + 1;
        for (let i = 0; i < platformWidth + 1; i++) {
             grid.setTile(rewardX + i, rewardPlatformY, 1);
        }
        if (grid.isInBounds(rewardX, rewardPlatformY - 1)) {
            grid.setTile(rewardX + 1, rewardPlatformY - 1, 4); // 4 is the collectible tile type
        }
    }
}