export const Scene = jest.fn().mockImplementation(() => ({
  physics: {
    add: {
      sprite: jest.fn().mockReturnValue({
        setBounce: jest.fn(),
        setCollideWorldBounds: jest.fn(),
      }),
      staticGroup: jest.fn().mockReturnValue({
        create: jest.fn().mockReturnValue({
          setSize: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          refreshBody: jest.fn(),
        }),
      }),
      collider: jest.fn().mockReturnValue({
        destroy: jest.fn(),
      }),
    },
    world: {
      overlapRect: jest.fn().mockReturnValue([]),
    },
    config: {
        gravity: {
            y: 300
        }
    }
  },
  sys: {
    game: {
      config: {},
      scene: {
        scenes: [{
          anims: {
            create: jest.fn(),
            generateFrameNumbers: jest.fn(),
          },
          input: {
            keyboard: {
              on: jest.fn(),
              addKey: jest.fn(),
              addKeys: jest.fn(),
              createCursorKeys: jest.fn(),
            },
          },
          time: {
              addEvent: jest.fn()
          }
        }]
      }
    },
    events: {
      once: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    },
    updates: {
      add: jest.fn(),
    },
  },
  cameras: {
    main: {
      setBackgroundColor: jest.fn(),
      startFollow: jest.fn(),
    },
  },
  add: {
    graphics: jest.fn().mockReturnValue({
        x: 0,
        y: 0,
        fillStyle: jest.fn().mockReturnThis(),
        beginPath: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        closePath: jest.fn().mockReturnThis(),
        fillPath: jest.fn().mockReturnThis(),
    }),
  },
  scale: {
    height: 800,
    width: 600,
  }
}));

export const Input = {
    Keyboard: {
        KeyCodes: {
            SHIFT: 'SHIFT'
        }
    }
}

export const Math = {
    Vector2: jest.fn(),
    FloatBetween: jest.fn((min, max) => {
        return global.Math.random() * (max - min) + min;
    }),
    Clamp: jest.fn((value, min, max) => {
        return global.Math.max(min, global.Math.min(max, value));
    }),
}

export const Curves = {
    Spline: jest.fn().mockImplementation(() => ({
        getPointAt: jest.fn().mockReturnValue({ x: 0, y: 0 }),
        getPoints: jest.fn().mockReturnValue([{ x: 0, y: 0 }]), // Return a single point to avoid breaking loops
    })),
};

// Add any other specific Phaser mocks your scene uses
export default {
  Scene,
  Math,
  Input,
  Curves
};
