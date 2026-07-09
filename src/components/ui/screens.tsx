import { useState } from 'react';
import { GameSettings } from '../../game/types';
import { Button, Slider, Toggle, Modal } from './index';

interface MainMenuProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  onOptions: () => void;
  hasSave: boolean;
}

export function MainMenu({ onStartGame, onContinueGame, onOptions, hasSave }: MainMenuProps) {
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-900 via-red-950 to-black flex flex-col items-center justify-center">
      {/* Title */}
      <div className="absolute top-0 left-0 right-0 p-8 text-center">
        <h1 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-lg" style={{ fontFamily: 'Impact, sans-serif' }}>
          LITTLE ITALY
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold text-red-500 tracking-widest uppercase">
          Turf Wars
        </h2>
        <p className="text-gray-400 mt-4 font-mono text-sm">1920s Street Warfare Simulator</p>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-4 z-10">
        <Button size="lg" onClick={onStartGame} className="min-w-[280px]">
          New Game
        </Button>
        
        {hasSave && (
          <Button size="lg" variant="secondary" onClick={onContinueGame} className="min-w-[280px]">
            Continue Game
          </Button>
        )}
        
        <Button size="lg" variant="secondary" onClick={onOptions} className="min-w-[280px]">
          Options
        </Button>
        
        <Button size="md" variant="secondary" onClick={() => setShowControls(true)} className="min-w-[280px]">
          Controls
        </Button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center text-gray-500 font-mono text-xs">
        <p>© 2024 Little Italy Games</p>
        <p className="mt-1">Built with Wolf3D-style Raycasting Engine</p>
      </div>

      {/* Controls Modal */}
      {showControls && (
        <Modal title="Controls" onClose={() => setShowControls(false)}>
          <div className="space-y-3 text-white font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-gray-400">Move Forward</span>
              <span className="text-right">W / ↑</span>
              
              <span className="text-gray-400">Move Backward</span>
              <span className="text-right">S / ↓</span>
              
              <span className="text-gray-400">Strafe Left</span>
              <span className="text-right">A / ←</span>
              
              <span className="text-gray-400">Strafe Right</span>
              <span className="text-right">D / →</span>
              
              <span className="text-gray-400">Sprint</span>
              <span className="text-right">Shift</span>
              
              <span className="text-gray-400">Crouch</span>
              <span className="text-right">Ctrl</span>
              
              <span className="text-gray-400">Fire</span>
              <span className="text-right">Left Click</span>
              
              <span className="text-gray-400">Reload</span>
              <span className="text-right">R</span>
              
              <span className="text-gray-400">Next Weapon</span>
              <span className="text-right">Scroll / Q</span>
              
              <span className="text-gray-400">Previous Weapon</span>
              <span className="text-right">Scroll / E</span>
              
              <span className="text-gray-400">Pause</span>
              <span className="text-right">Escape</span>
              
              <span className="text-gray-400">Minimap</span>
              <span className="text-right">M</span>
              
              <span className="text-gray-400">Debug Info</span>
              <span className="text-right">F3</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface PauseMenuProps {
  onResume: () => void;
  onRestartLevel: () => void;
  onOptions: () => void;
  onQuitToMenu: () => void;
}

export function PauseMenu({ onResume, onRestartLevel, onOptions, onQuitToMenu }: PauseMenuProps) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900 border-2 border-red-800 rounded-lg shadow-2xl p-8 min-w-[320px]">
        <h2 className="text-3xl font-bold text-white mb-6 text-center font-mono uppercase tracking-wider">
          Paused
        </h2>
        
        <div className="flex flex-col gap-3">
          <Button size="md" onClick={onResume}>Resume</Button>
          <Button size="md" variant="secondary" onClick={onRestartLevel}>Restart Level</Button>
          <Button size="md" variant="secondary" onClick={onOptions}>Options</Button>
          <Button size="md" variant="danger" onClick={onQuitToMenu}>Quit to Main Menu</Button>
        </div>
      </div>
    </div>
  );
}

interface OptionsMenuProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
}

