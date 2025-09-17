'use client'; // This directive is crucial for Next.js App Router

import { useEffect, useRef, useState } from 'react';

import getPhaserConfig from '../game/phaserConfig';

// We import Phaser dynamically to ensure it's only loaded on the client side.
const initializePhaser = async (mode) => {
  const Phaser = await import('phaser');
  let GameScene;

  if (mode === 'matter') {
    // Dynamically import the Matter.js scene
    const sceneModule = await import('../game/GameScene_Matter.js');
    GameScene = sceneModule.default;
  } else {
    // Dynamically import the Arcade scene
    const sceneModule = await import('../game/GameScene_Arcade.js');
    GameScene = sceneModule.default;
  }

  // Get the dynamic config
  const config = getPhaserConfig(mode, GameScene);

  // The main game instance
  const game = new Phaser.Game({
    ...config,
    parent: 'phaser-container', // Link to the div ID in our component
  });

  return game;
};

const PhaserGame = () => {
  const gameRef = useRef(null);
  const [isPlayerControlled, setIsPlayerControlled] = useState(false);
  const [physicsMode, setPhysicsMode] = useState('arcade');
  const [gameKey, setGameKey] = useState(0); // Used to force re-mount

  useEffect(() => {
    // On component mount, read the saved mode from localStorage
    const savedMode = localStorage.getItem('physicsMode') || 'arcade';
    setPhysicsMode(savedMode);
  }, []);

  useEffect(() => {
    // This effect now depends on gameKey, so it will re-run when the key changes
    if (typeof window !== 'undefined') {
      initializePhaser(physicsMode).then(game => {
        gameRef.current = game;
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [gameKey, physicsMode]);

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

  const handleModeChange = (mode) => {
    localStorage.setItem('physicsMode', mode);
    setPhysicsMode(mode);
    setGameKey(prevKey => prevKey + 1); // Change key to force re-mount
  };

  const buttonStyle = {
    padding: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '5px',
    margin: '5px'
  };

  // This div is where the Phaser canvas will be injected.
  return (
    <div key={gameKey} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="phaser-container" style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ color: 'white', fontFamily: 'Helvetica, Arial, sans-serif', margin: '0 0 10px 0' }}>Disaster Sword</h2>
        <button onClick={handleToggleControl} style={buttonStyle}>
          <span role="img" aria-label="spiral">🌀</span> {isPlayerControlled ? 'Release' : 'Possess'}
        </button>
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '5px' }}>
          <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '16px', textAlign: 'center' }}>Debug Menu</h3>
          <p style={{color: 'white', margin: '0 0 5px 0', fontSize: '12px'}}>Current: {physicsMode}</p>
          <button onClick={() => handleModeChange('arcade')} style={buttonStyle}>
            Arcade
          </button>
          <button onClick={() => handleModeChange('matter')} style={buttonStyle}>
            Matter
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhaserGame;
