// ============================================================
// Little Italy: Turf Wars — React Game Component
// Menus, HUD overlay, canvas wrapper
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameScreen } from '../game/types';
import { GameEngine } from '../game/engine';
import { LEVELS } from '../game/data';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [screen, setScreen] = useState<GameScreen>(GameScreen.MAIN_MENU);
  const [levelIdx, setLevelIdx] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [highScore, setHighScore] = useState(0);

  // Sync engine screen state with React
  const syncScreen = useCallback(() => {
    if (engineRef.current) {
      setScreen(engineRef.current.screen);
      setLevelIdx(engineRef.current.currentLevelIdx);
      setCompletedLevels([...engineRef.current.completedLevels]);
      setHighScore(engineRef.current.highScore);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Poll for screen changes
    const interval = setInterval(syncScreen, 200);

    // Start the engine loop
    engine.start();

    return () => {
      clearInterval(interval);
      engine.stop();
    };
  }, [syncScreen]);

  const handleNewGame = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.startGame();
    engine.loadLevel(0);
    engine.screen = GameScreen.PLAYING;
    canvasRef.current?.requestPointerLock();
    syncScreen();
  };

  const handleContinue = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.continueGame();
    const nextLevel = engine.completedLevels.length;
    const lvl = nextLevel < LEVELS.length ? nextLevel : LEVELS.length - 1;
    engine.loadLevel(lvl);
    engine.screen = GameScreen.PLAYING;
    canvasRef.current?.requestPointerLock();
    syncScreen();
  };

  const handleStartLevel = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.loadLevel(levelIdx);
    engine.screen = GameScreen.PLAYING;
    canvasRef.current?.requestPointerLock();
    syncScreen();
  };

  const handleNextLevel = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.nextLevel();
    syncScreen();
  };

  const handleMainMenu = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.screen = GameScreen.MAIN_MENU;
    engine.audio.stopMusic();
    syncScreen();
  };

  const handleResume = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.screen = GameScreen.PLAYING;
    canvasRef.current?.requestPointerLock();
    syncScreen();
  };

  const updateSetting = (key: string, value: number | string) => {
    const engine = engineRef.current;
    if (!engine) return;
    (engine.settings as unknown as Record<string, unknown>)[key] = value;
    if (key === 'masterVolume') engine.audio.setMasterVolume(value as number);
    if (key === 'sfxVolume') engine.audio.setSfxVolume(value as number);
    if (key === 'musicVolume') engine.audio.setMusicVolume(value as number);
    if (key === 'mouseSensitivity') engine.settings.mouseSensitivity = value as number;
    engine.saveGame();
    syncScreen();
  };

  const level = LEVELS[levelIdx] || LEVELS[0];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none" style={{ cursor: screen === GameScreen.PLAYING ? 'none' : 'default' }}>
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* ---- MAIN MENU ---- */}
      {screen === GameScreen.MAIN_MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
          <div className="relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-red-700 mb-2 tracking-wider"
                style={{ textShadow: '0 0 20px rgba(200,0,0,0.5), 2px 2px 0 #000' }}>
              LITTLE ITALY
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-600 mb-8 tracking-widest"
                style={{ textShadow: '0 0 10px rgba(200,150,0,0.5), 1px 1px 0 #000' }}>
              TURF WARS
            </h2>

            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={handleNewGame}
                className="px-8 py-3 bg-red-900 hover:bg-red-700 text-white font-bold text-lg rounded border-2 border-red-600 transition-all hover:scale-105"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                🎯 NEW GAME
              </button>

              {completedLevels.length > 0 && (
                <button
                  onClick={handleContinue}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded border-2 border-gray-600 transition-all hover:scale-105"
                  style={{ textShadow: '1px 1px 0 #000' }}
                >
                  ▶ CONTINUE
                </button>
              )}

              <button
                onClick={() => {
                  const engine = engineRef.current;
                  if (engine) { engine.screen = GameScreen.OPTIONS; syncScreen(); }
                }}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded border-2 border-gray-600 transition-all hover:scale-105"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                ⚙ OPTIONS
              </button>
            </div>

            <div className="mt-8 text-gray-500 text-sm font-mono">
              <p>WASD to move • Mouse to look • Click to shoot</p>
              <p>R to reload • 1-5 switch weapons • M map • F3 debug • ESC pause</p>
            </div>

            {highScore > 0 && (
              <div className="mt-4 text-yellow-600 font-mono text-sm">
                High Score: {highScore}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- OPTIONS ---- */}
      {screen === GameScreen.OPTIONS && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative z-10 bg-gray-900 border-2 border-gray-700 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6 text-center font-mono">OPTIONS</h2>

            <div className="space-y-4">
              <div>
                <label className="text-gray-300 font-mono text-sm block mb-1">Mouse Sensitivity</label>
                <input
                  type="range" min="0.1" max="3" step="0.1"
                  defaultValue={engineRef.current?.settings.mouseSensitivity ?? 1}
                  onChange={(e) => updateSetting('mouseSensitivity', parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
              <div>
                <label className="text-gray-300 font-mono text-sm block mb-1">Master Volume</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  defaultValue={engineRef.current?.settings.masterVolume ?? 0.7}
                  onChange={(e) => updateSetting('masterVolume', parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
              <div>
                <label className="text-gray-300 font-mono text-sm block mb-1">SFX Volume</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  defaultValue={engineRef.current?.settings.sfxVolume ?? 0.8}
                  onChange={(e) => updateSetting('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
              <div>
                <label className="text-gray-300 font-mono text-sm block mb-1">Music Volume</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  defaultValue={engineRef.current?.settings.musicVolume ?? 0.4}
                  onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
            </div>

            <button
              onClick={handleMainMenu}
              className="mt-6 w-full px-6 py-3 bg-red-900 hover:bg-red-700 text-white font-bold rounded border-2 border-red-600 transition-all"
            >
              BACK
            </button>
          </div>
        </div>
      )}

      {/* ---- BRIEFING ---- */}
      {screen === GameScreen.BRIEFING && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95" />
          <div className="relative z-10 max-w-lg w-full p-6">
            <div className="bg-gray-900 border-2 border-red-900 rounded-lg p-6">
              <div className="text-red-500 font-mono text-xs mb-2 tracking-widest">
                MISSION BRIEFING — TERRITORY #{levelIdx + 1}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 font-mono" style={{ textShadow: '1px 1px 0 #000' }}>
                {level.name}
              </h2>
              <p className="text-gray-400 text-sm mb-4 italic">{level.description}</p>
              <div className="bg-black/50 border border-gray-700 rounded p-4 mb-4">
                <p className="text-gray-300 font-mono text-sm leading-relaxed">{level.briefing}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleStartLevel}
                  className="flex-1 px-6 py-3 bg-red-900 hover:bg-red-700 text-white font-bold rounded border-2 border-red-600 transition-all hover:scale-105"
                >
                  ⚔ START MISSION
                </button>
                <button
                  onClick={handleMainMenu}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded border-2 border-gray-600 transition-all"
                >
                  BACK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- PAUSE ---- */}
      {screen === GameScreen.PAUSED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 text-center">
            <h2 className="text-4xl font-bold text-white mb-8 font-mono" style={{ textShadow: '2px 2px 0 #000' }}>
              PAUSED
            </h2>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={handleResume}
                className="px-8 py-3 bg-red-900 hover:bg-red-700 text-white font-bold text-lg rounded border-2 border-red-600 transition-all hover:scale-105"
              >
                ▶ RESUME
              </button>
              <button
                onClick={() => {
                  const engine = engineRef.current;
                  if (engine) { engine.screen = GameScreen.OPTIONS; syncScreen(); }
                }}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded border-2 border-gray-600 transition-all hover:scale-105"
              >
                ⚙ OPTIONS
              </button>
              <button
                onClick={handleMainMenu}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded border-2 border-gray-600 transition-all hover:scale-105"
              >
                🏠 MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- LEVEL COMPLETE ---- */}
      {screen === GameScreen.LEVEL_COMPLETE && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/40 via-black/80 to-black/95" />
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-green-400 mb-4 font-mono"
                style={{ textShadow: '0 0 20px rgba(0,200,0,0.5), 2px 2px 0 #000' }}>
              TERRITORY SECURED!
            </h2>
            <p className="text-xl text-white mb-2 font-mono">{level.name} — Cleared</p>
            <p className="text-yellow-500 font-mono mb-6">
              Score: {engineRef.current?.player?.state.score ?? 0}
            </p>

            {levelIdx + 1 < LEVELS.length ? (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleNextLevel}
                  className="px-8 py-3 bg-green-800 hover:bg-green-700 text-white font-bold text-lg rounded border-2 border-green-600 transition-all hover:scale-105"
                >
                  NEXT TERRITORY →
                </button>
                <button
                  onClick={handleMainMenu}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded border-2 border-gray-600 transition-all"
                >
                  MAIN MENU
                </button>
              </div>
            ) : (
              <button
                onClick={handleMainMenu}
                className="px-8 py-3 bg-red-900 hover:bg-red-700 text-white font-bold text-lg rounded border-2 border-red-600 transition-all"
              >
                MAIN MENU
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---- GAME OVER ---- */}
      {screen === GameScreen.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/50 via-black/90 to-black/95" />
          <div className="relative z-10 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-red-600 mb-4 font-mono"
                style={{ textShadow: '0 0 30px rgba(200,0,0,0.7), 3px 3px 0 #000' }}>
              YOU'RE WHACKED
            </h2>
            <p className="text-xl text-gray-400 mb-2 font-mono">The streets of Little Italy claim another soul...</p>
            <p className="text-yellow-500 font-mono mb-8">
              Final Score: {engineRef.current?.player?.state.score ?? 0}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleNewGame}
                className="px-8 py-3 bg-red-900 hover:bg-red-700 text-white font-bold text-lg rounded border-2 border-red-600 transition-all hover:scale-105"
              >
                🔄 TRY AGAIN
              </button>
              <button
                onClick={handleMainMenu}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded border-2 border-gray-600 transition-all"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- VICTORY ---- */}
      {screen === GameScreen.VICTORY && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/30 via-black/80 to-black/95" />
          <div className="relative z-10 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-yellow-500 mb-4 font-mono"
                style={{ textShadow: '0 0 30px rgba(255,200,0,0.5), 3px 3px 0 #000' }}>
              ALL TERRITORIES SECURED!
            </h2>
            <p className="text-xl text-white mb-2 font-mono">Little Italy is yours, Boss.</p>
            <p className="text-yellow-400 font-mono mb-2">
              Final Score: {engineRef.current?.player?.state.score ?? 0}
            </p>
            <p className="text-gray-500 font-mono mb-8 text-sm">
              The Don has fallen. The families bow to you.
            </p>
            <button
              onClick={handleMainMenu}
              className="px-8 py-3 bg-yellow-800 hover:bg-yellow-700 text-white font-bold text-lg rounded border-2 border-yellow-600 transition-all hover:scale-105"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      {/* Click-to-play overlay */}
      {screen === GameScreen.PLAYING && document.pointerLockElement !== canvasRef.current && (
        <div
          className="absolute inset-0 flex items-center justify-center z-40 cursor-pointer"
          onClick={() => canvasRef.current?.requestPointerLock()}
        >
          <div className="bg-black/60 px-6 py-3 rounded-lg">
            <p className="text-white font-mono text-lg">Click to play</p>
          </div>
        </div>
      )}
    </div>
  );
}
