import dynamic from 'next/dynamic';

// Dynamically import the PhaserGame component with SSR turned off
const PhaserGame = dynamic(
  () => import('../components/PhaserGame'),
  { ssr: false }
);

export default function Home() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111' }}>
      <div>
        <h1 style={{ textAlign: 'center', color: 'white', fontFamily: 'Arial' }}>DisasterSword</h1>
        <PhaserGame />
      </div>
    </main>
  );
}
