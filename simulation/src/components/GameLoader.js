'use client'; // This directive marks the component as a Client Component

import dynamic from 'next/dynamic';
import React from 'react';

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
      }
    `}</style>
    <p className="blinking-text">Dreaming...</p>
  </div>
);


const PhaserGame = dynamic(
  () => import('./PhaserGame'),
  {
    ssr: false,
    loading: () => <LoadingComponent />
  }
);

export default function GameLoader() {
  return <PhaserGame />;
}
