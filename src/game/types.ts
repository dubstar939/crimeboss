// ============================================================
// Little Italy: Turf Wars — Type Definitions
// Wolfenstein-style FPS constants and data contracts
// ============================================================

// ---- Vector & Geometry ----
export interface Vec2 {
  x: number;
  y: number;
}

// ---- Game States ----
export enum GameScreen {
  MAIN_MENU = 'MAIN_MENU',
  BRIEFING = 'BRIEFING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  OPTIONS = 'OPTIONS',
}

// ---- Weapons ----
export interface WeaponDef {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  ammoCapacity: number;
  spread: number;
  reloadTime: number;
  range: number;
  auto: boolean;
  icon: string | any;
  unlockLevel: number;
}

export interface WeaponState extends WeaponDef {
  currentAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  fireTimer: number;
  recoilOffset: number;
}

// ---- Enemies ----
export enum EnemyState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  ALERT = 'ALERT',
  CHASE = 'CHASE',
  ATTACK = 'ATTACK',
  DEAD = 'DEAD',
}

export interface EnemyDef {
  id: string;
  name: string;
  health: number;
  speed: number;
  damage: number;
  fireRate: number;
  range: number;
  spriteColor: string;
  spriteAccent: string;
  size: number;
  score: number;
  behavior: 'melee' | 'ranged' | 'boss';
}

export interface Enemy {
  def: EnemyDef;
  x: number;
  y: number;
  angle: number;
  health: number;
  state: EnemyState;
  alertTimer: number;
  fireTimer: number;
  patrolTarget: Vec2;
  patrolTimer: number;
  deathTimer: number;
  hitFlash: number;
  isBoss: boolean;
  justAttacked: boolean;
  bossPhase: number;
  phaseThresholds: number[];
  hasSummoned: boolean;
  summonTimer: number;
}

// ---- Pickups / Props ----
export enum ItemType {
  HEALTH = 'HEALTH',
  AMMO = 'AMMO',
  WEAPON = 'WEAPON',
  KEY = 'KEY',
}

export interface Item {
  type: ItemType;
  x: number;
  y: number;
  value: number;
  weaponId?: string;
  collected: boolean;
  bobTimer: number;
}

export type PropType = 'barrel' | 'table' | 'lamp';

export interface LevelProp {
  type: PropType;
  x: number;
  y: number;
}

// ---- Levels ----
export interface LevelDef {
  id: number;
  name: string;
  description: string;
  briefing: string;
  map: string[];
  width: number;
  height: number;
  playerStart: Vec2;
  playerAngle: number;
  enemies: { type: string; x: number; y: number }[];
  boss?: { type: string; x: number; y: number };
  items: { type: string; x: number; y: number; value: number; weaponId?: string }[];
  props?: LevelProp[];
  exitPos: Vec2;
  ambientColor: string;
  musicTempo: number;
}

// ---- Player ----
export interface PlayerState {
  x: number;
  y: number;
  angle: number;
  pitch: number;
  health: number;
  maxHealth: number;
  armor: number;
  weapons: WeaponState[];
  currentWeaponIndex: number;
  keys: number;
  score: number;
  bobPhase: number;
  damageFlash: number;
  isSprinting: boolean;
  isCrouching: boolean;
}

// ---- Settings / Save ----
export interface GameSettings {
  mouseSensitivity: number;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  renderDistance: number;
  graphicsQuality: 'low' | 'medium' | 'high';
}

export interface SaveData {
  currentLevel: number;
  completedLevels: number[];
  settings: GameSettings;
  highScore: number;
}

// ---- Runtime Effects ----
export interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
  range: number;
  traveled: number;
  isPlayer: boolean;
  owner?: Enemy;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
}

// ---- Render Constants ----
export const RENDER_WIDTH = 640;
export const RENDER_HEIGHT = 400;
export const TEX_SIZE = 64;

// Wolf3D-style fixed world metrics
export const TILE_SIZE = 64;
export const WALL_HEIGHT = 64;
export const CEILING_HEIGHT = 64;
export const CAMERA_HEIGHT = 32;
export const HORIZONTAL_FOV = (80 * Math.PI) / 180;

export function getProjectionPlaneDistance(): number {
  return RENDER_WIDTH / 2 / Math.tan(HORIZONTAL_FOV / 2);
}

export function getVerticalFov(): number {
  return 2 * Math.atan((RENDER_HEIGHT / 2) / getProjectionPlaneDistance());
}

// ---- Wall Types ----
export enum WallType {
  EMPTY = 0,
  RED_BRICK = 1,
  BROWN_BRICK = 2,
  STONE = 3,
  WOOD = 4,
  METAL_DOOR = 5,
  DARK_BRICK = 6,
  MARBLE = 7,
}

// ---- Map parsing helpers ----
export const WALL_CHAR_MAP: Record<string, WallType> = {
  '#': WallType.RED_BRICK,
  'B': WallType.BROWN_BRICK,
  'S': WallType.STONE,
  'W': WallType.WOOD,
  'D': WallType.METAL_DOOR,
  'K': WallType.DARK_BRICK,
  'M': WallType.MARBLE,
};

export function parseMap(level: LevelDef): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < level.height; y++) {
    const row: number[] = [];
    for (let x = 0; x < level.width; x++) {
      const ch = level.map[y]?.[x] ?? '#';
      row.push(WALL_CHAR_MAP[ch] ?? WallType.EMPTY);
    }
    map.push(row);
  }
  return map;
}

export function isWall(map: number[][], x: number, y: number): boolean {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || mx >= (map[0]?.length ?? 0) || my < 0 || my >= map.length) return true;
  return map[my][mx] !== WallType.EMPTY;
}
