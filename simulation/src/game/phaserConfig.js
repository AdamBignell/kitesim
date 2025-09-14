import * as Phaser from 'phaser';
import GameScene from './GameScene';

const phaserConfig = {
  type: Phaser.AUTO, // Automatically choose between WebGL or Canvas
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT, // Scale the game to fit the container while maintaining aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH // Center the game canvas horizontally and vertically
  },
  // The 'parent' property will be set dynamically in our React component.
  // We'll leave it out here.
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 }, // A good starting gravity for a platformer
      debug: false
    }
  },
  scene: [
    GameScene // Add our scene to the game
  ],
  backgroundColor: '#000000',
};

export default phaserConfig;
