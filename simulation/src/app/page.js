import GameLoader from '../components/GameLoader';

export default function Home() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111' }}>
      <div>
        <GameLoader />
      </div>
    </main>
  );
}
