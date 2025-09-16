import Physics from '../src/game/generation/Physics';
import PlayerCapabilities from '../src/game/generation/PlayerCapabilitiesProfile';
import * as Phaser from 'phaser';

describe('Physics', () => {
    let pcp;
    let physics;

    beforeEach(() => {
        pcp = new PlayerCapabilities({
            runSpeed: 300,
            gravity: 500,
            jumpVelocity: 350,
            wallSlideSpeed: 100,
            wallJumpVelocity: new Phaser.Math.Vector2(200, 200),
        });
        physics = new Physics(pcp);
    });

    it('should calculate max jump height', () => {
        const maxJumpHeight = physics.calculateMaxJumpHeight();
        expect(maxJumpHeight).toBeCloseTo(122.5);
    });

    it('should calculate max jump distance', () => {
        const maxJumpDistance = physics.calculateMaxJumpDistance();
        expect(maxJumpDistance).toBeCloseTo(420);
    });

    it('should determine if a gap is traversable', () => {
        // A gap that is too high
        expect(physics.canTraverse(100, 200)).toBe(false);

        // A gap that is too far
        expect(physics.canTraverse(500, 50)).toBe(false);

        // A gap that is traversable
        expect(physics.canTraverse(100, 50)).toBe(true);
    });
});
