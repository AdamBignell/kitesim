/**
 * @typedef {import('phaser').Math.Vector2} Vector2
 */

/**
 * A data-only class to hold all player physics parameters.
 * This decouples the generator from the game's specific player implementation.
 */
export default class PlayerCapabilitiesProfile {
  /**
   * @param {object} pcp - The player capabilities profile.
   * @param {number} pcp.runSpeed - The player's running speed.
   * @param {number} pcp.gravity - The gravity affecting the player.
   * @param {number} pcp.jumpVelocity - The player's initial jump velocity.
   * @param {number} pcp.wallSlideSpeed - The player's wall slide speed.
   * @param {Vector2} pcp.wallJumpVelocity - The player's wall jump velocity.
   */
  constructor({
    runSpeed,
    gravity,
    jumpVelocity,
    wallSlideSpeed,
    wallJumpVelocity,
  }) {
    /** @type {number} */
    this.runSpeed = runSpeed;

    /** @type {number} */
    this.gravity = gravity;

    /** @type {number} */
    this.jumpVelocity = jumpVelocity;

    /** @type {number} */
    this.wallSlideSpeed = wallSlideSpeed;

    /** @type {Vector2} */
    this.wallJumpVelocity = wallJumpVelocity;
  }
}
