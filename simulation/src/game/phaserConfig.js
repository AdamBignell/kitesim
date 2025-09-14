import * as Phaser from 'phaser';
import GameScene from './GameScene';

const phaserConfig = {
  type: Phaser.AUTO, // Automatically choose between WebGL or Canvas
  width: 800,  // Revert to a base width
  height: 600, // Revert to a base height
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
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
