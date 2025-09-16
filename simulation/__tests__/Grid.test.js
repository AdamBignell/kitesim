import Grid from '../src/game/generation/Grid';

describe('Grid', () => {
    let grid;

    beforeEach(() => {
        grid = new Grid(10, 10, 0);
    });

    it('should initialize with the correct width, height, and default tile', () => {
        expect(grid.width).toBe(10);
        expect(grid.height).toBe(10);
        expect(grid.getTile(0, 0)).toBe(0);
    });

    it('should set and get a tile', () => {
        grid.setTile(5, 5, 1);
        expect(grid.getTile(5, 5)).toBe(1);
    });

    it('should not set a tile out of bounds', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        grid.setTile(15, 15, 1);
        expect(grid.getTile(15, 15)).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith('Coordinates (15, 15) are out of bounds. Cannot set tile.');
        consoleSpy.mockRestore();
    });

    it('should fill a rectangle with a value', () => {
        grid.fillRect(2, 2, 3, 3, 1);
        for (let y = 2; y < 5; y++) {
            for (let x = 2; x < 5; x++) {
                expect(grid.getTile(x, y)).toBe(1);
            }
        }
    });

    it('should convert the grid to an array', () => {
        grid.setTile(0, 0, 1);
        const array = grid.toArray();
        expect(array[0][0]).toBe(1);
        expect(array[1][1]).toBe(0);
    });
});
