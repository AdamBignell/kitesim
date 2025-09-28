import Challenge from './Challenge';

export default class CaveExplorationChallenge extends Challenge {
    generate(grid, startX, startY, config) {
        const {
            maxLength = 50,      // Max number of segments in the cave path
            minTurnStep = 5,     // Min steps before a potential turn
            maxTurnStep = 15,    // Max steps before a potential turn
            turnChance = 0.6,    // Chance to turn after moving straight for a bit
            brushSize = 2,       // Radius of the carving tool
            branchChance = 0.2,  // Chance to create a side branch
        } = config;

        // Start carving from just below the surface
        let currentX = startX;
        let currentY = startY + 1;
        let direction = { x: Math.random() > 0.5 ? 1 : -1, y: 0 }; // Start moving horizontally
        let stepsSinceTurn = 0;
        let stepsUntilNextTurn = Math.floor(Math.random() * (maxTurnStep - minTurnStep)) + minTurnStep;

        for (let i = 0; i < maxLength; i++) {
            // --- Carve out the current position ---
            this.carve(grid, currentX, currentY, brushSize);

            // --- Branching Logic ---
            if (Math.random() < branchChance) {
                // Create a new branch starting from the current position
                const branchDirection = Math.random() > 0.5
                    ? { x: direction.y, y: direction.x }   // Turn right
                    : { x: -direction.y, y: -direction.x }; // Turn left
                this.createBranch(grid, currentX, currentY, branchDirection, Math.floor(maxLength / 3), brushSize);
            }


            // --- Turning Logic ---
            stepsSinceTurn++;
            if (stepsSinceTurn >= stepsUntilNextTurn && Math.random() < turnChance) {
                // Change direction: prefer to go downwards
                const preferDown = Math.random() < 0.7; // 70% chance to try turning down first
                if (preferDown && direction.y === 0) {
                    direction = { x: 0, y: 1 }; // Turn downwards
                } else {
                    // Turn left or right relative to the current direction
                    direction = Math.random() > 0.5
                        ? { x: direction.y, y: direction.x }   // Turn right
                        : { x: -direction.y, y: -direction.x }; // Turn left
                }
                stepsSinceTurn = 0;
                stepsUntilNextTurn = Math.floor(Math.random() * (maxTurnStep - minTurnStep)) + minTurnStep;
            }

            // --- Move to the next position ---
            currentX += direction.x;
            currentY += direction.y;

            // --- Boundary Checks ---
            // Stop if we go out of bounds or too close to the top surface again
            if (currentX < brushSize || currentX >= grid.width - brushSize || currentY < startY - 10 || currentY >= grid.height - brushSize) {
                break;
            }
        }
    }

    createBranch(grid, startX, startY, direction, length, brushSize) {
        let currentX = startX;
        let currentY = startY;
        for (let i = 0; i < length; i++) {
            this.carve(grid, currentX, currentY, brushSize);
            currentX += direction.x;
            currentY += direction.y;

            if (currentX < brushSize || currentX >= grid.width - brushSize || currentY < 0 || currentY >= grid.height - brushSize) {
                // Place a collectible at the end of the branch before breaking
                if (grid.isInBounds(currentX - direction.x, currentY - direction.y)) {
                    grid.setTile(currentX - direction.x, currentY - direction.y, 4); // 4 for collectible
                }
                break;
            }
        }
    }

    carve(grid, cx, cy, radius) {
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                if (x * x + y * y <= radius * radius) {
                    const gridX = cx + x;
                    const gridY = cy + y;
                    if (grid.isInBounds(gridX, gridY)) {
                        // Don't carve the absolute top layer of the world
                        const isSurface = (gridY > 0 && grid.getTile(gridX, gridY - 1) === 0);
                        if (!isSurface) {
                            grid.setTile(gridX, gridY, 0); // 0 is empty space
                        }
                    }
                }
            }
        }
    }
}