import PhysicsAdapter from './PhysicsAdapter';

/**
 * @class ArcadeAdapter
 * @extends PhysicsAdapter
 * @description An adapter for the Arcade Physics engine in Phaser.
 */
export default class ArcadeAdapter extends PhysicsAdapter {
    constructor(scene) {
        super(scene);
        this.scene = scene;
    }

    /**
     * @inheritdoc
     */
    getConstants() {
        return {
            WALK_SPEED: 200,
            SPRINT_SPEED: 550,
            BASE_JUMP_FORCE: -650,
            SPRINT_JUMP_FORCE: -750,
            WALL_SLIDE_SPEED: 100,
            WALL_JUMP_FORCE_Y: -700,
            WALL_JUMP_FORCE_X: 450,
            WALL_JUMP_LOCKOUT: 150,
        };
    }

    /**
     * @inheritdoc
     */
    createPlayer(x, y) {
        const player = this.scene.physics.add.sprite(x, y, 'idle');
        player.setBounce(0.2);
        player.setCollideWorldBounds(false);
        return player;
    }

    /**
     * @inheritdoc
     */
    setPlayerVelocity(player, x, y) {
        player.setVelocity(x, y);
    }

    /**
     * @inheritdoc
     */
    setPlayerVelocityX(player, x) {
        player.setVelocityX(x);
    }

    /**
     * @inheritdoc
     */
    setPlayerVelocityY(player, y) {
        player.setVelocityY(y);
    }

    /**
     * @inheritdoc
     */
    getPlayerVelocity(player) {
        return player.body.velocity;
    }

    /**
     * @inheritdoc
     */
    checkCollisions(player) {
        const onGround = player.body.touching.down || player.body.blocked.down;
        const onWallLeft = player.body.touching.left && !onGround;
        const onWallRight = player.body.touching.right && !onGround;

        return { onGround, onWallLeft, onWallRight };
    }

    /**
     * @inheritdoc
     */
    createStaticGroup() {
        return this.scene.physics.add.staticGroup();
    }

    /**
     * @inheritdoc
     */
    addCollider(player, platforms, callback = null, processCallback = null) {
        return this.scene.physics.add.collider(player, platforms, callback, processCallback, this.scene);
    }

    /**
     * @inheritdoc
     */
    createPlatformBodies(meshes, chunkX, chunkY, tileSize) {
        const solidPlatforms = this.createStaticGroup();
        const oneWayPlatforms = this.createStaticGroup();

        for (const mesh of meshes) {
            const tileWorldX = (chunkX * 64) + mesh.x;
            const tileWorldY = (chunkY * 64) + mesh.y;
            const platformX = tileWorldX * tileSize;
            const platformY = tileWorldY * tileSize;

            let texture = 'platform_solid';
            if (mesh.tile === 2) {
                texture = 'platform_one_way';
            } else if (mesh.tile === 3) {
                texture = 'platform_prefab';
            }

            const newPlatform = this.scene.add.tileSprite(platformX, platformY, mesh.width * tileSize, mesh.height * tileSize, texture);
            newPlatform.setOrigin(0, 0);

            if (mesh.tile === 2) {
                this.scene.physics.add.existing(newPlatform, true);
                oneWayPlatforms.add(newPlatform);
                newPlatform.body.checkCollision.down = false;
                newPlatform.body.checkCollision.left = false;
                newPlatform.body.checkCollision.right = false;
            } else {
                this.scene.physics.add.existing(newPlatform, true);
                solidPlatforms.add(newPlatform);
            }
        }

        return { platforms: solidPlatforms, oneWayPlatforms };
    }

    /**
     * @inheritdoc
     */
    getGravity() {
        return this.scene.physics.config.gravity;
    }
}