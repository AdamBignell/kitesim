'use client'; // This directive marks the component as a Client Component

import dynamic from 'next/dynamic';

// Move the dynamic import logic here
const PhaserGame = dynamic(
  () => import('./PhaserGame'), // Correct the path to be relative
  { ssr: false }
);

export default function GameLoader() {
  // This component's only job is to render the PhaserGame component client-side.
  return <PhaserGame />;
}
