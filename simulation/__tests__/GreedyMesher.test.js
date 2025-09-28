import GreedyMesher from '../src/game/generation/GreedyMesher.js';
import Grid from '../src/game/generation/Grid.js';

describe('GreedyMesher', () => {
  it('should return an empty array for an empty grid', () => {
    const grid = new Grid(10, 10, 0);
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([]);
  });

  it('should mesh a single tile', () => {
    const grid = new Grid(10, 10, 0);
    grid.setTile(5, 5, 1);
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 5, y: 5, width: 1, height: 1, tile: 1 }]);
  });

  it('should mesh a horizontal line', () => {
    const grid = new Grid(10, 10, 0);
    grid.setTile(3, 5, 1);
    grid.setTile(4, 5, 1);
    grid.setTile(5, 5, 1);
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 3, y: 5, width: 3, height: 1, tile: 1 }]);
  });

  it('should mesh a vertical line', () => {
    const grid = new Grid(10, 10, 0);
    grid.setTile(5, 3, 1);
    grid.setTile(5, 4, 1);
    grid.setTile(5, 5, 1);
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 5, y: 3, width: 1, height: 3, tile: 1 }]);
  });

  it('should mesh a solid rectangle', () => {
    const grid = new Grid(10, 10, 0);
    for (let y = 3; y < 6; y++) {
      for (let x = 3; x < 6; x++) {
        grid.setTile(x, y, 1);
      }
    }
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 3, y: 3, width: 3, height: 3, tile: 1 }]);
  });

  it('should mesh a complex shape', () => {
    const grid = new Grid(10, 10, 0);
    // L-shape
    grid.setTile(3, 3, 1);
    grid.setTile(3, 4, 1);
    grid.setTile(3, 5, 1);
    grid.setTile(4, 5, 1);
    grid.setTile(5, 5, 1);

    // Separate block
    grid.setTile(8, 8, 1);

    const meshes = GreedyMesher.mesh(grid);
    // The order of the meshes can vary, so we'll sort them to make the test deterministic
    meshes.sort((a, b) => a.y - b.y || a.x - b.x);

    expect(meshes).toEqual([
      { x: 3, y: 3, width: 1, height: 3, tile: 1 },
      { x: 4, y: 5, width: 2, height: 1, tile: 1 },
      { x: 8, y: 8, width: 1, height: 1, tile: 1 },
    ]);
  });
});
