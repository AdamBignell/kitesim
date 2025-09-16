'use client'; // This directive is crucial for Next.js App Router

import { useEffect, useRef, useState } from 'react';
import phaserConfig from '../game/phaserConfig';

// We import Phaser dynamically to ensure it's only loaded on the client side.
// This is critical for Next.js which does server-side rendering.
const initializePhaser = (physics) => import('phaser').then(Phaser => {
  return new Promise(resolve => {
    // Create a mutable copy of the config
    const newConfig = { ...phaserConfig };

    if (physics === 'matter') {
      newConfig.physics = {
        default: 'matter',
        matter: {
          gravity: { y: 1500 }, // Match arcade gravity
          debug: true, // Enable debug visuals for Matter.js
        },
      };
    } else {
      // Revert to original arcade settings if not matter
      newConfig.physics = {
        default: 'arcade',
        arcade: {
          gravity: { y: 1500 },
          debug: false,
        },
      };
    }

    // The main game instance
    const game = new Phaser.Game({
      ...newConfig,
      parent: 'phaser-container', // Link to the div ID in our component
    });
    // Use the registry to pass data to the scene
    game.registry.set('physics', physics);
    resolve(game);
  });
});

const PhaserGame = () => {
  const gameRef = useRef(null);
  const [isPlayerControlled, setIsPlayerControlled] = useState(false);
  // Start with no physics engine selected
  const [physics, setPhysics] = useState(null);

  // This effect handles game initialization and cleanup
  useEffect(() => {
    // Only initialize if a physics engine is chosen and the game isn't already running
    if (physics && typeof window !== 'undefined' && !gameRef.current) {
      initializePhaser(physics).then(game => {
        gameRef.current = game;
        // Assume AI control by default, so the button should show "Possess"
        setIsPlayerControlled(false);
      });
    }

    // Cleanup function to destroy the game instance when the component unmounts
    // or when the physics engine is changed.
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [physics]); // Rerun this effect if the 'physics' state changes

  const handleToggleControl = (e) => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('default');
      if (scene && scene.togglePlayerControl) {
        const newControlState = scene.togglePlayerControl(true);
        setIsPlayerControlled(newControlState);
      }
    }
    e.target.blur();
  };

  // If no physics engine is selected, show the selection UI
  if (!physics) {
    const buttonStyle = {
        padding: '20px',
        fontSize: '24px',
        margin: '10px',
        cursor: 'pointer',
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h1>Select Physics Engine</h1>
        <div>
            <button style={buttonStyle} onClick={() => setPhysics('arcade')}>
                Arcade (Original)
            </button>
            <button style={buttonStyle} onClick={() => setPhysics('matter')}>
                Matter.js (New)
            </button>
        </div>
      </div>
    );
  }

  // Once an engine is selected, render the game container and UI
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
      <button
        onClick={() => setPhysics(null)}
        style={{
          position: 'absolute',
          top: '60px',
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
        Change Engine
      </button>
    </div>
  );
};

export default PhaserGame;
