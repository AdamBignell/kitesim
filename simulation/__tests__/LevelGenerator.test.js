import LevelGeneratorLogic from '../src/game/generation/LevelGeneratorLogic';
import Grid from '../src/game/generation/Grid';
import * as Structures from '../src/game/generation/structures';

describe('LevelGeneratorLogic', () => {
  let levelGeneratorLogic;

  beforeEach(() => {
    levelGeneratorLogic = new LevelGeneratorLogic(null, 'test-seed');
  });

  it('should be an instance of LevelGeneratorLogic', () => {
    expect(levelGeneratorLogic).toBeInstanceOf(LevelGeneratorLogic);
  });

  describe('canPlace', () => {
    it('should return true if the structure can be placed', () => {
      const chunkGrid = new Grid(10, 10, 0);
      const structure = { width: 2, height: 2 };
      const placedStructures = [];
      expect(levelGeneratorLogic.canPlace(chunkGrid, structure, 0, 0, placedStructures)).toBe(true);
    });

    it('should return false if the structure is out of bounds', () => {
      const chunkGrid = new Grid(10, 10, 0);
      const structure = { width: 2, height: 2 };
      const placedStructures = [];
      expect(levelGeneratorLogic.canPlace(chunkGrid, structure, 9, 9, placedStructures)).toBe(false);
    });

    it('should return false if the structure overlaps with another structure', () => {
      const chunkGrid = new Grid(10, 10, 0);
      const structure = { width: 2, height: 2 };
      const placedStructures = [{ structure: { width: 2, height: 2 }, x: 0, y: 0 }];
      expect(levelGeneratorLogic.canPlace(chunkGrid, structure, 1, 1, placedStructures)).toBe(false);
    });
  });

  describe('placeStructure', () => {
    it('should place the structure on the grid', () => {
      const chunkGrid = new Grid(10, 10, 0);
      const structure = {
        width: 2,
        height: 2,
        grid: new Grid(2, 2, 1),
      };
      const placedStructures = [];
      levelGeneratorLogic.placeStructure(chunkGrid, { structure, x: 0, y: 0 }, placedStructures);
      expect(chunkGrid.getTile(0, 0)).toBe(1);
      expect(chunkGrid.getTile(1, 0)).toBe(1);
      expect(chunkGrid.getTile(0, 1)).toBe(1);
      expect(chunkGrid.getTile(1, 1)).toBe(1);
      expect(placedStructures.length).toBe(1);
    });
  });

  describe('generateChunk', () => {
    it('should generate a chunk with a floor', () => {
      const chunkGrid = levelGeneratorLogic.generateChunk(0, 0, 32, 16);
      expect(chunkGrid).toBeDefined();
      // This is a very basic test. We'll add more detailed tests later.
    });
  });

  describe('generateInitialChunkAndSpawnPoint', () => {
    it('should generate an initial chunk and a spawn point', () => {
      const { chunkGrid, spawnPoint } = levelGeneratorLogic.generateInitialChunkAndSpawnPoint(32, 16);
      expect(chunkGrid).toBeDefined();
      expect(spawnPoint).toBeDefined();
      expect(spawnPoint.x).toBeGreaterThan(0);
      expect(spawnPoint.y).toBeGreaterThan(0);
    });
  });
});
