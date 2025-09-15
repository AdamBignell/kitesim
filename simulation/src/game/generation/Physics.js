import PlayerCapabilitiesProfile from './PlayerCapabilitiesProfile';
import * as Phaser from 'phaser';

/**
 * A collection of static, pure functions for all physics calculations.
 * These functions are the logical core of the generation system.
 */
export default class Physics {
  /**
   * @param {PlayerCapabilitiesProfile} pcp - The player's capabilities profile.
   */
  constructor(pcp) {
    this.pcp = pcp;
  }

  /**
   * Calculates the maximum height a player can reach with a single jump.
   * @returns {number} The maximum jump height in pixels.
   */
  calculateMaxJumpHeight() {
    // Using the formula: h = v^2 / (2 * g)
    return (this.pcp.jumpVelocity * this.pcp.jumpVelocity) / (2 * Math.abs(this.pcp.gravity));
  }

  /**
   * Calculates the horizontal distance a player can travel with a single jump.
   * @returns {number} The maximum jump distance in pixels.
   */
  calculateMaxJumpDistance() {
    const timeInAir = (2 * this.pcp.jumpVelocity) / Math.abs(this.pcp.gravity);
    return this.pcp.runSpeed * timeInAir;
  }

  /**
   * Checks if a gap is traversable by jumping.
   * @param {number} distance - The horizontal distance of the gap.
   * @param {number} height - The vertical distance of the gap.
   * @returns {boolean} True if the gap is traversable.
   */
  canTraverse(distance, height) {
    const maxJumpHeight = this.calculateMaxJumpHeight();
    if (height > maxJumpHeight) {
      return false;
    }

    // This is a simplified check. A more accurate check would involve trajectory calculation.
    const timeToReachHeight = Math.sqrt((2 * height) / Math.abs(this.pcp.gravity));
    const timeInAir = (2 * (this.pcp.jumpVelocity - Math.sqrt(this.pcp.jumpVelocity*this.pcp.jumpVelocity - 2 * Math.abs(this.pcp.gravity) * height)))/Math.abs(this.pcp.gravity);
    const maxDistanceAtHeight = this.pcp.runSpeed * timeInAir;

    return distance <= maxDistanceAtHeight;
  }

  /**
   * (Placeholder) Returns an array of points representing a player's jump arc.
   * The generator will use this to ensure the path is clear of obstructions.
   * @param {import('phaser').Math.Vector2} startPoint - The starting point of the jump.
   * @param {boolean} isRunning - Whether the player is running while jumping.
   * @returns {import('phaser').Math.Vector2[]} - An array of points representing the trajectory.
   */
  getJumpTrajectory(startPoint, isRunning) {
    const trajectory = [];
    const initialVelocityX = isRunning ? this.pcp.runSpeed : 0;
    let y = startPoint.y;
    let x = startPoint.x;
    let vy = -this.pcp.jumpVelocity;
    const g = this.pcp.gravity / 60; // Assuming 60 FPS

    for (let t = 0; t < 120; t++) { // Simulate for 2 seconds
      x += initialVelocityX / 60;
      y += vy / 60;
      vy += g;
      trajectory.push(new Phaser.Math.Vector2(x, y));
    }

    return trajectory;
  }
}
