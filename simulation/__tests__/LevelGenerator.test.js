import LevelGenerator from '../src/game/LevelGenerator';
import PlayerCapabilitiesProfile from '../src/game/generation/PlayerCapabilitiesProfile';
import Grid from '../src/game/generation/Grid';

jest.mock('../src/game/generation/PlayerCapabilitiesProfile');

const gridToString = (grid) => {
  let gridString = '';
  for (let y = 0; y < grid.height; y++) {
    let row = '';
    for (let x = 0; x < grid.width; x++) {
      row += grid.getTile(x, y) === 1 ? '#' : '.';
    }
    gridString += row + '\n';
  }
  return gridString;
};

describe('LevelGenerator', () => {
  let scene;
  let pcp;

  beforeEach(() => {
    // Mock the Phaser scene object
    scene = {
      physics: {
        add: {
          staticGroup: jest.fn().mockReturnValue({
            add: jest.fn(),
          }),
          existing: jest.fn(),
          sprite: jest.fn().mockReturnValue({
            setOrigin: jest.fn(),
            body: {
              setAllowGravity: jest.fn(),
              setVelocity: jest.fn(),
            },
            play: jest.fn(),
          }),
        },
      },
      add: {
        tileSprite: jest.fn().mockReturnValue({
          setOrigin: jest.fn(),
        }),
      },
    };

    // Mock PlayerCapabilitiesProfile
    pcp = new PlayerCapabilitiesProfile();

    // Clear mocks before each test
    PlayerCapabilitiesProfile.mockClear();
  });

  it('should be instantiable', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    expect(levelGenerator).toBeInstanceOf(LevelGenerator);
  });

  it('should generate a chunk with platforms', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    const { platforms } = levelGenerator.generateChunk(0, 0, 32, 16);
    expect(platforms).toBeDefined();
    // The mock for staticGroup returns an object with an 'add' function.
    // We can check if the group that generateChunk returns is that object.
    expect(platforms).toEqual(scene.physics.add.staticGroup());
  });

  it('should generate an initial chunk with a spawn point', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    const { platforms, spawnPoint } = levelGenerator.generateInitialChunkAndSpawnPoint(32, 16);
    expect(platforms).toBeDefined();
    expect(spawnPoint).toBeDefined();
    expect(spawnPoint.x).toEqual(expect.any(Number));
    expect(spawnPoint.y).toEqual(expect.any(Number));
  });

  describe('Terrain Reasonableness', () => {
    let seededRandom;

    beforeEach(() => {
      // Simple seeded pseudo-random number generator for deterministic tests
      let seed = 0.5;
      seededRandom = jest.spyOn(Math, 'random').mockImplementation(() => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      });
    });

    afterEach(() => {
      seededRandom.mockRestore();
    });

    it('should generate a chunk that matches the snapshot', () => {
      const levelGenerator = new LevelGenerator(scene, pcp);
      const { grid } = levelGenerator.generateChunk(0, 0, 32, 16);
      const gridString = gridToString(grid);
      expect(gridString).toMatchSnapshot();
    });
  });

  describe('World Generation Variety', () => {
    it('should generate different chunks on different calls', () => {
      const levelGenerator = new LevelGenerator(scene, pcp);
      const { grid: grid1 } = levelGenerator.generateChunk(0, 0, 32, 16);
      const { grid: grid2 } = levelGenerator.generateChunk(0, 0, 32, 16);

      const gridString1 = gridToString(grid1);
      const gridString2 = gridToString(grid2);

      expect(gridString1).not.toEqual(gridString2);
    });
  });
});
