// ============================================================
// Little Italy: Turf Wars — Game Data
// Weapons, enemies, bosses, and Wolf3D-style levels
// ============================================================

import { WeaponDef, EnemyDef, LevelDef } from './types';

// Weapon sprite imports (will be undefined if files don't exist yet)
let knifeImg: HTMLImageElement | undefined;
let pistolImg: HTMLImageElement | undefined;
let revolverImg: HTMLImageElement | undefined;
let tommygunImg: HTMLImageElement | undefined;
let shotgunImg: HTMLImageElement | undefined;

// Load weapon sprites at module initialization
function loadWeaponSprite(name: string): HTMLImageElement | undefined {
  try {
    const img = new Image();
    img.src = `/src/components/${name}.png`;
    return img;
  } catch {
    return undefined;
  }
}

// Initialize weapon images
knifeImg = loadWeaponSprite('knife');
pistolImg = loadWeaponSprite('pistol');
revolverImg = loadWeaponSprite('revolver');
tommygunImg = loadWeaponSprite('tommygun');
shotgunImg = loadWeaponSprite('shotgun');

// ============================================================
// WEAPONS
// ============================================================
export const WEAPONS: WeaponDef[] = [
  {
    id: 'knife',
    name: 'Switchblade',
    damage: 25,
    fireRate: 2,
    ammoCapacity: Infinity,
    spread: 0,
    reloadTime: 0,
    range: 1.4,
    auto: false,
    icon: knifeImg || '🔪',
    unlockLevel: 0,
  },
  {
    id: 'pistol',
    name: '.45 Pistol',
    damage: 18,
    fireRate: 3,
    ammoCapacity: 12,
    spread: 0.03,
    reloadTime: 1.2,
    range: 20,
    auto: false,
    icon: pistolImg || '🔫',
    unlockLevel: 0,
  },
  {
    id: 'revolver',
    name: '.38 Revolver',
    damage: 30,
    fireRate: 1.8,
    ammoCapacity: 6,
    spread: 0.02,
    reloadTime: 1.8,
    range: 24,
    auto: false,
    icon: revolverImg || '🎯',
    unlockLevel: 0,
  },
  {
    id: 'tommygun',
    name: 'Tommy Gun',
    damage: 11,
    fireRate: 10,
    ammoCapacity: 30,
    spread: 0.09,
    reloadTime: 2.4,
    range: 18,
    auto: true,
    icon: tommygunImg || '💥',
    unlockLevel: 1,
  },
  {
    id: 'shotgun',
    name: 'Sawed-Off Shotgun',
    damage: 42,
    fireRate: 1,
    ammoCapacity: 8,
    spread: 0.18,
    reloadTime: 2,
    range: 10,
    auto: false,
    icon: shotgunImg || '💣',
    unlockLevel: 2,
  },
];

// ============================================================
// ENEMIES
// ============================================================
export const ENEMY_DEFS: Record<string, EnemyDef> = {
  thug: {
    id: 'thug',
    name: 'Street Thug',
    health: 30,
    speed: 1.8,
    damage: 8,
    fireRate: 1.5,
    range: 1.4,
    spriteColor: '#555555',
    spriteAccent: '#888888',
    size: 0.4,
    score: 100,
    behavior: 'melee',
  },
  gunman: {
    id: 'gunman',
    name: 'Made Man',
    health: 50,
    speed: 1.4,
    damage: 12,
    fireRate: 2,
    range: 14,
    spriteColor: '#3a3a5c',
    spriteAccent: '#cc4444',
    size: 0.4,
    score: 200,
    behavior: 'ranged',
  },
  enforcer: {
    id: 'enforcer',
    name: 'Heavy Enforcer',
    health: 100,
    speed: 1,
    damage: 18,
    fireRate: 1.5,
    range: 12,
    spriteColor: '#2a2a2a',
    spriteAccent: '#ff8800',
    size: 0.5,
    score: 350,
    behavior: 'ranged',
  },
};

// ============================================================
// BOSSES
// ============================================================
export const BOSS_DEFS: Record<string, EnemyDef> = {
  little_pete: {
    id: 'little_pete',
    name: 'Little Pete',
    health: 120,
    speed: 2,
    damage: 15,
    fireRate: 3,
    range: 14,
    spriteColor: '#6a1a1a',
    spriteAccent: '#ffcc00',
    size: 0.5,
    score: 1000,
    behavior: 'boss',
  },
  tony_two_toes: {
    id: 'tony_two_toes',
    name: 'Tony Two-Toes',
    health: 200,
    speed: 1.6,
    damage: 20,
    fireRate: 4,
    range: 16,
    spriteColor: '#1a3a6a',
    spriteAccent: '#ff6600',
    size: 0.55,
    score: 2000,
    behavior: 'boss',
  },
  big_sal: {
    id: 'big_sal',
    name: 'Big Sal',
    health: 350,
    speed: 1.2,
    damage: 35,
    fireRate: 1.2,
    range: 10,
    spriteColor: '#2a1a0a',
    spriteAccent: '#ff0000',
    size: 0.65,
    score: 3500,
    behavior: 'boss',
  },
  the_don: {
    id: 'the_don',
    name: 'The Don',
    health: 500,
    speed: 1.4,
    damage: 25,
    fireRate: 3.5,
    range: 18,
    spriteColor: '#0a0a0a',
    spriteAccent: '#ffdd00',
    size: 0.6,
    score: 5000,
    behavior: 'boss',
  },
};

