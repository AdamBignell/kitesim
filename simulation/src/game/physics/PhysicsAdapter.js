/**
 * @class PhysicsAdapter
 * @description A base class that defines the interface for a physics engine adapter.
 * This allows the GameScene to interact with different physics engines (Arcade, Matter)
 * through a consistent API, abstracting away the engine-specific details.
 */
export default class PhysicsAdapter {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - The Phaser scene instance.
     */
    constructor(scene) {
        if (this.constructor === PhysicsAdapter) {
            throw new Error("Abstract class 'PhysicsAdapter' cannot be instantiated directly.");
        }
        this.scene = scene;
    }

    /**
     * Performs any physics-engine-specific setup that must occur after the
     * scene has been fully initialized by the Phaser engine.
     */
    initialize() {
        // This can be a no-op for adapters that don't need late initialization.
    }

    /**
     * Returns the physics-engine-specific constants for movement.
     * @returns {object} An object containing constants like WALK_SPEED, JUMP_FORCE, etc.
     */
    getConstants() {
        throw new Error("Method 'getConstants()' must be implemented.");
    }

    /**
     * Creates the player sprite with the appropriate physics body.
     * @param {number} x - The x-coordinate of the spawn point.
     * @param {number} y - The y-coordinate of the spawn point.
     * @returns {Phaser.GameObjects.Sprite} The created player sprite.
     */
    createPlayer(x, y) {
        throw new Error("Method 'createPlayer()' must be implemented.");
    }

    /**
     * Sets the velocity of the player's physics body.
     * @param {Phaser.GameObjects.Sprite} player - The player sprite.
     * @param {number} x - The horizontal velocity.
     * @param {number} y - The vertical velocity.
     */
    setPlayerVelocity(player, x, y) {
        throw new Error("Method 'setPlayerVelocity()' must be implemented.");
    }

    /**
     * Sets the horizontal velocity of the player's physics body.
     * @param {Phaser.GameObjects.Sprite} player - The player sprite.
     * @param {number} x - The horizontal velocity.
     */
    setPlayerVelocityX(player, x) {
        throw new Error("Method 'setPlayerVelocityX()' must be implemented.");
    }

    /**
     * Sets the vertical velocity of the player's physics body.
     * @param {Phaser.GameObjects.Sprite} player - The player sprite.
     * @param {number} y - The vertical velocity.
     */
    setPlayerVelocityY(player, y) {
        throw new Error("Method 'setPlayerVelocityY()' must be implemented.");
    }

    /**
     * Gets the player's current velocity.
     * @param {Phaser.GameObjects.Sprite} player - The player sprite.
     * @returns {{x: number, y: number}} The player's velocity.
     */
    getPlayerVelocity(player) {
        throw new Error("Method 'getPlayerVelocity()' must be implemented.");
    }

    /**
     * Checks for collisions and updates the player's state.
     * This method should populate an object with boolean flags like `onGround`, `onWallLeft`, etc.
     * @param {Phaser.GameObjects.Sprite} player - The player sprite.
     * @returns {object} An object containing collision status flags.
     */
    checkCollisions(player) {
        throw new Error("Method 'checkCollisions()' must be implemented.");
    }

    /**
     * Creates a static physics group for solid platforms.
     * @returns {Phaser.Physics.Arcade.StaticGroup | object} The physics group.
     */
    createStaticGroup() {
        throw new Error("Method 'createStaticGroup()' must be implemented.");
    }

    /**
     * Adds a collider between the player and a platform group.
     * @param {Phaser.GameObjects.Sprite} player - The player sprite.
     * @param {object} platforms - The platform group.
     * @param {Function} [callback=null] - An optional callback for the collider.
     * @param {Function} [processCallback=null] - An optional process callback for the collider.
     * @returns {object} The created collider instance.
     */
    addCollider(player, platforms, callback = null, processCallback = null) {
        throw new Error("Method 'addCollider()' must be implemented.");
    }

    /**
     * Creates the physical platform bodies from the logical mesh data.
     * @param {Array<object>} meshes - The array of mesh objects from the GreedyMesher.
     * @param {number} chunkX - The x-coordinate of the chunk.
     * @param {number} chunkY - The y-coordinate of the chunk.
     * @param {number} tileSize - The size of each tile in pixels.
     * @returns {{platforms: object, oneWayPlatforms: object}} An object containing the physics groups for platforms.
     */
    createPlatformBodies(meshes, chunkX, chunkY, tileSize) {
        throw new Error("Method 'createPlatformBodies()' must be implemented.");
    }

    /**
     * Gets the gravity value from the physics engine's configuration.
     * @returns {{x: number, y: number}} The gravity vector.
     */
    getGravity() {
        throw new Error("Method 'getGravity()' must be implemented.");
    }
}