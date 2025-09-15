/**
 * @class PlayerCapabilitiesProfile
 * @description Holds all player physics parameters to decouple the generator from the game's specific player implementation.
 */
export default class PlayerCapabilitiesProfile {
  /**
   * @param {object} params - The physics parameters.
   * @param {number} params.runSpeed - The player's horizontal running speed.
   * @param {number} params.gravity - The gravity affecting the player.
   * @param {number} params.jumpVelocity - The player's initial vertical velocity on a standard jump.
   * @param {number} params.sprintJumpVelocity - The player's initial vertical velocity on a sprinting jump.
   * @param {number} params.wallSlideSpeed - The player's vertical speed when sliding down a wall.
   * @param {Phaser.Math.Vector2} params.wallJumpVelocity - The x/y velocity of a wall jump.
   */
  constructor({
    runSpeed,
    gravity,
    jumpVelocity,
    sprintJumpVelocity,
    wallSlideSpeed,
    wallJumpVelocity,
  }) {
    this.runSpeed = runSpeed;
    this.gravity = gravity;
    this.jumpVelocity = jumpVelocity;
    this.sprintJumpVelocity = sprintJumpVelocity;
    this.wallSlideSpeed = wallSlideSpeed;
    this.wallJumpVelocity = wallJumpVelocity;
  }
}
