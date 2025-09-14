/**
 * @fileoverview This file defines the physics profile for the player character.
 * The LevelGenerator uses this configuration for all constraint-driven calculations
 * to ensure that generated levels are traversable.
 */

const playerPhysicsProfile = {
    // Maximum height in pixels a player can reach with a standard jump.
    // Used to determine vertical placement of platforms.
    // This is a design constraint, not a direct simulation value.
    maxJumpHeight: 96,

    // Maximum horizontal distance in pixels a player can cover with a standard jump.
    // Used to determine horizontal gaps between platforms.
    // This is a design constraint, not a direct simulation value.
    maxJumpDistance: 128,

    // The push-off and upward velocity applied during a wall jump.
    // Sourced from GameScene.js to match in-game mechanics.
    wallJumpVelocity: {
        x: 350,  // From WALL_JUMP_FORCE_X
        y: -550  // From WALL_JUMP_FORCE_Y
    },

    // Horizontal running speed in pixels per second.
    // Sourced from GameScene.js.
    walkSpeed: 200, // From WALK_SPEED

    // Horizontal sprinting speed in pixels per second.
    // Sourced from GameScene.js.
    sprintSpeed: 350 // From SPRINT_SPEED
};

// We use 'export default' to make this object easily importable elsewhere.
export default playerPhysicsProfile;
