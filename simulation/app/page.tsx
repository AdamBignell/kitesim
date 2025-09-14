"use client";

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const PhaserGame = () => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameInstance.current || !gameContainer.current) {
      return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainer.current,
      scene: {
        create: function (this: Phaser.Scene) {
          const graphics = this.add.graphics();
          // The gradient transitions from dark green at the top to ochre at the bottom.
          graphics.fillGradientStyle(0x006400, 0x006400, 0xCC7722, 0xCC7722, 1);
          graphics.fillRect(0, 0, 800, 600);
        }
      }
    };

    gameInstance.current = new Phaser.Game(config);

    return () => {
      gameInstance.current?.destroy(true);
      gameInstance.current = null;
    };
  }, []);

  return <div ref={gameContainer} style={{ width: '800px', height: '600px' }} />;
};

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center">
            <PhaserGame />
        </main>
    );
}
