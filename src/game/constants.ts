// src/game/constants.ts

export const GAME_CONFIG = {
  TICK_RATE: 30, // Logic updates per second
  FOV: Math.PI / 3,
  BLOCK_SIZE: 64,
  MAP_WIDTH: 24,
  MAP_HEIGHT: 24,
  MAX_DEPTH: 20, // Max raycast depth (in blocks)
  MINIMAP_SCALE: 0.2,
};

export const PLAYER_CONFIG = {
  MOVE_SPEED: 4.0,
  ROT_SPEED: 2.5,
  FOV: GAME_CONFIG.FOV,
  HEALTH_MAX: 100,
};

export const ENEMY_CONFIG = {
  SPEED: 1.5,
  DETECT_RADIUS: 8,
  ATTACK_RANGE: 1.5,
  DAMAGE: 10,
};

export const COLORS = {
  FLOOR: '#333333',
  CEILING: '#1a1a1a',
  WALL_DARK: '#555555',
  WALL_LIGHT: '#777777',
};

export const KEYS = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  ACTION: ' ',
};