export function OptionsMenu({ settings, onSave, onClose }: OptionsMenuProps) {
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });
  const [showMinimap, setShowMinimap] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <Modal title="Options" onClose={handleSave}>
      <div className="space-y-6">
        {/* Audio Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-mono uppercase border-b border-gray-700 pb-2">
            Audio
          </h3>
          
          <Slider
            label="Master Volume"
            value={localSettings.masterVolume}
            min={0}
            max={1}
            onChange={(v) => setLocalSettings({ ...localSettings, masterVolume: v })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          
          <Slider
            label="SFX Volume"
            value={localSettings.sfxVolume}
            min={0}
            max={1}
            onChange={(v) => setLocalSettings({ ...localSettings, sfxVolume: v })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          
          <Slider
            label="Music Volume"
            value={localSettings.musicVolume}
            min={0}
            max={1}
            onChange={(v) => setLocalSettings({ ...localSettings, musicVolume: v })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>

        {/* Graphics Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-mono uppercase border-b border-gray-700 pb-2">
            Graphics
          </h3>
          
          <Slider
            label="Mouse Sensitivity"
            value={localSettings.mouseSensitivity}
            min={0.1}
            max={5}
            step={0.1}
            onChange={(v) => setLocalSettings({ ...localSettings, mouseSensitivity: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          
          <Slider
            label="Render Distance"
            value={localSettings.renderDistance}
            min={8}
            max={30}
            step={1}
            onChange={(v) => setLocalSettings({ ...localSettings, renderDistance: Math.round(v) })}
            formatValue={(v) => `${Math.round(v)} tiles`}
          />
          
          <div className="flex items-center justify-between">
            <label className="text-white font-mono text-sm">Graphics Quality</label>
            <select
              value={localSettings.graphicsQuality}
              onChange={(e) => setLocalSettings({ 
                ...localSettings, 
                graphicsQuality: e.target.value as 'low' | 'medium' | 'high' 
              })}
              className="bg-gray-800 text-white font-mono text-sm px-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-red-600"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-mono uppercase border-b border-gray-700 pb-2">
            Display
          </h3>
          
          <Toggle
            label="Show Minimap"
            checked={showMinimap}
            onChange={setShowMinimap}
          />
          
          <Toggle
            label="Show Debug Info"
            checked={showDebug}
            onChange={setShowDebug}
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-700">
          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface BriefingScreenProps {
  levelName: string;
  briefing: string;
  onContinue: () => void;
}

export function BriefingScreen({ levelName, briefing, onContinue }: BriefingScreenProps) {
  return (
    <div className="fixed inset-0 z-30 bg-black/90 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h2 className="text-4xl font-bold text-red-500 mb-6 font-mono uppercase tracking-wider">
          {levelName}
        </h2>
        <p className="text-xl text-gray-300 mb-8 leading-relaxed font-mono">
          {briefing}
        </p>
        <Button size="lg" onClick={onContinue}>
          Start Mission
        </Button>
      </div>
    </div>
  );
}

interface EndScreenProps {
  title: string;
  subtitle?: string;
  stats: { label: string; value: string | number }[];
  highScore?: number;
  currentScore: number;
  onRestart: () => void;
  onNextLevel?: () => void;
  onMainMenu: () => void;
}

export function EndScreen({ 
  title, 
  subtitle, 
  stats, 
  highScore,
  currentScore, 
  onRestart, 
  onNextLevel,
  onMainMenu 
}: EndScreenProps) {
  const isNewHighScore = highScore !== undefined && currentScore >= highScore && currentScore > 0;

  return (
    <div className="fixed inset-0 z-30 bg-gradient-to-b from-gray-900 via-red-950/50 to-black flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className={`text-5xl font-black mb-2 ${title === 'GAME OVER' ? 'text-red-600' : 'text-green-500'}`} style={{ fontFamily: 'Impact, sans-serif' }}>
            {title}
          </h1>
          {subtitle && <p className="text-xl text-gray-400 font-mono">{subtitle}</p>}
          {isNewHighScore && (
            <p className="text-yellow-400 font-mono text-lg mt-2 animate-pulse">
              ★ NEW HIGH SCORE! ★
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex justify-between border-b border-gray-800 pb-2 last:border-0">
                <span className="text-gray-400 font-mono text-sm">{stat.label}</span>
                <span className="text-white font-mono font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Score Display */}
        {highScore !== undefined && (
          <div className="text-center mb-6">
            <p className="text-gray-400 font-mono text-sm">Current Score: <span className="text-white font-bold">{currentScore}</span></p>
            <p className="text-gray-400 font-mono text-sm">High Score: <span className="text-yellow-400 font-bold">{highScore}</span></p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {onNextLevel && (
            <Button size="lg" onClick={onNextLevel}>Next Level</Button>
          )}
          <Button size="lg" variant="secondary" onClick={onRestart}>
            {onNextLevel ? 'Restart Level' : 'Try Again'}
          </Button>
          <Button size="md" variant="secondary" onClick={onMainMenu}>Main Menu</Button>
        </div>
      </div>
    </div>
  );
}

interface LoadingScreenProps {
  levelName: string;
  progress?: number;
  tip?: string;
}

export function LoadingScreen({ levelName, progress, tip }: LoadingScreenProps) {
  const tips = [
    "Watch your ammo count - scavenge from fallen enemies!",
    "The minimap shows enemy positions in red.",
    "Shotguns are powerful but slow to reload.",
    "Sprinting is faster but makes more noise.",
    "Flank enemies when possible for tactical advantage.",
    "Health pickups glow green on the minimap.",
    "Boss fights require strategy - don't rush in!",
    "The Tommy Gun has the highest fire rate.",
  ];

  const randomTip = tip || tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold text-white mb-2 font-mono uppercase">
        Loading...
      </h2>
      <p className="text-xl text-red-500 mb-8 font-mono">{levelName}</p>
      
      {/* Progress Bar */}
      <div className="w-full max-w-md bg-gray-800 rounded-full h-4 mb-4 overflow-hidden">
        <div 
          className="bg-red-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress || 0}%` }}
        />
      </div>
      
      {/* Tip */}
      <div className="max-w-md text-center">
        <p className="text-gray-400 font-mono text-sm italic">
          TIP: {randomTip}
        </p>
      </div>
    </div>
  );
}
