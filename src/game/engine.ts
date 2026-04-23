// ============================================================
// Little Italy: Turf Wars — Corrected Wolf3D-Style Engine
// Raycasting renderer, sprite renderer, gameplay loop, HUD, debug
// ============================================================

import {
  RENDER_WIDTH,
  RENDER_HEIGHT,
  TEX_SIZE,
  CEILING_HEIGHT,
  CAMERA_HEIGHT,
  TILE_SIZE,
  GameScreen,
  ItemType,
  EnemyState,
  WallType,
  Item,
  Bullet,
  Particle,
  ScreenShake,
  GameSettings,
  LevelProp,
  parseMap,
  isWall,
} from './types';
import { LEVELS, WEAPONS } from './data';
import {
  getWallTexture,
  getFloorTexture,
  getCeilingTexture,
  getEnemySprite,
  getItemSprite,
  getPropSprite,
  getWeaponSprite,
  initializeSprites,
} from './textures';
import { PlayerController } from './player';
import { EnemyAI } from './enemy';
import { AudioManager } from './audio';
import { buildCameraBasis, castRay } from './raycast';

interface RenderSprite {
  x: number;
  y: number;
  tex: Uint8Array;
  widthUnits: number;
  heightUnits: number;
  liftUnits: number;
  hitFlash?: number;
}

