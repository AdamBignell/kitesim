import * as Phaser from 'phaser';

/**
 * A collection of static, pure functions for all physics calculations.
 */
const PhysicsHelpers = {
  /**
   * Determines if endPoint is reachable from startPoint via a running jump.
   * This is a simplified implementation focusing on a single jump type.
   *
   * @param {Phaser.Math.Vector2} startPoint - The starting point in pixels.
   * @param {Phaser.Math.Vector2} endPoint - The potential destination in pixels.
   * @param {PlayerCapabilitiesProfile} pcp - The player's physics profile.
   * @returns {boolean} - True if the point is reachable, false otherwise.
   */
  canReach: (startPoint, endPoint, pcp) => {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y; // +y is down

    const vx = pcp.runSpeed;
    const vy = pcp.sprintJumpVelocity; // Use the stronger jump for max reach
    const g = pcp.gravity;

    // Time to reach the apex of the jump from the start point
    const timeToApex = -vy / g;
    // Maximum height reached relative to the start point (will be a negative value)
    const maxHeight = vy * timeToApex + 0.5 * g * timeToApex * timeToApex;

    if (dy < maxHeight) {
      // Destination is higher than the jump apex
      return false;
    }

    // We need to solve for time 't' in the trajectory equation:
    // dy = vy*t + 0.5*g*t^2
    // This is a quadratic equation: 0.5*g*t^2 + vy*t - dy = 0
    const a = 0.5 * g;
    const b = vy;
    const c = -dy;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      // No real solution for time, meaning the height is never reached
      return false;
    }

    // Quadratic formula to find the time(s) at which the player is at the target height
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const timeInAir = Math.max(t1, t2); // We need the later time

    if (timeInAir <= 0) {
        return false;
    }

    // Max horizontal distance that can be covered in that time
    const maxHorizontalDistance = vx * timeInAir;

    return Math.abs(dx) <= maxHorizontalDistance;
  },

  /**
   * Returns an array of points representing a player's jump arc.
   * @param {Phaser.Math.Vector2} startPoint - The starting point of the jump in pixels.
   * @param {PlayerCapabilitiesProfile} pcp - The player's physics profile.
   * @param {boolean} isRunning - Whether the player is running.
   * @param {Phaser.Math.Vector2} targetPoint - The intended landing point, used to determine direction.
   * @returns {Phaser.Math.Vector2[]} - An array of points representing the trajectory.
   */
  getJumpTrajectory: (startPoint, pcp, isRunning, targetPoint) => {
    const points = [];
    const direction = Math.sign(targetPoint.x - startPoint.x);
    const vx = isRunning ? pcp.runSpeed * direction : 0;
    const vy = isRunning ? pcp.sprintJumpVelocity : pcp.jumpVelocity;
    const g = pcp.gravity;
    const timeStep = 0.05; // seconds, smaller for more resolution

    // Time to reach the target y-coordinate
    const dy = targetPoint.y - startPoint.y;
    const a = 0.5 * g;
    const b = vy;
    const c = -dy;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return []; // Cannot reach this height

    const t_flight = (-b + Math.sqrt(discriminant)) / (2*a);

    if(t_flight <= 0) return [];

    for (let t = 0; t < t_flight; t += timeStep) {
      const x = startPoint.x + vx * t;
      const y = startPoint.y + vy * t + 0.5 * g * t * t;
      points.push(new Phaser.Math.Vector2(Math.round(x), Math.round(y)));
    }
    points.push(targetPoint); // Ensure the trajectory ends at the target

    return points;
  },
};

export default PhysicsHelpers;
