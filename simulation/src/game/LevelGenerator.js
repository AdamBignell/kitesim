import * as Phaser from 'phaser';
import Grid from './generation/Grid';
import PhysicsHelpers from './generation/PhysicsHelpers';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';

const TILE_SIZE = 32; // The size of each tile in pixels.

/**
 * Generates a simple, traversable room.
 *
 * @param {number} width - The width of the room in tiles.
 * @param {number} height - The height of the room in tiles.
 * @param {Phaser.Math.Vector2} startPoint - The starting point in tile coordinates.
 * @param {Phaser.Math.Vector2} endPoint - The ending point in tile coordinates.
 * @param {PlayerCapabilitiesProfile} pcp - The player's physics profile.
 * @returns {Grid} - The generated grid.
 */
function generateSimpleRoom(width, height, startPoint, endPoint, pcp) {
  const grid = new Grid(width, height, 1); // Initialize with solid tiles
  let carver = startPoint.clone();

  const MAX_ITERATIONS = 100; // Prevent infinite loops
  let iterations = 0;

  while (Phaser.Math.Distance.BetweenPoints(carver, endPoint) > 5 && iterations < MAX_ITERATIONS) {
    const candidates = generateCandidatePoints(carver, width, height, pcp);

    const carverPx = carver.clone().scale(TILE_SIZE);
    const reachableCandidates = candidates.filter(c =>
      PhysicsHelpers.canReach(
        carverPx,
        c.clone().scale(TILE_SIZE),
        pcp
      )
    );

    if (reachableCandidates.length === 0) {
      console.warn("Path generation warning: Carver got temporarily stuck. Trying a wider search.");
      // If stuck, generate more candidates in a wider area as a fallback
      const fallbackCandidates = generateCandidatePoints(carver, width, height, pcp, 2);
      const fallbackReachable = fallbackCandidates.filter(c => PhysicsHelpers.canReach(carverPx, c.clone().scale(TILE_SIZE), pcp));
      if(fallbackReachable.length === 0) {
          console.error("Path generation failed: Carver is permanently stuck.");
          break;
      }
      reachableCandidates.push(...fallbackReachable);
    }

    // Select the best candidate (closest to the end point)
    let bestCandidate = reachableCandidates.reduce((best, a) => {
        const distA = Phaser.Math.Distance.BetweenPoints(a, endPoint);
        const distB = Phaser.Math.Distance.BetweenPoints(best, endPoint);
        return distA < distB ? a : best;
    });

    // Carve path to the new point
    const trajectory = PhysicsHelpers.getJumpTrajectory(
        carverPx,
        pcp,
        true, // Assume running jumps for carving
        bestCandidate.clone().scale(TILE_SIZE)
    );

    trajectory.forEach(p => {
        const tileX = Math.floor(p.x / TILE_SIZE);
        const tileY = Math.floor(p.y / TILE_SIZE);
        grid.setTile(tileX, tileY, 0); // 0 for empty
    });


    // Place a platform at the landing spot
    const platformY = bestCandidate.y;
    for (let i = -2; i <= 2; i++) {
      const platformX = bestCandidate.x + i;
      grid.setTile(platformX, platformY, 1); // 1 for solid
    }

    carver = bestCandidate;
    iterations++;
  }

  postProcess(grid);

  return grid;
}

/**
 * Generates candidate points around the carver.
 * @param {Phaser.Math.Vector2} carver - The carver's current position in tile coordinates.
 * @param {number} width - Grid width in tiles.
 * @param {number} height - Grid height in tiles.
 * @param {PlayerCapabilitiesProfile} pcp - Player's physics.
 * @param {number} radiusMultiplier - Multiplier for the search radius.
 */
