import * as Phaser from 'phaser';

const getPhaserConfig = (mode) => {
  const physicsConfig = {
    default: mode,
    arcade: {
      gravity: { y: 1500 },
      debug: false
    },
    matter: {
      gravity: { y: 1 },
      debug: true
    }
  };

  return {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: physicsConfig,
    scene: [], // Scene is now added manually to allow for dependency injection
    backgroundColor: '#000000',
  };
};

export default getPhaserConfig;