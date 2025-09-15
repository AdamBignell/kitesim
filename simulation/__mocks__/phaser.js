export const Scene = jest.fn().mockImplementation(() => ({
  sys: {
    game: {
      config: {},
      scene: {
        scenes: [{
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
              collider: jest.fn(),
            },
            config: {
                gravity: {
                    y: 300
                }
            }
          },
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
}));

export const Input = {
    Keyboard: {
        KeyCodes: {
            SHIFT: 'SHIFT'
        }
    }
}

export const Math = {
    Vector2: jest.fn()
}

// Add any other specific Phaser mocks your scene uses
export default {
  Scene,
  Math,
  Input
};