const CAMERA_HEIGHT_TILES = CAMERA_HEIGHT / TILE_SIZE;
const TOP_FROM_CAMERA_TILES = (CEILING_HEIGHT - CAMERA_HEIGHT) / TILE_SIZE;
const BOTTOM_FROM_CAMERA_TILES = CAMERA_HEIGHT / TILE_SIZE;

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  pixels: Uint8ClampedArray;
  depthBuffer: Float32Array;

  player: PlayerController | null = null;
  enemyAI: EnemyAI;
  items: Item[] = [];
  props: LevelProp[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  shake: ScreenShake = { intensity: 0, duration: 0, timer: 0 };

  currentLevelIdx = 0;
  map: number[][] = [];
  screen: GameScreen = GameScreen.MAIN_MENU;
  settings: GameSettings = {
    mouseSensitivity: 1,
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    renderDistance: 20,
    graphicsQuality: 'medium',
  };

  audio = new AudioManager();
  keys = new Set<string>();
  mouseDeltaX = 0;
  lastTime = 0;
  running = false;

  completedLevels: number[] = [];
  highScore = 0;

  showMinimap = true;
  showDebug = true;
  messageText = '';
  messageTimer = 0;
  raySamples: number[] = [0, 0, 0];

  private textureCanvasCache = new Map<string, HTMLCanvasElement>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.imageSmoothingEnabled = false;
    canvas.width = RENDER_WIDTH;
    canvas.height = RENDER_HEIGHT;
    this.imageData = this.ctx.createImageData(RENDER_WIDTH, RENDER_HEIGHT);
    this.pixels = this.imageData.data;
    this.depthBuffer = new Float32Array(RENDER_WIDTH);
    this.enemyAI = new EnemyAI();

    this.setupInput(canvas);
    this.loadSettings();
    this.audio.setMasterVolume(this.settings.masterVolume);
    this.audio.setSfxVolume(this.settings.sfxVolume);
    this.audio.setMusicVolume(this.settings.musicVolume);
  }

  // ---- Input ----
  private setupInput(canvas: HTMLCanvasElement) {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.code);

      if (e.code === 'Escape') {
        if (this.screen === GameScreen.PLAYING) this.screen = GameScreen.PAUSED;
        else if (this.screen === GameScreen.PAUSED) this.screen = GameScreen.PLAYING;
      }

      if (e.code === 'KeyM' && this.player) this.showMinimap = !this.showMinimap;
      if (e.code === 'F3') this.showDebug = !this.showDebug;
      if (e.code === 'Tab') e.preventDefault();
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.keys.add('Mouse0');
      if (this.screen === GameScreen.PLAYING && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.keys.delete('Mouse0');
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        this.mouseDeltaX += e.movementX;
      }
    });
  }

  // ---- Save / Load ----
  private loadSettings() {
    try {
      const data = localStorage.getItem('little_italy_save');
      if (!data) return;
      const save = JSON.parse(data);
      this.completedLevels = save.completedLevels || [];
      this.highScore = save.highScore || 0;
      if (save.settings) Object.assign(this.settings, save.settings);
    } catch {
      // ignore malformed saves
    }
  }

  saveGame() {
    localStorage.setItem(
      'little_italy_save',
      JSON.stringify({
        completedLevels: this.completedLevels,
        highScore: this.highScore,
        settings: this.settings,
      }),
    );
  }

  // ---- Flow ----
  async startGame() {
    await initializeSprites();
    this.audio.init();
    this.audio.resume();
    this.currentLevelIdx = 0;
    this.screen = GameScreen.BRIEFING;
  }

  async continueGame() {
    await initializeSprites();
    this.audio.init();
    this.audio.resume();
    this.currentLevelIdx = Math.min(this.completedLevels.length, LEVELS.length - 1);
    this.screen = GameScreen.BRIEFING;
  }

  nextLevel() {
    if (this.currentLevelIdx + 1 < LEVELS.length) {
      this.currentLevelIdx += 1;
      this.screen = GameScreen.BRIEFING;
    } else {
      this.screen = GameScreen.VICTORY;
    }
  }

  loadLevel(idx: number) {
    if (idx < 0 || idx >= LEVELS.length) return;

    this.currentLevelIdx = idx;
    const level = LEVELS[idx];
    this.map = parseMap(level);

    this.player = new PlayerController(level.playerStart.x, level.playerStart.y, level.playerAngle);

    this.enemyAI.clear();
    for (const enemy of level.enemies) {
      this.enemyAI.spawn(enemy.type, enemy.x + 0.5, enemy.y + 0.5);
    }
    if (level.boss) {
      this.enemyAI.spawn(level.boss.type, level.boss.x + 0.5, level.boss.y + 0.5, true);
    }

    this.items = level.items.map((item) => ({
      type: this.toItemType(item.type),
      x: item.x + 0.5,
      y: item.y + 0.5,
      value: item.value,
      weaponId: item.weaponId,
      collected: false,
      bobTimer: Math.random() * Math.PI * 2,
    }));

    this.props = (level.props || []).map((prop) => ({
      ...prop,
      x: prop.x + 0.5,
      y: prop.y + 0.5,
    }));

    this.bullets = [];
    this.particles = [];
    this.messageText = '';
    this.messageTimer = 0;
    this.audio.startMusic(level.musicTempo);
  }

  // ---- Game Loop ----
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    this.audio.stopMusic();
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };

  // ---- Update ----
  private update(dt: number) {
    if (this.screen !== GameScreen.PLAYING || !this.player) {
      this.mouseDeltaX = 0;
      return;
    }

    const { fired } = this.player.update(
      dt,
      this.keys,
      this.mouseDeltaX,
      this.settings.mouseSensitivity,
      this.map,
      this.audio,
    );
    this.mouseDeltaX = 0;

    for (const item of this.items) item.bobTimer += dt * 3;

    if (fired) this.fireWeapon();

    this.updateBullets(dt);

    const newEnemies = this.enemyAI.update(
      dt,
      this.player.state.x,
      this.player.state.y,
      this.map,
      this.audio,
    );
    for (const enemy of newEnemies) this.enemyAI.enemies.push(enemy);

    this.processEnemyAttacks();
    this.processPickups();
    this.checkExit();
    this.updateParticles(dt);

    if (this.shake.timer > 0) {
      this.shake.timer -= dt;
      if (this.shake.timer <= 0) this.shake.intensity = 0;
    }

    if (this.messageTimer > 0) this.messageTimer -= dt;

    if (this.player.state.health <= 0) {
      this.screen = GameScreen.GAME_OVER;
      this.audio.stopMusic();
      this.saveGame();
    }
  }

  private fireWeapon() {
    if (!this.player) return;
    const player = this.player.state;
    const weapon = this.player.getCurrentWeapon();

    if (weapon.id === 'knife') {
      for (const enemy of this.enemyAI.getActiveEnemies()) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > weapon.range) continue;

        const angle = Math.atan2(dy, dx);
        let diff = angle - player.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) < 0.7) {
          const killed = this.enemyAI.damageEnemy(enemy, weapon.damage, this.audio);
          if (killed) player.score += enemy.def.score;
        }
      }
      return;
    }

    const pellets = this.player.isShotgun() ? 6 : 1;
    for (let i = 0; i < pellets; i++) {
      const spreadAngle = player.angle + (Math.random() - 0.5) * weapon.spread * 2;
      this.bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(spreadAngle),
        dy: Math.sin(spreadAngle),
        damage: weapon.damage,
        range: weapon.range,
        traveled: 0,
        isPlayer: true,
      });
    }

    this.shake.intensity = this.player.isShotgun() ? 3.5 : 1.75;
    this.shake.duration = 0.08;
    this.shake.timer = 0.08;
  }

  private updateBullets(dt: number) {
    const bulletSpeed = 30;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const moveX = bullet.dx * bulletSpeed * dt;
      const moveY = bullet.dy * bulletSpeed * dt;
      bullet.x += moveX;
      bullet.y += moveY;
      bullet.traveled += Math.hypot(moveX, moveY);

      if (isWall(this.map, bullet.x, bullet.y) || bullet.traveled > bullet.range) {
        this.spawnImpactParticles(bullet.x, bullet.y, '#d8b35e', 3, 0.25);
        this.bullets.splice(i, 1);
        continue;
      }

      if (bullet.isPlayer) {
        let hit = false;
        for (const enemy of this.enemyAI.getActiveEnemies()) {
          if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.def.size + 0.12) {
            const killed = this.enemyAI.damageEnemy(enemy, bullet.damage, this.audio);
            if (killed && this.player) this.player.state.score += enemy.def.score;
            this.spawnImpactParticles(bullet.x, bullet.y, '#c84545', 5, 0.4);
            this.bullets.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      } else if (this.player && Math.hypot(this.player.state.x - bullet.x, this.player.state.y - bullet.y) < 0.28) {
        const dead = this.player.takeDamage(bullet.damage);
        this.audio.playPlayerHurt();
        this.shake.intensity = 2.5;
        this.shake.timer = 0.12;
        this.bullets.splice(i, 1);
        if (dead) {
          this.screen = GameScreen.GAME_OVER;
          this.audio.stopMusic();
          this.saveGame();
        }
      }
    }
  }

  private processEnemyAttacks() {
    if (!this.player) return;

    const player = this.player.state;
    for (const enemy of this.enemyAI.getActiveEnemies()) {
      if (enemy.state !== EnemyState.ATTACK || !enemy.justAttacked) continue;

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist > enemy.def.range) continue;

      if (enemy.def.behavior === 'melee') {
        const dead = this.player.takeDamage(enemy.def.damage);
        this.audio.playPlayerHurt();
        this.shake.intensity = 2.5;
        this.shake.timer = 0.12;
        if (dead) {
          this.screen = GameScreen.GAME_OVER;
          this.audio.stopMusic();
          this.saveGame();
        }
      } else {
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.12;
        this.bullets.push({
          x: enemy.x,
          y: enemy.y,
          dx: Math.cos(angle),
          dy: Math.sin(angle),
          damage: enemy.def.damage,
          range: enemy.def.range,
          traveled: 0,
          isPlayer: false,
          owner: enemy,
        });
      }
    }
  }

  private processPickups() {
    if (!this.player) return;
    const player = this.player.state;

    for (const item of this.items) {
      if (item.collected) continue;
      if (Math.hypot(player.x - item.x, player.y - item.y) >= 0.55) continue;

      if (item.type === ItemType.HEALTH) {
        item.collected = true;
        player.health = Math.min(player.maxHealth, player.health + item.value);
        this.audio.playPickup();
        this.showMessage(`+${item.value} Health`);
      } else if (item.type === ItemType.AMMO) {
        item.collected = true;
        for (const weapon of player.weapons) {
          if (weapon.ammoCapacity !== Infinity) {
            weapon.currentAmmo = Math.min(weapon.ammoCapacity, weapon.currentAmmo + item.value);
          }
        }
        this.audio.playPickup();
        this.showMessage(`+${item.value} Ammo`);
      } else if (item.type === ItemType.WEAPON && item.weaponId) {
        const def = WEAPONS.find((weapon) => weapon.id === item.weaponId);
        if (def) {
          item.collected = true;
          this.player.addWeapon(def);
          this.player.switchToWeapon(def.id);
          this.audio.playPickup();
          this.showMessage(`Got ${def.name}`);
        }
      }
    }
  }

  private checkExit() {
    if (!this.player) return;
    const level = LEVELS[this.currentLevelIdx];
    const exitX = level.exitPos.x + 0.5;
    const exitY = level.exitPos.y + 0.5;
    const boss = this.enemyAI.enemies.find((enemy) => enemy.isBoss);
    const bossDead = !boss || boss.state === EnemyState.DEAD;

    if (bossDead && Math.hypot(this.player.state.x - exitX, this.player.state.y - exitY) < 0.75) {
      this.screen = GameScreen.LEVEL_COMPLETE;
      if (!this.completedLevels.includes(this.currentLevelIdx)) this.completedLevels.push(this.currentLevelIdx);
      if (this.player.state.score > this.highScore) this.highScore = this.player.state.score;
      this.audio.stopMusic();
      this.saveGame();
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) this.particles.splice(i, 1);
    }
  }

  showMessage(text: string) {
    this.messageText = text;
    this.messageTimer = 2;
  }

  // ---- Rendering ----
  private render() {
    this.ctx.clearRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

    const shouldRenderWorld = this.player && this.map.length > 0 && this.screen !== GameScreen.MAIN_MENU && this.screen !== GameScreen.OPTIONS && this.screen !== GameScreen.BRIEFING;
    if (!shouldRenderWorld || !this.player) {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
      return;
    }

    this.pixels.fill(0);
    this.depthBuffer.fill(Infinity);

    this.renderFloorCeiling();
    this.renderWalls();
    this.renderSprites();

    let shakeX = 0;
    let shakeY = 0;
    if (this.shake.timer > 0) {
      shakeX = (Math.random() - 0.5) * this.shake.intensity;
      shakeY = (Math.random() - 0.5) * this.shake.intensity;
    }

    this.ctx.putImageData(this.imageData, shakeX, shakeY);
    this.renderParticles();
    this.renderWeaponView();
    this.renderHUD();
    this.renderDebugOverlay();

    if (this.player.state.damageFlash > 0) {
      const alpha = Math.min(0.45, this.player.state.damageFlash * 1.4);
      this.ctx.fillStyle = `rgba(185, 20, 20, ${alpha})`;
      this.ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
    }
  }

  private renderFloorCeiling() {
    if (!this.player) return;

    const state = this.player.state;
    const camera = buildCameraBasis(state.angle);
    const horizon = this.getHorizonY();
    const floorTex = getFloorTexture();
    const ceilTex = getCeilingTexture();

    const rayDirX0 = camera.dirX - camera.planeX;
    const rayDirY0 = camera.dirY - camera.planeY;
    const rayDirX1 = camera.dirX + camera.planeX;
    const rayDirY1 = camera.dirY + camera.planeY;

    for (let y = 0; y < RENDER_HEIGHT; y++) {
      const isFloor = y > horizon;
      const p = isFloor ? y - horizon : horizon - y;
      if (p < 0.0001) continue;

      const rowDistance = (CAMERA_HEIGHT_TILES * camera.projectionPlaneDistance) / p;
      if (rowDistance > this.settings.renderDistance + 1) continue;

      const stepX = (rowDistance * (rayDirX1 - rayDirX0)) / RENDER_WIDTH;
      const stepY = (rowDistance * (rayDirY1 - rayDirY0)) / RENDER_WIDTH;
      let worldX = state.x + rowDistance * rayDirX0;
      let worldY = state.y + rowDistance * rayDirY0;
      const light = Math.max(0.28, 1 - rowDistance / this.settings.renderDistance);
      const tex = isFloor ? floorTex : ceilTex;
      const shade = isFloor ? 1 : 0.72;

      for (let x = 0; x < RENDER_WIDTH; x++) {
        const fracX = ((worldX % 1) + 1) % 1;
        const fracY = ((worldY % 1) + 1) % 1;
        const tx = Math.min(TEX_SIZE - 1, Math.floor(fracX * TEX_SIZE));
        const ty = Math.min(TEX_SIZE - 1, Math.floor(fracY * TEX_SIZE));
        const texIdx = (ty * TEX_SIZE + tx) * 4;
        const idx = (y * RENDER_WIDTH + x) * 4;

        this.pixels[idx] = Math.floor(tex[texIdx] * light * shade);
        this.pixels[idx + 1] = Math.floor(tex[texIdx + 1] * light * shade);
        this.pixels[idx + 2] = Math.floor(tex[texIdx + 2] * light * shade);
        this.pixels[idx + 3] = 255;

        worldX += stepX;
        worldY += stepY;
      }
    }
  }

  private renderWalls() {
    if (!this.player) return;

    const state = this.player.state;
    const camera = buildCameraBasis(state.angle);
    const horizon = this.getHorizonY();
    const sampleColumns = [Math.floor(RENDER_WIDTH * 0.2), Math.floor(RENDER_WIDTH * 0.5), Math.floor(RENDER_WIDTH * 0.8)];

    for (let x = 0; x < RENDER_WIDTH; x++) {
      const cameraX = (2 * x) / RENDER_WIDTH - 1;
      const rayDirX = camera.dirX + camera.planeX * cameraX;
      const rayDirY = camera.dirY + camera.planeY * cameraX;
      const hit = castRay(this.map, state.x, state.y, rayDirX, rayDirY, this.settings.renderDistance);

      if (!hit.hit || hit.distance <= 0.0001) {
        this.depthBuffer[x] = Infinity;
        continue;
      }

      this.depthBuffer[x] = hit.distance;
      if (x === sampleColumns[0]) this.raySamples[0] = hit.distance * TILE_SIZE;
      if (x === sampleColumns[1]) this.raySamples[1] = hit.distance * TILE_SIZE;
      if (x === sampleColumns[2]) this.raySamples[2] = hit.distance * TILE_SIZE;

      const top = horizon - (TOP_FROM_CAMERA_TILES / hit.distance) * camera.projectionPlaneDistance;
      const bottom = horizon + (BOTTOM_FROM_CAMERA_TILES / hit.distance) * camera.projectionPlaneDistance;
      const projectedHeight = Math.max(1, bottom - top);
      const drawStart = Math.max(0, Math.floor(top));
      const drawEnd = Math.min(RENDER_HEIGHT - 1, Math.ceil(bottom));

      const texture = getWallTexture(hit.wallType || WallType.RED_BRICK);
      const light = Math.max(0.25, 1 - hit.distance / this.settings.renderDistance) * (hit.side === 1 ? 0.82 : 1);

      for (let y = drawStart; y <= drawEnd; y++) {
        const texY = Math.min(TEX_SIZE - 1, Math.max(0, Math.floor(((y - top) / projectedHeight) * TEX_SIZE)));
        const texIdx = (texY * TEX_SIZE + hit.texX) * 4;
        const idx = (y * RENDER_WIDTH + x) * 4;

        this.pixels[idx] = Math.floor(texture[texIdx] * light);
        this.pixels[idx + 1] = Math.floor(texture[texIdx + 1] * light);
        this.pixels[idx + 2] = Math.floor(texture[texIdx + 2] * light);
        this.pixels[idx + 3] = 255;
      }
    }
  }

  private renderSprites() {
    if (!this.player) return;

    const state = this.player.state;
    const camera = buildCameraBasis(state.angle);
    const horizon = this.getHorizonY();
    const sprites: RenderSprite[] = [];

    for (const enemy of this.enemyAI.enemies) {
      if (enemy.state === EnemyState.DEAD && enemy.deathTimer > 3) continue;
      const dead = enemy.state === EnemyState.DEAD;
      sprites.push({
        x: enemy.x,
        y: enemy.y,
        tex: getEnemySprite(enemy.def.spriteColor, enemy.def.spriteAccent, enemy.isBoss),
        widthUnits: enemy.isBoss ? 36 : Math.max(28, enemy.def.size * TILE_SIZE * 1.15),
        heightUnits: dead ? 28 : enemy.isBoss ? 56 : 52,
        liftUnits: 0,
        hitFlash: enemy.hitFlash,
      });
    }

    for (const item of this.items) {
      if (item.collected) continue;
      const bobLift = 5 + Math.sin(item.bobTimer) * 2.5;
      const spriteType = this.itemTypeToSprite(item.type);
      sprites.push({
        x: item.x,
        y: item.y,
        tex: getItemSprite(spriteType),
        widthUnits: 24,
        heightUnits: 24,
        liftUnits: bobLift,
      });
    }

    for (const prop of this.props) {
      const dims = this.getPropDimensions(prop.type);
      sprites.push({
        x: prop.x,
        y: prop.y,
        tex: getPropSprite(prop.type),
        widthUnits: dims.width,
        heightUnits: dims.height,
        liftUnits: 0,
      });
    }

    sprites.sort((a, b) => ((b.x - state.x) ** 2 + (b.y - state.y) ** 2) - ((a.x - state.x) ** 2 + (a.y - state.y) ** 2));

    const invDet = 1 / (camera.planeX * camera.dirY - camera.dirX * camera.planeY);

    for (const sprite of sprites) {
      const spriteX = sprite.x - state.x;
      const spriteY = sprite.y - state.y;
      const transformX = invDet * (camera.dirY * spriteX - camera.dirX * spriteY);
      const transformY = invDet * (-camera.planeY * spriteX + camera.planeX * spriteY);

      if (transformY <= 0.05 || transformY > this.settings.renderDistance) continue;

      const spriteScreenX = Math.floor(RENDER_WIDTH / 2 * (1 + transformX / transformY));
      const distanceWorld = transformY * TILE_SIZE;
      const spriteHeight = Math.max(1, (sprite.heightUnits / distanceWorld) * camera.projectionPlaneDistance);
      const spriteWidth = Math.max(1, (sprite.widthUnits / distanceWorld) * camera.projectionPlaneDistance);
      const bottom = horizon + ((CAMERA_HEIGHT - sprite.liftUnits) / distanceWorld) * camera.projectionPlaneDistance;
      const top = bottom - spriteHeight;
      const left = spriteScreenX - spriteWidth / 2;
      const right = spriteScreenX + spriteWidth / 2;
      const drawStartX = Math.max(0, Math.floor(left));
      const drawEndX = Math.min(RENDER_WIDTH - 1, Math.ceil(right));
      const drawStartY = Math.max(0, Math.floor(top));
      const drawEndY = Math.min(RENDER_HEIGHT - 1, Math.ceil(bottom));
      const light = Math.max(0.28, 1 - transformY / this.settings.renderDistance);
      const hitFlash = sprite.hitFlash || 0;

      for (let stripe = drawStartX; stripe <= drawEndX; stripe++) {
        if (transformY >= this.depthBuffer[stripe] - 0.0001) continue;
        const texX = Math.min(TEX_SIZE - 1, Math.max(0, Math.floor(((stripe - left) / spriteWidth) * TEX_SIZE)));

        for (let y = drawStartY; y <= drawEndY; y++) {
          const texY = Math.min(TEX_SIZE - 1, Math.max(0, Math.floor(((y - top) / spriteHeight) * TEX_SIZE)));
          const texIdx = (texY * TEX_SIZE + texX) * 4;
          const alpha = sprite.tex[texIdx + 3];
          if (alpha < 20) continue;

          const idx = (y * RENDER_WIDTH + stripe) * 4;
          const r = sprite.tex[texIdx];
          const g = sprite.tex[texIdx + 1];
          const b = sprite.tex[texIdx + 2];
          this.pixels[idx] = Math.min(255, Math.floor((r + hitFlash * 180) * light));
          this.pixels[idx + 1] = Math.min(255, Math.floor((g + hitFlash * 70) * light));
          this.pixels[idx + 2] = Math.min(255, Math.floor((b + hitFlash * 70) * light));
          this.pixels[idx + 3] = 255;
        }
      }
    }
  }

  private renderParticles() {
    if (!this.player) return;

    const state = this.player.state;
    const camera = buildCameraBasis(state.angle);
    const invDet = 1 / (camera.planeX * camera.dirY - camera.dirX * camera.planeY);
    const horizon = this.getHorizonY();

    for (const particle of this.particles) {
      const px = particle.x - state.x;
      const py = particle.y - state.y;
      const transformX = invDet * (camera.dirY * px - camera.dirX * py);
      const transformY = invDet * (-camera.planeY * px + camera.planeX * py);
      if (transformY <= 0.05 || transformY > this.settings.renderDistance) continue;

      const x = RENDER_WIDTH / 2 * (1 + transformX / transformY);
      const y = horizon;
      const size = Math.max(1, (particle.size / Math.max(0.25, transformY)) * 0.75);
      this.ctx.globalAlpha = particle.life / particle.maxLife;
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(size), Math.ceil(size));
    }
    this.ctx.globalAlpha = 1;
  }

  private renderWeaponView() {
    if (!this.player) return;

    const state = this.player.state;
    const weapon = this.player.getCurrentWeapon();
    const source = this.getCanvasForTexture(`weapon:${weapon.id}`, getWeaponSprite(weapon.id));
    const bobX = Math.cos(state.bobPhase) * 6;
    const bobY = Math.abs(Math.sin(state.bobPhase)) * 4;
    const recoil = weapon.recoilOffset * 12;
    const width = weapon.id === 'knife' ? 160 : 210;
    const height = weapon.id === 'knife' ? 160 : 210;
    const x = RENDER_WIDTH / 2 - width / 2 + bobX;
    const y = RENDER_HEIGHT - height + 72 + bobY + recoil;

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(source, Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));

    if (weapon.recoilOffset > 0.45 && weapon.id !== 'knife') {
      this.ctx.fillStyle = `rgba(255, 214, 92, ${weapon.recoilOffset})`;
      this.ctx.beginPath();
      this.ctx.arc(RENDER_WIDTH / 2, y + 34, 16 * weapon.recoilOffset, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    this.ctx.lineWidth = 1;
    const cx = RENDER_WIDTH / 2;
    const cy = RENDER_HEIGHT / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 7, cy); this.ctx.lineTo(cx - 2, cy);
    this.ctx.moveTo(cx + 2, cy); this.ctx.lineTo(cx + 7, cy);
    this.ctx.moveTo(cx, cy - 7); this.ctx.lineTo(cx, cy - 2);
    this.ctx.moveTo(cx, cy + 2); this.ctx.lineTo(cx, cy + 7);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private renderHUD() {
    if (!this.player) return;

    const state = this.player.state;
    const weapon = this.player.getCurrentWeapon();

    this.ctx.fillStyle = 'rgba(0,0,0,0.72)';
    this.ctx.fillRect(0, RENDER_HEIGHT - 54, RENDER_WIDTH, 54);
    this.ctx.fillStyle = '#8b1010';
    this.ctx.fillRect(0, RENDER_HEIGHT - 54, RENDER_WIDTH, 2);

    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('HP', 10, RENDER_HEIGHT - 33);

    const hpRatio = state.health / state.maxHealth;
    this.ctx.fillStyle = '#232323';
    this.ctx.fillRect(35, RENDER_HEIGHT - 41, 126, 14);
    this.ctx.fillStyle = hpRatio > 0.5 ? '#32c832' : hpRatio > 0.25 ? '#d2a62a' : '#d23c3c';
    this.ctx.fillRect(35, RENDER_HEIGHT - 41, 126 * hpRatio, 14);
    this.ctx.strokeStyle = '#666';
    this.ctx.strokeRect(35, RENDER_HEIGHT - 41, 126, 14);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillText(`${Math.ceil(state.health)}`, 48, RENDER_HEIGHT - 30);

    this.ctx.textAlign = 'right';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('AMMO', RENDER_WIDTH - 10, RENDER_HEIGHT - 33);
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillStyle = weapon.ammoCapacity === Infinity || weapon.currentAmmo > 0 ? '#ffffff' : '#d23c3c';
    this.ctx.fillText(weapon.ammoCapacity === Infinity ? '∞' : `${weapon.currentAmmo}`, RENDER_WIDTH - 10, RENDER_HEIGHT - 14);

    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillStyle = '#dddddd';
    // Handle both emoji strings and image sprites for weapon icon
    if (typeof weapon.icon === 'string') {
      this.ctx.fillText(`${weapon.icon} ${weapon.name}`, RENDER_WIDTH / 2, RENDER_HEIGHT - 14);
    } else if (weapon.icon instanceof HTMLImageElement && weapon.icon.complete) {
      // Draw weapon sprite image centered above name
      const imgWidth = 48;
      const imgHeight = 32;
      this.ctx.drawImage(weapon.icon, RENDER_WIDTH / 2 - imgWidth / 2, RENDER_HEIGHT - 50, imgWidth, imgHeight);
      this.ctx.fillText(weapon.name, RENDER_WIDTH / 2, RENDER_HEIGHT - 14);
    } else {
      this.ctx.fillText(weapon.name, RENDER_WIDTH / 2, RENDER_HEIGHT - 14);
    }

    this.ctx.textAlign = 'left';
    this.ctx.font = '11px monospace';
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.fillText(`Score: ${state.score}`, 10, RENDER_HEIGHT - 45);

    this.ctx.textAlign = 'right';
    this.ctx.fillText(LEVELS[this.currentLevelIdx].name, RENDER_WIDTH - 10, RENDER_HEIGHT - 45);

    if (weapon.isReloading) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
      this.ctx.fillRect(RENDER_WIDTH / 2 - 64, RENDER_HEIGHT - 86, 128, 20);
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillText('RELOADING...', RENDER_WIDTH / 2, RENDER_HEIGHT - 72);
    }

    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer);
      this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this.ctx.font = 'bold 16px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.messageText, RENDER_WIDTH / 2, RENDER_HEIGHT / 3);
    }

    if (this.showMinimap) this.renderMinimap();
  }

  private renderMinimap() {
    if (!this.player) return;
    const state = this.player.state;
    const mapSize = 108;
    const cell = mapSize / Math.max(this.map.length, this.map[0]?.length || 1);
    const ox = RENDER_WIDTH - mapSize - 12;
    const oy = 12;

    this.ctx.fillStyle = 'rgba(0,0,0,0.64)';
    this.ctx.fillRect(ox - 2, oy - 2, mapSize + 4, mapSize + 4);

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[0].length; x++) {
        if (this.map[y][x] === WallType.EMPTY) continue;
        this.ctx.fillStyle = this.map[y][x] === WallType.METAL_DOOR ? '#8d8da2' : '#5b5b5b';
        this.ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }

    for (const prop of this.props) {
      this.ctx.fillStyle = '#b98b52';
      this.ctx.fillRect(ox + prop.x * cell - 1, oy + prop.y * cell - 1, 3, 3);
    }

    for (const item of this.items) {
      if (item.collected) continue;
      this.ctx.fillStyle = item.type === ItemType.HEALTH ? '#38d038' : '#ffd34a';
      this.ctx.fillRect(ox + item.x * cell - 1, oy + item.y * cell - 1, 3, 3);
    }

    for (const enemy of this.enemyAI.getActiveEnemies()) {
      this.ctx.fillStyle = enemy.isBoss ? '#ff3030' : '#cc5050';
      this.ctx.fillRect(ox + enemy.x * cell - 1, oy + enemy.y * cell - 1, 3, 3);
    }

    this.ctx.fillStyle = '#00ff66';
    this.ctx.fillRect(ox + state.x * cell - 2, oy + state.y * cell - 2, 4, 4);
    this.ctx.strokeStyle = '#00ff66';
    this.ctx.beginPath();
    this.ctx.moveTo(ox + state.x * cell, oy + state.y * cell);
    this.ctx.lineTo(ox + (state.x + Math.cos(state.angle) * 2) * cell, oy + (state.y + Math.sin(state.angle) * 2) * cell);
    this.ctx.stroke();
  }

  private renderDebugOverlay() {
    if (!this.player || !this.showDebug) return;

    const state = this.player.state;
    const camera = buildCameraBasis(state.angle);
    const tileX = Math.floor(state.x);
    const tileY = Math.floor(state.y);

    this.ctx.fillStyle = 'rgba(0,0,0,0.72)';
    this.ctx.fillRect(10, 10, 230, 94);
    this.ctx.strokeStyle = '#3d3d3d';
    this.ctx.strokeRect(10, 10, 230, 94);
    this.ctx.fillStyle = '#8ee38e';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`POS  ${Math.round(state.x * TILE_SIZE)}, ${Math.round(state.y * TILE_SIZE)} wu`, 18, 28);
    this.ctx.fillText(`TILE ${tileX}, ${tileY}`, 18, 43);
    this.ctx.fillText(`ANG  ${(state.angle * 180 / Math.PI).toFixed(1)}°`, 18, 58);
    this.ctx.fillText(`FOV  ${(camera.horizontalFov * 180 / Math.PI).toFixed(1)}° x ${(camera.verticalFov * 180 / Math.PI).toFixed(1)}°`, 18, 73);
    this.ctx.fillText(`RAYS L/C/R ${this.raySamples.map((d) => d.toFixed(0)).join(' / ')} wu`, 18, 88);
  }

  // ---- Helpers ----
  private getHorizonY(): number {
    if (!this.player) return RENDER_HEIGHT / 2;
    const state = this.player.state;
    return RENDER_HEIGHT / 2 + Math.sin(state.bobPhase) * (state.isSprinting ? 2 : 1.25);
  }

  private toItemType(type: string): ItemType {
    switch (type.toLowerCase()) {
      case 'health': return ItemType.HEALTH;
      case 'ammo': return ItemType.AMMO;
      case 'weapon': return ItemType.WEAPON;
      default: return ItemType.KEY;
    }
  }

  private itemTypeToSprite(type: ItemType): string {
    switch (type) {
      case ItemType.HEALTH: return 'health';
      case ItemType.AMMO: return 'ammo';
      case ItemType.WEAPON: return 'weapon';
      default: return 'exit';
    }
  }

  private getPropDimensions(type: LevelProp['type']): { width: number; height: number } {
    if (type === 'barrel') return { width: 28, height: 34 };
    if (type === 'table') return { width: 40, height: 24 };
    return { width: 22, height: 40 };
  }

  private spawnImpactParticles(x: number, y: number, color: string, count: number, life: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2.8,
        vy: (Math.random() - 0.5) * 2.8,
        life,
        maxLife: life,
        color,
        size: 3,
      });
    }
  }

  private getCanvasForTexture(key: string, texture: Uint8Array): HTMLCanvasElement {
    const cached = this.textureCanvasCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d')!;
    const image = ctx.createImageData(TEX_SIZE, TEX_SIZE);
    image.data.set(texture);
    ctx.putImageData(image, 0, 0);
    this.textureCanvasCache.set(key, canvas);
    return canvas;
  }
}
