/**
 * Calculates player movement capabilities based on their physics profile.
 * This is essential for creating solvable platforming challenges.
 */
export default class RhythmNodeCalculator {
  /**
   * @param {import('./PlayerCapabilitiesProfile').default} pcp - The player's physics profile.
   */
  constructor(pcp) {
    this.pcp = pcp;
  }

  /**
   * Calculates the maximum jump arc of the player.
   * This is a standard jump from flat ground.
   * @returns {{horizontalDistance: number, maxHeight: number, airTime: number}}
   */
  calculateMaxJump() {
    const p = this.pcp;
    // Note: jumpVelocity is negative (upwards), gravity is positive (downwards).
    const timeToApex = -p.jumpVelocity / p.gravity;
    const maxHeight = (-p.jumpVelocity * -p.jumpVelocity) / (2 * p.gravity);
    const airTime = timeToApex * 2;
    const horizontalDistance = p.runSpeed * airTime;

    return {
      horizontalDistance,
      maxHeight,
      airTime,
    };
  }

  /**
   * Calculates a "comfortable" jump, which is shorter than the max jump.
   * This is better for generating rhythmic platforming sections that don't
   * require pixel-perfect precision from the player.
   * @param {number} percentage - The percentage of the max jump to use (e.g., 0.8 for 80%).
   * @returns {{horizontalDistance: number, maxHeight: number, airTime: number}}
   */
  calculateComfortableJump(percentage = 0.8) {
    const maxJump = this.calculateMaxJump();
    return {
      horizontalDistance: maxJump.horizontalDistance * percentage,
      maxHeight: maxJump.maxHeight * percentage, // Note: height doesn't scale linearly, but this is a good approximation.
      airTime: maxJump.airTime * percentage,
    };
  }
}
