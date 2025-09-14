import GameLoader from '../components/GameLoader';

export default function Home() {
  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <GameLoader />
    </main>
  );
}
