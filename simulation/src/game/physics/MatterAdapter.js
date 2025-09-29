import PhysicsAdapter from './PhysicsAdapter';
import * as Phaser from 'phaser';

/**
 * @class MatterAdapter
 * @extends PhysicsAdapter
 * @description An adapter for the Matter.js Physics engine in Phaser.
 */
export default class MatterAdapter extends PhysicsAdapter {
    constructor(scene) {
        super(scene);
        this.scene = scene;
        this.collisionStatus = {
            onGround: false,
            onWallLeft: false,
            onWallRight: false,
        };
    }

    /**
     * @inheritdoc
     */
    initialize() {
        this.scene.matter.world.on('collisionactive', (event) => {
            this.collisionStatus = { onGround: false, onWallLeft: false, onWallRight: false };
            for (let i = 0; i < event.pairs.length; i++) {
                const pair = event.pairs[i];
                let otherBody;
                if (pair.bodyA.label === 'player') {
                    otherBody = pair.bodyB;
                } else if (pair.bodyB.label === 'player') {
                    otherBody = pair.bodyA;
                } else {
                    continue;
                }

                if (otherBody.isStatic) {
                    const collisionNormal = pair.collision.normal;
                    if (collisionNormal.y < -0.5) { this.collisionStatus.onGround = true; }
                    if (collisionNormal.x > 0.5) { this.collisionStatus.onWallLeft = true; }
                    if (collisionNormal.x < -0.5) { this.collisionStatus.onWallRight = true; }
                }
            }
        });
    }

    /**
     * @inheritdoc
     */
    getConstants() {
        return {
            WALK_SPEED: 4,
            SPRINT_SPEED: 7,
            BASE_JUMP_FORCE: -10,
            SPRINT_JUMP_FORCE: -12,
            WALL_SLIDE_SPEED: 2,
            WALL_JUMP_FORCE_Y: -12,
            WALL_JUMP_FORCE_X: 8,
            WALL_JUMP_LOCKOUT: 150,
        };
    }

    /**
     * @inheritdoc
     */
    createPlayer(x, y) {
        const player = this.scene.matter.add.sprite(x, y, 'idle', null, {
            label: 'player'
        });
        const { width, height } = player;
        player.setRectangle(width * 0.8, height, { chamfer: { radius: 5 } });
        player.setFixedRotation();
        player.setFriction(0.01);
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
        return this.collisionStatus;
    }

    /**
     * @inheritdoc
     */
    createStaticGroup() {
        return null;
    }

    /**
     * @inheritdoc
     */
    addCollider(player, platforms, callback = null, processCallback = null) {
        return null;
    }

    /**
     * @inheritdoc
     */
    createPlatformBodies(meshes, chunkX, chunkY, tileSize) {
        const platformContainer = this.scene.add.container();

        for (const mesh of meshes) {
            const tileWorldX = (chunkX * 64) + mesh.x;
            const tileWorldY = (chunkY * 64) + mesh.y;
            const bodyWidth = mesh.width * tileSize;
            const bodyHeight = mesh.height * tileSize;

            const bodyX = tileWorldX * tileSize + bodyWidth / 2;
            const bodyY = tileWorldY * tileSize + bodyHeight / 2;

            const newBody = this.scene.matter.add.rectangle(bodyX, bodyY, bodyWidth, bodyHeight, {
                isStatic: true,
                label: 'platform'
            });

            let texture = 'platform_solid';
            if (mesh.tile === 2) {
                texture = 'platform_one_way';
            } else if (mesh.tile === 3) {
                texture = 'platform_prefab';
            }

            const newSprite = this.scene.add.tileSprite(bodyX - bodyWidth / 2, bodyY - bodyHeight / 2, bodyWidth, bodyHeight, texture);
            newSprite.setOrigin(0, 0);

            platformContainer.add(newSprite);
            if (!platformContainer.getData('matterBodies')) {
                platformContainer.setData('matterBodies', []);
            }
            platformContainer.getData('matterBodies').push(newBody);
        }

        platformContainer.destroy = function() {
            const bodies = this.getData('matterBodies');
            if (bodies) {
                this.scene.matter.world.remove(bodies);
            }
            Phaser.GameObjects.Container.prototype.destroy.call(this, true);
        };

        return { platforms: platformContainer, oneWayPlatforms: null };
    }

    /**
     * @inheritdoc
     */
    getGravity() {
        return this.scene.matter.world.gravity;
    }
}