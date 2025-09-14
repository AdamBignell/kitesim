'use client'; // This directive is crucial for Next.js App Router

import { useEffect, useRef, useState } from 'react';
import phaserConfig from '../game/phaserConfig';

// We import Phaser dynamically to ensure it's only loaded on the client side.
// This is critical for Next.js which does server-side rendering.
const initializePhaser = () => import('phaser').then(Phaser => {
  return new Promise(resolve => {
    // The main game instance
    const game = new Phaser.Game({
      ...phaserConfig,
      parent: 'phaser-container', // Link to the div ID in our component
    });
    resolve(game);
  });
});

const PhaserGame = () => {
  const gameRef = useRef(null);
  const [isPlayerControlled, setIsPlayerControlled] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined' && !gameRef.current) {
      // Initialize the game only once
      initializePhaser().then(game => {
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
  }, []); // The empty dependency array ensures this runs only once on mount

  const handleToggleControl = () => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('default'); // 'default' is the key for the first scene
      if (scene && scene.togglePlayerControl) {
        const newControlState = scene.togglePlayerControl();
        setIsPlayerControlled(newControlState);
      }
    }
  };


  // This div is where the Phaser canvas will be injected.
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1280px', margin: 'auto' }}>
      <div style={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%' }}>
        <div id="phaser-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
      <button
        onClick={handleToggleControl}
        className="possess-button"
      >
        {isPlayerControlled ? 'Release Control' : 'Possess'}
      </button>
    </div>
  );
};

export default PhaserGame;
