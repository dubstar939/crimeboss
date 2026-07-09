import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { RENDER_WIDTH, RENDER_HEIGHT } from '../game/types';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.startGame().then(() => {
      engine.start();
    });

    return () => {
      engine.stop();
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ 
          imageRendering: 'pixelated' as any,
          aspectRatio: `${RENDER_WIDTH} / ${RENDER_HEIGHT}`,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}
