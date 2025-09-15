import Room from '../src/game/generation/Room';
import Prefab from '../src/game/generation/Prefab';

describe('Room', () => {
  it('should generate a layout with prefabs', () => {
    const prefabs = [
      new Prefab('testPrefab1', () => {}, { width: 2, height: 2 }, []),
      new Prefab('testPrefab2', () => {}, { width: 3, height: 3 }, []),
    ];

    const room = new Room(10, 10, prefabs);
    room.generateLayout();

    let prefabCount = 0;
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        if (room.grid.getTile(x, y) !== null) {
          prefabCount++;
        }
      }
    }

    expect(prefabCount).toBeGreaterThan(0);
  });
});
