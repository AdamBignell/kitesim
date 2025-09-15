import Structure from './Structure';
import Grid from './Grid';

export function createFloor(width, {
    height = 20,
    bottomPadding = 3,
    topPadding = 10,
    roughness = 0.5,
    wallSmoothness = 3
}) {
    const grid = new Grid(width, height, 0);

    // Create the main floor shape with a rough top surface
    for (let x = 0; x < width; x++) {
        const topY = topPadding + Math.floor(Math.random() * roughness * height);
        for (let y = topY; y < height - bottomPadding; y++) {
            grid.setTile(x, y, 1);
        }
    }

    // Smooth out the walls to make them less sheer
    for (let y = topPadding; y < height - bottomPadding; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (grid.getTile(x, y) === 1) {
                for (let i = 1; i <= wallSmoothness; i++) {
                    if (grid.getTile(x - i, y) === 0 && Math.random() > 0.5) {
                        grid.setTile(x - i, y, 1);
                    }
                    if (grid.getTile(x + i, y) === 0 && Math.random() > 0.5) {
                        grid.setTile(x + i, y, 1);
                    }
                }
            }
        }
    }

    const snapPoints = new Map([
        ['left', [{ x: 0, y: Math.floor(height / 2) }]],
        ['right', [{ x: width - 1, y: Math.floor(height / 2) }]],
    ]);

    return new Structure(width, height, grid, snapPoints);
}
