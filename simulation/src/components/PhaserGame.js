'use client'; // This directive is crucial for Next.js App Router

import { useEffect, useRef } from 'react';
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

  // This div is where the Phaser canvas will be injected.
  return <div id="phaser-container" style={{ width: '1280px', height: '720px' }} />;
};

export default PhaserGame;