function generateCandidatePoints(carver, width, height, pcp, radiusMultiplier = 1) {
    const candidates = [];
    // Approximate max jump distance in tiles
    const JUMP_RANGE_X = Math.ceil((pcp.runSpeed * 2 * -pcp.sprintJumpVelocity / pcp.gravity) / TILE_SIZE) * radiusMultiplier;
    const JUMP_RANGE_Y = Math.ceil((pcp.sprintJumpVelocity * pcp.sprintJumpVelocity / (2 * pcp.gravity)) / TILE_SIZE) * radiusMultiplier;

    for(let i = 0; i < 40; i++) {
        const x = carver.x + Phaser.Math.Between(-JUMP_RANGE_X, JUMP_RANGE_X);
        const y = carver.y + Phaser.Math.Between(-JUMP_RANGE_Y, JUMP_RANGE_Y / 2);

        if (x > 1 && x < width - 2 && y > 1 && y < height - 2) {
            candidates.push(new Phaser.Math.Vector2(x, y));
        }
    }
    // Ensure the end point is always a candidate if it's nearby
    if (Phaser.Math.Distance.BetweenPoints(carver, endPoint) < JUMP_RANGE_X) {
        candidates.push(endPoint);
    }
    return candidates;
}


/**
 * Applies post-processing steps to the grid to make it a playable room.
 */
function postProcess(grid) {
  const tempGrid = new Grid(grid.width, grid.height, 0);
  // Copy grid to tempGrid
   for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      tempGrid.setTile(x, y, grid.getTile(x, y));
    }
  }

  // Widen the path horizontally and vertically
  for (let y = 1; y < grid.height - 1; y++) {
    for (let x = 1; x < grid.width - 1; x++) {
      if (tempGrid.getTile(x, y) === 0) {
        // If the original tile was empty, clear a 3x2 area around it
        for(let i = -1; i<= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                 grid.setTile(x + i, y + j, 0);
            }
        }
      }
    }
  }

  // Extend platforms
   for (let y = 1; y < grid.height - 1; y++) {
    for (let x = 1; x < grid.width - 1; x++) {
        // Find a single solid tile with empty space above it (a potential platform)
        if(grid.getTile(x,y) === 1 && grid.getTile(x, y-1) === 0) {
            // Extend it horizontally
            for(let i = -2; i <= 2; i++) {
                if(grid.getTile(x+i, y-1) === 0) { // Don't overwrite the ceiling
                    grid.setTile(x + i, y, 1);
                }
            }
        }
    }
   }


  // Encase in a solid border
  for (let x = 0; x < grid.width; x++) {
    grid.setTile(x, 0, 1);
    grid.setTile(x, grid.height - 1, 1);
  }
  for (let y = 0; y < grid.height; y++) {
    grid.setTile(0, y, 1);
    grid.setTile(grid.width - 1, y, 1);
  }
}

const LevelGenerator = {
  generateSimpleRoom,
  // Add documentation for one-way platforms as requested in Phase 3.
  /**
   * --- HOW TO IMPLEMENT ONE-WAY (JUMP-THROUGH) PLATFORMS IN PHASER ---
   * To use one-way platforms, you would first need to designate a specific tile index for them,
   * for example, `2`. The generator would place these tiles where appropriate.
   *
   * In your Phaser scene's `create` method, you would set up a separate collider for these platforms
   * and use a custom `processCallback` to control the collision behavior.
   *
   * @example
   *
   * // 1. Create a layer in your tilemap for one-way platforms.
   * const oneWayLayer = map.createLayer('OneWayPlatformLayer', tileset);
   * oneWayLayer.setCollision(2); // Assuming '2' is the index for one-way tiles.
   *
   * // 2. Create a collider with a process callback.
   * this.physics.add.collider(this.player, oneWayLayer, null, this.oneWayCollision, this);
   *
   * // 3. Implement the callback function in your scene.
   * oneWayCollision(player, platform) {
   *   // This function returns TRUE if collision should occur, FALSE otherwise.
   *   // We only want collision when the player is moving downwards and is above the platform.
   *   const playerBounds = player.body.getBounds();
   *   const platformBounds = platform.getBounds();
   *
   *   return (player.body.velocity.y >= 0) && (playerBounds.bottom < platformBounds.top + 5);
   * }
   */
};

export default LevelGenerator;
