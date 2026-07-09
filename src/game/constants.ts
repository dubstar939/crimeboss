// ============================================================
// Little Italy: Turf Wars — Game Constants
// Centralized configuration for magic numbers and tuning values
// ============================================================

// ---- Collision & Physics ----
export const PLAYER_RADIUS = 0.2;
export const PLAYER_HEIGHT = 0; // Not used in Wolf3D-style
export const PICKUP_RANGE = 0.55;
export const EXIT_TRIGGER_DISTANCE = 0.75;
export const ENEMY_COLLISION_RADIUS = 0.28;
export const BULLET_RADIUS = 0.12;

// ---- Movement ----
export const WALK_SPEED = 3.0;
export const SPRINT_SPEED = 4.5;
export const CROUCH_SPEED = 1.5;
export const BOB_FREQUENCY_WALK = 10;
export const BOB_FREQUENCY_SPRINT = 14;
export const BOB_AMPLITUDE_X = 6;
export const BOB_AMPLITUDE_Y = 4;

// ---- Combat ----
export const SHOTGUN_SHAKE_INTENSITY = 3.5;
export const PISTOL_SHAKE_INTENSITY = 1.75;
export const SHOTGUN_SHAKE_DURATION = 0.08;
export const DAMAGE_FLASH_DURATION = 0.3;
export const DAMAGE_FLASH_MAX_ALPHA = 0.45;
export const RECOIL_RECOVERY_RATE = 0.85;
export const MELEE_ATTACK_ANGLE = 0.7; // Radians (~40 degrees)

// ---- AI ----
export const ENEMY_ALERT_RANGE = 12;
export const ENEMY_CHASE_RANGE = 15;
export const ENEMY_LOST_TARGET_RANGE = 18;
export const ENEMY_ATTACK_RANGE_MULTIPLIER = 1.5;
export const PATROL_DURATION = 3;
export const ALERT_DURATION = 0.5;
export const STRAFE_DISTANCE = 5;
export const PATROL_DISTANCE_MIN = 2;
export const PATROL_DISTANCE_MAX = 4;
export const LINE_OF_SIGHT_STEPS_PER_TILE = 4;

// ---- Rendering ----
export const MIN_LIGHTING = 0.25;
export const CEILING_LIGHTING_FACTOR = 0.72;
export const SIDE_SHADING_FACTOR = 0.82;
export const MAX_RENDER_DISTANCE = 20;
export const SPRITE_MIN_DISTANCE = 0.05;
export const PARTICLE_SIZE_SCALE = 0.75;
export const HORIZON_BOB_AMPLITUDE_WALK = 1.25;
export const HORIZON_BOB_AMPLITUDE_SPRINT = 2;

// ---- Particles ----
export const PARTICLE_VELOCITY_MIN = -2.8;
export const PARTICLE_VELOCITY_MAX = 2.8;
export const IMPACT_PARTICLE_COUNT_DEFAULT = 3;
export const IMPACT_PARTICLE_COUNT_BLOOD = 5;
export const PARTICLE_LIFE_DEFAULT = 0.25;
export const PARTICLE_LIFE_BLOOD = 0.4;

// ---- UI ----
export const HUD_HEIGHT = 54;
export const HUD_BAR_THICKNESS = 2;
export const HEALTH_BAR_WIDTH = 126;
export const HEALTH_BAR_HEIGHT = 14;
export const MINIMAP_SIZE = 108;
export const MINIMAP_MARGIN = 12;
export const MINIMAP_CELL_PADDING = 2;
export const DEBUG_PANEL_WIDTH = 230;
export const DEBUG_PANEL_HEIGHT = 94;
export const MESSAGE_DURATION = 2;

// ---- Weapon View ----
export const WEAPON_BOB_OFFSET_X = 6;
export const WEAPON_BOB_OFFSET_Y = 4;
export const WEAPON_RECOIL_OFFSET_MULTIPLIER = 12;
export const WEAPON_STANDARD_WIDTH = 210;
export const WEAPON_STANDARD_HEIGHT = 210;
export const WEAPON_KNIFE_WIDTH = 160;
export const WEAPON_KNIFE_HEIGHT = 160;
export const WEAPON_Y_OFFSET = 72;
export const MUZZLE_FLASH_RADIUS = 16;
export const CROSSHAIR_LENGTH_OUTER = 7;
export const CROSSHAIR_GAP = 2;

// ---- Audio ----
export const DEFAULT_MASTER_VOLUME = 0.7;
export const DEFAULT_SFX_VOLUME = 0.8;
export const DEFAULT_MUSIC_VOLUME = 0.4;
export const VOLUME_SMOOTH_TIME = 0.1;

// ---- Save System ----
export const SAVE_KEY = 'little_italy_save';
export const SAVE_VERSION = 1;

// ---- Timing ----
export const BRIEFING_DURATION = 2000; // ms
export const DEATH_TIMER_THRESHOLD = 3; // seconds before removing corpse
export const HIT_FLASH_DECAY_RATE = 3;
export const MAX_FRAME_TIME = 0.1; // Cap delta time to prevent physics explosions

// ---- Crosshair ----
export const CROSSHAIR_COLOR = 'rgba(255,255,255,0.72)';

// ---- Health Bar Colors ----
export const HEALTH_BAR_BACKGROUND = '#232323';
export const HEALTH_BAR_HIGH = '#32c832'; // > 50%
export const HEALTH_BAR_MEDIUM = '#d2a62a'; // 25-50%
export const HEALTH_BAR_LOW = '#d23c3c'; // < 25%
export const HEALTH_BAR_BORDER = '#666';

// ---- Text Colors ----
export const TEXT_COLOR_WHITE = '#ffffff';
export const TEXT_COLOR_LIGHT_GRAY = '#dddddd';
export const TEXT_COLOR_GRAY = '#aaaaaa';
export const TEXT_COLOR_DARK_RED = '#8b1010';
export const TEXT_COLOR_AMMO_EMPTY = '#d23c3c';

// ---- Background Colors ----
export const BACKGROUND_OVERLAY_DARK = 'rgba(0,0,0,0.72)';
export const BACKGROUND_OVERLAY_MEDIUM = 'rgba(0,0,0,0.65)';
export const BACKGROUND_OVERLAY_LIGHT = 'rgba(0,0,0,0.64)';
export const DAMAGE_OVERLAY_COLOR = 'rgba(185, 20, 20,';

// ---- Minimap Colors ----
export const MINIMAP_WALL_COLOR = '#5b5b5b';
export const MINIMAP_DOOR_COLOR = '#8d8da2';
export const MINIMAP_PROP_COLOR = '#b98b52';
export const MINIMAP_ITEM_HEALTH_COLOR = '#38d038';
export const MINIMAP_ITEM_AMMO_COLOR = '#ffd34a';
export const MINIMAP_ENEMY_COLOR = '#cc5050';
export const MINIMAP_BOSS_COLOR = '#ff3030';
export const MINIMAP_PLAYER_COLOR = '#00ff66';

// ---- Quality Presets ----
export const GRAPHICS_QUALITY = {
  low: {
    renderDistance: 12,
    shadows: false,
    particles: false,
  },
  medium: {
    renderDistance: 20,
    shadows: false,
    particles: true,
  },
  high: {
    renderDistance: 30,
    shadows: true,
    particles: true,
  },
} as const;

// ---- Mouse Sensitivity ----
export const MOUSE_SENSITIVITY_MIN = 0.1;
export const MOUSE_SENSITIVITY_MAX = 5.0;
export const MOUSE_SENSITIVITY_DEFAULT = 1.0;
export const MOUSE_SENSITIVITY_SCALE = 0.002;
