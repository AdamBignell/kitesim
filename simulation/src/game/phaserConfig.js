import * as Phaser from 'phaser';

const getPhaserConfig = (mode, scene) => {
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
    scene: [scene], // Use the dynamically imported scene
    backgroundColor: '#000000',
  };
};

export default getPhaserConfig;
