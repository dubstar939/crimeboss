import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { GameScreen, GameSettings } from '../game/types';
import { LEVELS } from '../game/data';
import { MainMenu, PauseMenu, OptionsMenu, BriefingScreen, EndScreen, LoadingScreen } from './ui/screens';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [screen, setScreen] = useState<GameScreen>(GameScreen.MAIN_MENU);
  const [hasSave, setHasSave] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1,
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    renderDistance: 20,
    graphicsQuality: 'medium',
  });
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Check for saved game on mount
  useEffect(() => {
    const saveData = localStorage.getItem('little_italy_save');
    setHasSave(!!saveData);
    
    if (saveData) {
      try {
        const parsed = JSON.parse(saveData);
        if (parsed.settings) {
          setSettings(parsed.settings);
        }
      } catch (e) {
        console.warn('Failed to parse save data:', e);
      }
    }
  }, []);

  // Sync screen state with engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.screen = screen;
      if (screen === GameScreen.PLAYING) {
        engineRef.current.showMinimap = settings.graphicsQuality !== 'low';
      }
    }
  }, [screen, settings]);

  const initializeEngine = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current) return null;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    
    engine.settings = { ...settings };
    engine.audio.setMasterVolume(settings.masterVolume);
    engine.audio.setSfxVolume(settings.sfxVolume);
    engine.audio.setMusicVolume(settings.musicVolume);

    return engine;
  }, [settings]);

  const handleStartGame = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    const engine = await initializeEngine();
    if (!engine) return;

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await engine.startGame();
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setScreen(GameScreen.BRIEFING);
        engine.start();
      }, 300);
    } catch (error) {
      console.error('Failed to start game:', error);
      setIsLoading(false);
      setScreen(GameScreen.MAIN_MENU);
    }
  }, [initializeEngine]);

  const handleContinueGame = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    const engine = await initializeEngine();
    if (!engine) return;

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await engine.continueGame();
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setScreen(GameScreen.BRIEFING);
        engine.start();
      }, 300);
    } catch (error) {
      console.error('Failed to continue game:', error);
      setIsLoading(false);
    }
  }, [initializeEngine]);

  const handleSaveSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    
    if (engineRef.current) {
      engineRef.current.settings = { ...newSettings };
      engineRef.current.audio.setMasterVolume(newSettings.masterVolume);
      engineRef.current.audio.setSfxVolume(newSettings.sfxVolume);
      engineRef.current.audio.setMusicVolume(newSettings.musicVolume);
    }
    
    const saveData = localStorage.getItem('little_italy_save');
    if (saveData) {
      try {
        const parsed = JSON.parse(saveData);
        parsed.settings = newSettings;
        localStorage.setItem('little_italy_save', JSON.stringify(parsed));
      } catch (e) {
        console.warn('Failed to update save:', e);
      }
    }
  }, []);

  const handleQuitToMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setScreen(GameScreen.MAIN_MENU);
    setHasSave(false);
  }, []);

  const handleRestartLevel = useCallback(() => {
    if (engineRef.current && engineRef.current.player) {
      const currentLevelIdx = engineRef.current.currentLevelIdx;
      engineRef.current.loadLevel(currentLevelIdx);
      setScreen(GameScreen.PLAYING);
    }
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;

    const checkGameState = () => {
      const engine = engineRef.current;
      if (!engine) return;

      if (engine.screen !== screen) {
        setScreen(engine.screen);
      }
    };

    const intervalId = setInterval(checkGameState, 500);
    return () => clearInterval(intervalId);
  }, [screen]);

  const getEndScreenProps = () => {
    if (!engineRef.current || !engineRef.current.player) return null;
    
    const engine = engineRef.current;
    const player = engine.player!;
    const level = LEVELS[engine.currentLevelIdx];
    
    const stats = [
      { label: 'Score', value: player.state.score },
      { label: 'Health', value: `${Math.ceil(player.state.health)}%` },
      { label: 'Level', value: level?.name || 'Unknown' },
      { label: 'Enemies Defeated', value: engine.enemyAI.enemies.filter(e => e.state === 'DEAD').length },
    ];

    return {
      title: screen === GameScreen.GAME_OVER ? 'GAME OVER' : 'MISSION COMPLETE',
      subtitle: screen === GameScreen.VICTORY ? 'All levels completed!' : 'You were taken down...',
      stats,
      highScore: engine.highScore,
      currentScore: player.state.score,
      onRestart: handleRestartLevel,
      onNextLevel: screen === GameScreen.VICTORY ? undefined : () => {
        engine.nextLevel();
        setScreen(GameScreen.BRIEFING);
      },
      onMainMenu: handleQuitToMenu,
    };
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {screen === GameScreen.MAIN_MENU && !isLoading && (
        <MainMenu
          onStartGame={handleStartGame}
          onContinueGame={handleContinueGame}
          onOptions={() => setShowOptions(true)}
          hasSave={hasSave}
        />
      )}

      {showOptions && (
        <OptionsMenu
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowOptions(false)}
        />
      )}

      {screen === GameScreen.PAUSED && (
        <PauseMenu
          onResume={() => setScreen(GameScreen.PLAYING)}
          onRestartLevel={handleRestartLevel}
          onOptions={() => setShowOptions(true)}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {screen === GameScreen.BRIEFING && engineRef.current && (
        <BriefingScreen
          levelName={LEVELS[engineRef.current.currentLevelIdx]?.name || 'Loading...'}
          briefing={LEVELS[engineRef.current.currentLevelIdx]?.briefing || ''}
          onContinue={() => setScreen(GameScreen.PLAYING)}
        />
      )}

      {(screen === GameScreen.GAME_OVER || screen === GameScreen.VICTORY) && (
        <EndScreen {...getEndScreenProps()!} />
      )}

      {isLoading && (
        <LoadingScreen
          levelName={engineRef.current ? LEVELS[engineRef.current.currentLevelIdx]?.name || 'Loading...' : 'Starting...'}
          progress={loadingProgress}
        />
      )}
    </div>
  );
}
