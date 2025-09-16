import LevelGenerator from '../src/game/LevelGenerator_Matter';
import PlayerCapabilitiesProfile from '../src/game/generation/PlayerCapabilitiesProfile';

jest.mock('../src/game/generation/PlayerCapabilitiesProfile');

describe('LevelGenerator_Matter', () => {
  let scene;
  let pcp;

  beforeEach(() => {
    // Mock the Phaser scene object with properties needed by the Matter generator
    scene = {
      scale: { height: 720 },
      matter: {
        add: {
          fromVertices: jest.fn().mockReturnValue({}),
        }
      },
      add: {
        graphics: jest.fn().mockReturnValue({
          fillStyle: jest.fn().mockReturnThis(),
          fillPoints: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
        }),
        container: jest.fn().mockReturnValue({
          add: jest.fn(),
          destroy: jest.fn(),
          setData: jest.fn(),
        }),
      },
    };
    pcp = new PlayerCapabilitiesProfile();
  });

  it('should be instantiable', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    expect(levelGenerator).toBeInstanceOf(LevelGenerator);
  });

  it('should have a generateChunk method that returns a platforms object', () => {
    const levelGenerator = new LevelGenerator(scene, pcp);
    const { platforms } = levelGenerator.generateChunk(0, 0, 32, 16);
    expect(platforms).toBeDefined();
    expect(platforms.destroy).toBeInstanceOf(Function);
  });
});
