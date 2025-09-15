'use client'; // This directive is crucial for Next.js App Router

import { useEffect, useRef, useState } from 'react';
import phaserConfig from '../game/phaserConfig';

// We import Phaser dynamically to ensure it's only loaded on the client side.
const initializePhaser = (onReady) => import('phaser').then(Phaser => {
  return new Promise(resolve => {
    // The main game instance
    const game = new Phaser.Game({
      ...phaserConfig,
      parent: 'phaser-container',
    });

    // Pass the onReady callback to the scene
    game.scene.start('default', { onReady });

    resolve(game);
  });
});

const PhaserGame = ({ onReady }) => {
  const gameRef = useRef(null);
  const [isPlayerControlled, setIsPlayerControlled] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined' && !gameRef.current) {
      // Initialize the game only once
      initializePhaser(onReady).then(game => {
        gameRef.current = game;
      });
    }

    // Cleanup function to destroy the game instance when the component unmounts
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onReady]);

  const handleToggleControl = (e) => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('default'); // 'default' is the key for the first scene
      if (scene && scene.togglePlayerControl) {
        const newControlState = scene.togglePlayerControl(true); // Pass true for UI call
        setIsPlayerControlled(newControlState);
      }
    }
    // Tell the button to lose focus
    e.target.blur();
  };


  // This div is where the Phaser canvas will be injected.
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="phaser-container" style={{ width: '100%', height: '100%' }} />
      <button
        onClick={handleToggleControl}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px',
          fontSize: '14px',
          cursor: 'pointer',
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: '1px solid white',
          borderRadius: '5px'
        }}
      >
        <span role="img" aria-label="spiral">🌀</span> {isPlayerControlled ? 'Release' : 'Possess'}
      </button>
    </div>
  );
};

export default PhaserGame;
