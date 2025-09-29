'use client'; // This directive is crucial for Next.js App Router

import { useEffect, useRef, useState } from 'react';

import getPhaserConfig from '../game/phaserConfig';
import GameScene from '../game/GameScene'; // Import the new unified GameScene

// This function now initializes the game with a physics-agnostic GameScene
// and a dynamically selected physics adapter.
const initializePhaser = async (mode) => {
  const Phaser = await import('phaser');
  let PhysicsAdapter;

  // Dynamically import the correct adapter based on the selected mode.
  if (mode === 'matter') {
    const adapterModule = await import('../game/physics/MatterAdapter.js');
    PhysicsAdapter = adapterModule.default;
  } else {
    const adapterModule = await import('../game/physics/ArcadeAdapter.js');
    PhysicsAdapter = adapterModule.default;
  }

  // The config no longer needs the scene class passed to it.
  const config = getPhaserConfig(mode);

  // Before creating a new game, ensure the container is empty. This is crucial for
  // React 18's Strict Mode, which can cause components to mount twice in development.
  const container = document.getElementById('phaser-container');
  if (container) {
    container.innerHTML = '';
  }

  // The main game instance is created without a scene initially.
  const game = new Phaser.Game({
    ...config,
    parent: 'phaser-container',
  });

  // We manually add the scene so we can pass the adapter instance to its init method.
  // This is the key to our dependency injection.
  const sceneInstance = new GameScene();
  game.scene.add('default', sceneInstance, true, {
    physicsAdapter: new PhysicsAdapter(sceneInstance)
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
      initializePhaser(physicsMode)
        .then(game => {
          gameRef.current = game;
        })
        .catch(error => {
          console.error("Error initializing Phaser game:", error);
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