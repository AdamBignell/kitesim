import GreedyMesher from '../src/game/generation/GreedyMesher';
import Grid from '../src/game/generation/Grid';

describe('GreedyMesher', () => {
  let grid;

  beforeEach(() => {
    grid = new Grid(10, 10);
  });

  it('should mesh a single tile', () => {
    grid.setTile(5, 5, 1);
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 5, y: 5, width: 1, height: 1, tile: 1 }]);
  });

  it('should mesh a horizontal line', () => {
    grid.setTile(3, 5, 1);
    grid.setTile(4, 5, 1);
    grid.setTile(5, 5, 1);
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 3, y: 5, width: 3, height: 1, tile: 1 }]);
  });

  it('should mesh a vertical line', () => {
    grid.setTile(5, 3, 1);
    grid.setTile(5, 4, 1);
    grid.setTile(5, 5, 1);
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 5, y: 3, width: 1, height: 3, tile: 1 }]);
  });

  it('should mesh a solid rectangle', () => {
    for (let y = 3; y < 6; y++) {
      for (let x = 3; x < 6; x++) {
        grid.setTile(x, y, 1);
      }
    }
    const meshes = GreedyMesher.mesh(grid);
    expect(meshes).toEqual([{ x: 3, y: 3, width: 3, height: 3, tile: 1 }]);
  });

  it('should mesh a complex shape', () => {
    // A vertical bar
    grid.setTile(3, 3, 1);
    grid.setTile(3, 4, 1);
    grid.setTile(3, 5, 1);
    // A horizontal bar attached to the vertical one
    grid.setTile(4, 5, 1);
    grid.setTile(5, 5, 1);
    // A single tile somewhere else
    grid.setTile(8, 8, 1);

    const meshes = GreedyMesher.mesh(grid);
    // The order might not be guaranteed, so sort for a stable test
    meshes.sort((a, b) => a.y - b.y || a.x - b.x);

    expect(meshes).toEqual([
      { x: 3, y: 3, width: 1, height: 3, tile: 1 },
      { x: 4, y: 5, width: 2, height: 1, tile: 1 },
      { x: 8, y: 8, width: 1, height: 1, tile: 1 },
    ]);
  });
});