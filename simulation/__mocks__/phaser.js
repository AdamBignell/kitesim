// This object contains all the mocked Phaser systems.
const mockSceneSystems = {
  add: {
    graphics: jest.fn(() => ({
      fillStyle: jest.fn().mockReturnThis(),
      fillCircle: jest.fn().mockReturnThis(),
      generateTexture: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    })),
    rectangle: jest.fn(),
  },
  physics: {
    add: {
      staticGroup: jest.fn(() => ({
        add: jest.fn(),
        clear: jest.fn(),
        create: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        refresh: jest.fn(),
      })),
      sprite: jest.fn(() => ({
        setCircle: jest.fn(),
        setBounce: jest.fn(),
        setCollideWorldBounds: jest.fn(),
      })),
      collider: jest.fn(),
    },
    world: {
      setBounds: jest.fn(),
    },
  },
  cameras: {
    main: {
      setBackgroundColor: jest.fn(),
    },
  },
  scale: {
    on: jest.fn(),
    width: 800,
    height: 600,
    gameSize: { width: 800, height: 600 },
  },
  input: {
    keyboard: {
      createCursorKeys: jest.fn(() => ({})),
      addKey: jest.fn(),
      addKeys: jest.fn(),
    },
  },
  time: {
    addEvent: jest.fn(),
  }
};

// This is the mock for the Phaser.Scene class itself.
const Scene = jest.fn().mockImplementation(function() {
  // When `new GameScene()` is called, `super()` invokes this.
  // `this` will be the new `GameScene` instance.
  // We copy all our mocked systems onto it.
  Object.assign(this, mockSceneSystems);
});

module.exports = {
  Scene: Scene, // Export our mocked class
  Scale: {
    RESIZE: 'RESIZE',
    CENTER_BOTH: 'CENTER_BOTH',
  },
  AUTO: 'AUTO',
  Input: {
    Keyboard: {
      KeyCodes: {
        SHIFT: 'SHIFT',
      },
    },
  },
};
