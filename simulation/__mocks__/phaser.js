const mockLayer = {
  setCollision: jest.fn(),
  destroy: jest.fn(),
};

const mockMap = {
  addTilesetImage: jest.fn(),
  createLayer: jest.fn(() => mockLayer),
  setCollision: jest.fn(),
};

const mockSceneSystems = {
  add: {
    graphics: jest.fn(() => ({
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      generateTexture: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    })),
    rectangle: jest.fn(),
  },
  make: {
    tilemap: jest.fn(() => mockMap),
  },
  physics: {
    add: {
      staticGroup: jest.fn(() => ({
        add: jest.fn(),
        clear: jest.fn(),
        create: jest.fn(() => ({
          setSize: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          refreshBody: jest.fn().mockReturnThis(),
        })),
        refresh: jest.fn(),
      })),
      sprite: jest.fn(() => ({
        setCircle: jest.fn(),
        setBounce: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        setPosition: jest.fn(),
        setVelocity: jest.fn(),
        body: {
            getBounds: jest.fn(() => ({ bottom: 0})),
            touching: {},
        }
      })),
      collider: jest.fn(),
    },
    world: {
      setBounds: jest.fn(),
      gravity: { y: 1500 },
    },
  },
  cameras: {
    main: {
      setBackgroundColor: jest.fn(),
    },
  },
  scale: {
    on: jest.fn(),
    width: 1280,
    height: 720,
    gameSize: { width: 1280, height: 720 },
  },
  input: {
    keyboard: {
      createCursorKeys: jest.fn(() => ({})),
      addKey: jest.fn(),
      addKeys: jest.fn(),
      on: jest.fn(),
    },
  },
  time: {
    addEvent: jest.fn(),
    delayedCall: jest.fn(),
  },
  anims: {
    create: jest.fn(),
    generateFrameNumbers: jest.fn(),
  }
};

const Scene = jest.fn().mockImplementation(function() {
  Object.assign(this, mockSceneSystems);
});

module.exports = {
  Scene: Scene,
  Scale: {
    RESIZE: 'RESIZE',
    CENTER_BOTH: 'CENTER_BOTH',
    FIT: 'FIT',
  },
  AUTO: 'AUTO',
  Input: {
    Keyboard: {
      KeyCodes: {
        SHIFT: 'SHIFT',
      },
      JustDown: jest.fn(),
    },
  },
  Math: {
    Between: jest.fn((min) => min),
    Clamp: jest.fn((value, min, max) => Math.max(min, Math.min(value, max))),
    Vector2: jest.fn().mockImplementation(function (x, y) {
        this.x = x || 0;
        this.y = y || 0;
        this.clone = () => new module.exports.Math.Vector2(this.x, this.y);
        this.scale = jest.fn().mockReturnThis();
    }),
    Distance: {
        BetweenPoints: jest.fn(() => 100),
    }
  },
  Geom: {
    Line: jest.fn().mockImplementation(function() {
        return {
            getPoints: jest.fn(() => [])
        }
    })
  }
};