// ============================================================
// LEVELS
// Grid legend:
// # red brick, B brown brick, S stone, W wood,
// D metal door, K dark brick, M marble, . empty
// ============================================================
export const LEVELS: LevelDef[] = [
  {
    id: 0,
    name: 'Mulberry Test Block',
    description: 'Calibration corridors and safehouse rooms tuned to Wolf3D proportions.',
    briefing:
      'Start in a clean orthogonal training block hidden behind Mulberry Street. The hallways are wide, the rooms are rectangular, and Little Pete is waiting at the far end. Use this turf as your proving ground.',
    width: 20,
    height: 16,
    playerStart: { x: 2.5, y: 2.5 },
    playerAngle: 0,
    ambientColor: '#1f1f24',
    musicTempo: 100,
    map: [
      '####################',
      '#..................#',
      '#..SSSS....SSSS....#',
      '#..S..S....S..S....#',
      '#..S..S....S..S....#',
      '#..SSSS....SSSS....#',
      '#..................#',
      '#..######....####..#',
      '#..#....#....#..#..#',
      '#..#....#....#..#..#',
      '#..#....####....#..#',
      '#..#............#..#',
      '#..#.BBBB..BBBB.#..#',
      '#..#............#..#',
      '#..................#',
      '####################',
    ],
    enemies: [
      { type: 'thug', x: 6, y: 4 },
      { type: 'gunman', x: 14, y: 4 },
      { type: 'gunman', x: 10, y: 8 },
      { type: 'thug', x: 6, y: 12 },
    ],
    boss: { type: 'little_pete', x: 14, y: 12 },
    items: [
      { type: 'health', x: 4, y: 3, value: 25 },
      { type: 'ammo', x: 15, y: 3, value: 12 },
      { type: 'health', x: 10, y: 6, value: 20 },
      { type: 'ammo', x: 4, y: 13, value: 12 },
    ],
    props: [
      { type: 'lamp', x: 9, y: 2 },
      { type: 'barrel', x: 9, y: 11 },
      { type: 'table', x: 11, y: 11 },
    ],
    exitPos: { x: 17, y: 14 },
  },
  {
    id: 1,
    name: "Tony's Restaurant",
    description: 'Dining halls, side booths, and a back-room gunfight.',
    briefing:
      'Tony Two-Toes runs this joint as a front. Sweep the booths, cut through the kitchen side rooms, then finish Tony in the back chamber before his men can pin you down.',
    width: 24,
    height: 18,
    playerStart: { x: 2.5, y: 2.5 },
    playerAngle: 0,
    ambientColor: '#281d1a',
    musicTempo: 108,
    map: [
      '########################',
      '#......................#',
      '#..WWWWWW....WWWWWW....#',
      '#..W....W....W....W....#',
      '#..W....W....W....W....#',
      '#..WWWWWW....WWWWWW....#',
      '#......................#',
      '#..######....######....#',
      '#..#....#....#....#....#',
      '#..#....#....#....#....#',
      '#..#....######....#....#',
      '#..#................#..#',
      '#..#.BBBB....SSSS...#..#',
      '#..#................#..#',
      '#..######......######..#',
      '#......................#',
      '#......................#',
      '########################',
    ],
    enemies: [
      { type: 'thug', x: 6, y: 4 },
      { type: 'gunman', x: 16, y: 4 },
      { type: 'gunman', x: 10, y: 8 },
      { type: 'enforcer', x: 17, y: 10 },
      { type: 'thug', x: 7, y: 12 },
      { type: 'gunman', x: 14, y: 13 },
    ],
    boss: { type: 'tony_two_toes', x: 19, y: 14 },
    items: [
      { type: 'health', x: 4, y: 3, value: 30 },
      { type: 'ammo', x: 19, y: 3, value: 18 },
      { type: 'weapon', x: 10, y: 11, value: 0, weaponId: 'tommygun' },
      { type: 'health', x: 6, y: 14, value: 25 },
      { type: 'ammo', x: 18, y: 14, value: 24 },
    ],
    props: [
      { type: 'table', x: 8, y: 6 },
      { type: 'table', x: 14, y: 6 },
      { type: 'lamp', x: 12, y: 9 },
      { type: 'barrel', x: 17, y: 12 },
    ],
    exitPos: { x: 21, y: 16 },
  },
  {
    id: 2,
    name: 'Warehouse Row',
    description: 'Rectangular storage lanes and cargo rooms leading to Big Sal.',
    briefing:
      'Big Sal has the warehouses under lock. Push down the long storage aisles, clear the side rooms, and use the cover props wisely before Sal rushes your position.',
    width: 26,
    height: 20,
    playerStart: { x: 2.5, y: 2.5 },
    playerAngle: 0,
    ambientColor: '#1d2321',
    musicTempo: 116,
    map: [
      '##########################',
      '#........................#',
      '#..KKKKKK....KKKKKK......#',
      '#..K....K....K....K......#',
      '#..K....K....K....K......#',
      '#..KKKKKK....KKKKKK......#',
      '#........................#',
      '#..######....######......#',
      '#..#....#....#....#......#',
      '#..#....#....#....#......#',
      '#..#....######....#......#',
      '#..#......BBBB....#......#',
      '#..#..................DD.#',
      '#..########....######....#',
      '#..............SSSSSS....#',
      '#..............S....S....#',
      '#..DD..........S....S....#',
      '#..............S....S....#',
      '#..............SSSSSS....#',
      '##########################',
    ],
    enemies: [
      { type: 'gunman', x: 6, y: 4 },
      { type: 'gunman', x: 16, y: 4 },
      { type: 'enforcer', x: 10, y: 9 },
      { type: 'gunman', x: 18, y: 10 },
      { type: 'thug', x: 7, y: 12 },
      { type: 'enforcer', x: 18, y: 15 },
      { type: 'gunman', x: 8, y: 17 },
    ],
    boss: { type: 'big_sal', x: 19, y: 17 },
    items: [
      { type: 'health', x: 4, y: 3, value: 35 },
      { type: 'ammo', x: 20, y: 3, value: 20 },
      { type: 'weapon', x: 10, y: 12, value: 0, weaponId: 'shotgun' },
      { type: 'ammo', x: 16, y: 14, value: 24 },
      { type: 'health', x: 21, y: 17, value: 35 },
    ],
    props: [
      { type: 'barrel', x: 12, y: 11 },
      { type: 'barrel', x: 13, y: 11 },
      { type: 'lamp', x: 15, y: 14 },
      { type: 'table', x: 18, y: 17 },
    ],
    exitPos: { x: 23, y: 18 },
  },
  {
    id: 3,
    name: "The Don's Mansion",
    description: 'Marble halls, dark-brick chambers, and the final compound.',
    briefing:
      'This is the final push. The mansion is built from neat right angles, long sightlines, and a brutal central hall. Cut through the guards and confront The Don in his inner court.',
    width: 28,
    height: 22,
    playerStart: { x: 2.5, y: 2.5 },
    playerAngle: 0,
    ambientColor: '#262316',
    musicTempo: 126,
    map: [
      '############################',
      '#..........................#',
      '#..MMMMMM......MMMMMM......#',
      '#..M....M......M....M......#',
      '#..M....M......M....M......#',
      '#..MMMMMM......MMMMMM......#',
      '#..........................#',
      '#..########....########....#',
      '#..#......#....#......#....#',
      '#..#......#....#......#....#',
      '#..#......######......#....#',
      '#..#....KKKKKK....#......D.#',
      '#..#....K....K....#......#.#',
      '#..#....K....K....#......#.#',
      '#..#....KKKKKK....#......#.#',
      '#..#....................##.#',
      '#..########....########....#',
      '#..........SSSS............#',
      '#..........S..S............#',
      '#..DD......S..S......DD....#',
      '#..........SSSS............#',
      '############################',
    ],
    enemies: [
      { type: 'gunman', x: 6, y: 4 },
      { type: 'gunman', x: 18, y: 4 },
      { type: 'enforcer', x: 10, y: 9 },
      { type: 'gunman', x: 19, y: 9 },
      { type: 'enforcer', x: 10, y: 13 },
      { type: 'gunman', x: 18, y: 13 },
      { type: 'enforcer', x: 12, y: 18 },
      { type: 'gunman', x: 17, y: 18 },
    ],
    boss: { type: 'the_don', x: 14, y: 19 },
    items: [
      { type: 'health', x: 4, y: 3, value: 50 },
      { type: 'ammo', x: 22, y: 3, value: 30 },
      { type: 'health', x: 8, y: 12, value: 35 },
      { type: 'ammo', x: 20, y: 12, value: 28 },
      { type: 'health', x: 14, y: 17, value: 40 },
    ],
    props: [
      { type: 'lamp', x: 14, y: 8 },
      { type: 'table', x: 14, y: 15 },
      { type: 'barrel', x: 11, y: 18 },
      { type: 'barrel', x: 18, y: 18 },
    ],
    exitPos: { x: 24, y: 20 },
  },
];
