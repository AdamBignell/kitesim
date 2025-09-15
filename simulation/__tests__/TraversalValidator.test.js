import TraversalValidator from '../src/game/generation/TraversalValidator';
import Room from '../src/game/generation/Room';
import Prefab from '../src/game/generation/Prefab';

describe('TraversalValidator', () => {
  it('should return true for a traversable room', () => {
    const prefabs = [new Prefab('test', () => {}, { width: 1, height: 1 }, [])];
    const room = new Room(5, 5, prefabs);

    // Create a connected layout
    room.grid.setTile(0, 0, prefabs[0]);
    room.grid.setTile(0, 1, prefabs[0]);
    room.grid.setTile(1, 1, prefabs[0]);

    const validator = new TraversalValidator(room);
    expect(validator.isTraversable()).toBe(true);
  });

  it('should return false for a non-traversable room', () => {
    const prefabs = [new Prefab('test', () => {}, { width: 1, height: 1 }, [])];
    const room = new Room(5, 5, prefabs);

    // Create a disconnected layout
    room.grid.setTile(0, 0, prefabs[0]);
    room.grid.setTile(4, 4, prefabs[0]);

    const validator = new TraversalValidator(room);
    expect(validator.isTraversable()).toBe(false);
  });

  it('should return true for an empty room', () => {
    const room = new Room(5, 5, []);
    const validator = new TraversalValidator(room);
    expect(validator.isTraversable()).toBe(true);
  });
});
