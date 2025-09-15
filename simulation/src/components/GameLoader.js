'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';

// Define a loading component
const LoadingComponent = () => (
  <div style={{
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '2rem',
    fontFamily: 'monospace'
  }}>
    <style jsx>{`
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .blinking-text {
        animation: blink 1.5s linear infinite;
        background: -webkit-linear-gradient(45deg, #8a2be2, #4169e1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    `}</style>
    <p className="blinking-text">Dreaming...</p>
  </div>
);

const PhaserGame = dynamic(() => import('./PhaserGame'), {
  ssr: false,
});

export default function GameLoader() {
  const [isLoading, setIsLoading] = useState(true);

  const handleGameReady = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <LoadingComponent />}
      <div style={{ display: isLoading ? 'none' : 'block', width: '100%', height: '100%' }}>
        <PhaserGame onReady={handleGameReady} />
      </div>
    </>
  );
}
