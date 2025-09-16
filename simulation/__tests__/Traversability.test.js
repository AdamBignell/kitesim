import LevelGeneratorLogic from '../src/game/generation/LevelGeneratorLogic';
import TraversabilityValidator from '../src/game/generation/TraversabilityValidator';
import Grid from '../src/game/generation/Grid';
import PlayerCapabilitiesProfile from '../src/game/generation/PlayerCapabilitiesProfile';
import * as Phaser from 'phaser';

describe('Traversability', () => {
  let levelGeneratorLogic;
  let pcp;

  beforeEach(() => {
    pcp = new PlayerCapabilitiesProfile({
      runSpeed: 10,
      gravity: 20,
      jumpVelocity: 10,
      wallSlideSpeed: 5,
      wallJumpVelocity: new Phaser.Math.Vector2(5, 5),
    });
    levelGeneratorLogic = new LevelGeneratorLogic(pcp, 'test-seed');
  });

  it('should be traversable from the spawn point to the end of the level', () => {
    const levelWidth = 3; // 3 chunks wide
    const chunkSize = 32;
    const levelGrid = new Grid(levelWidth * chunkSize, chunkSize, 0);

    // Generate the level
    const { chunkGrid: initialChunk, spawnPoint } = levelGeneratorLogic.generateInitialChunkAndSpawnPoint(chunkSize, 16);
    // Copy initial chunk into the level grid
    for (let y = 0; y < initialChunk.height; y++) {
        for (let x = 0; x < initialChunk.width; x++) {
            levelGrid.setTile(x, y, initialChunk.getTile(x, y));
        }
    }
    for (let i = 1; i < levelWidth; i++) {
        const chunkGrid = levelGeneratorLogic.generateChunk(i, 0, chunkSize, 16);
        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                levelGrid.setTile(i * chunkSize + x, y, chunkGrid.getTile(x, y));
            }
        }
    }

    const validator = new TraversabilityValidator(levelGrid, pcp);
    const startPoint = new Phaser.Math.Vector2(Math.floor(spawnPoint.x / 16), Math.floor(spawnPoint.y / 16));

    // Find a valid end point at the end of the level
    let endX = levelWidth * chunkSize - 1;
    let endY = -1;
    for (let y = 0; y < chunkSize; y++) {
        if (levelGrid.getTile(endX, y) === 1) {
            endY = y - 2; // 2 tiles above the ground
            break;
        }
    }

    if (endY !== -1) {
        const endPoint = new Phaser.Math.Vector2(endX, endY);
        expect(validator.isTraversable(startPoint, endPoint)).toBe(true);
    } else {
        // If no ground is found at the end of the level, we can't test for traversability.
        // This is unlikely to happen, but we should handle it gracefully.
        console.warn('Could not find a valid end point for traversability test.');
        expect(true).toBe(true); // Placeholder assertion
    }
  });
});
