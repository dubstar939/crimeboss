// ============================================================
// Little Italy: Turf Wars — Procedural Texture Generator
// Generates all wall, floor, ceiling, and sprite textures
// ============================================================

import { TEX_SIZE, WallType, PropType } from './types';

// Cache for generated textures
const textureCache = new Map<number, Uint8Array>();
const spriteCache = new Map<string, Uint8Array>();

// ---- Utility ----
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hash(x: number, y: number, seed: number): number {
  const h = (x * 374761393 + y * 668265263 + seed * 1274126177) & 0x7fffffff;
  return (h % 256) / 255;
}

function noise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy, seed);
  const n10 = hash(ix + 1, iy, seed);
  const n01 = hash(ix, iy + 1, seed);
  const n11 = hash(ix + 1, iy + 1, seed);
  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;
  return nx0 * (1 - sy) + nx1 * sy;
}

function createTexture(draw: (ctx: CanvasRenderingContext2D) => void): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  return new Uint8Array(ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE).data);
}

// ---- Wall Textures ----

function genRedBrick(): Uint8Array {
  return createTexture((ctx) => {
    // Mortar background
    ctx.fillStyle = '#6b6b6b';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Brick rows
    const brickH = 10;
    const brickW = 20;
    for (let row = 0; row < TEX_SIZE / brickH + 1; row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      for (let col = -1; col < TEX_SIZE / brickW + 1; col++) {
        const x = col * brickW + offset;
        const y = row * brickH;
        // Slight color variation
        const r = 140 + Math.floor(Math.random() * 40);
        const g = 50 + Math.floor(Math.random() * 20);
        const b = 40 + Math.floor(Math.random() * 15);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);
      }
    }
    // Add subtle noise
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 15;
      imgData.data[i] = clamp(imgData.data[i] + n, 0, 255);
      imgData.data[i + 1] = clamp(imgData.data[i + 1] + n, 0, 255);
      imgData.data[i + 2] = clamp(imgData.data[i + 2] + n, 0, 255);
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

function genBrownBrick(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    const brickH = 12;
    const brickW = 24;
    for (let row = 0; row < TEX_SIZE / brickH + 1; row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      for (let col = -1; col < TEX_SIZE / brickW + 1; col++) {
        const x = col * brickW + offset;
        const y = row * brickH;
        const r = 100 + Math.floor(Math.random() * 30);
        const g = 70 + Math.floor(Math.random() * 20);
        const b = 45 + Math.floor(Math.random() * 15);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);
      }
    }
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 12;
      imgData.data[i] = clamp(imgData.data[i] + n, 0, 255);
      imgData.data[i + 1] = clamp(imgData.data[i + 1] + n, 0, 255);
      imgData.data[i + 2] = clamp(imgData.data[i + 2] + n, 0, 255);
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

function genStone(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Irregular stone blocks
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * TEX_SIZE;
      const y = Math.random() * TEX_SIZE;
      const w = 12 + Math.random() * 16;
      const h = 10 + Math.random() * 14;
      const v = 90 + Math.floor(Math.random() * 50);
      ctx.fillStyle = `rgb(${v},${v},${v + 5})`;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 20;
      imgData.data[i] = clamp(imgData.data[i] + n, 0, 255);
      imgData.data[i + 1] = clamp(imgData.data[i + 1] + n, 0, 255);
      imgData.data[i + 2] = clamp(imgData.data[i + 2] + n, 0, 255);
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

function genWood(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Wood grain
    for (let y = 0; y < TEX_SIZE; y++) {
      const v = 80 + Math.floor(noise(y * 0.3, 0, 42) * 50);
      ctx.fillStyle = `rgb(${v + 30},${v},${v - 20})`;
      ctx.fillRect(0, y, TEX_SIZE, 1);
    }
    // Knots
    for (let i = 0; i < 3; i++) {
      const kx = Math.random() * TEX_SIZE;
      const ky = Math.random() * TEX_SIZE;
      ctx.fillStyle = '#3a2210';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function genMetalDoor(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Horizontal panels
    for (let y = 0; y < TEX_SIZE; y += 16) {
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(2, y + 2, TEX_SIZE - 4, 12);
      ctx.fillStyle = '#6a6a7a';
      ctx.fillRect(2, y + 2, TEX_SIZE - 4, 2);
    }
    // Rivets
    ctx.fillStyle = '#8a8a9a';
    for (let y = 8; y < TEX_SIZE; y += 16) {
      ctx.beginPath();
      ctx.arc(8, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(TEX_SIZE - 8, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Handle
    ctx.fillStyle = '#aaa';
    ctx.fillRect(TEX_SIZE - 14, TEX_SIZE / 2 - 6, 4, 12);
    ctx.beginPath();
    ctx.arc(TEX_SIZE - 12, TEX_SIZE / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function genDarkBrick(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    const brickH = 10;
    const brickW = 20;
    for (let row = 0; row < TEX_SIZE / brickH + 1; row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      for (let col = -1; col < TEX_SIZE / brickW + 1; col++) {
        const x = col * brickW + offset;
        const y = row * brickH;
        const v = 30 + Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);
      }
    }
  });
}

function genMarble(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#d4c8b0';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Marble veins
    ctx.strokeStyle = '#a09080';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = Math.random() * TEX_SIZE;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < TEX_SIZE) {
        x += (Math.random() - 0.5) * 8;
        y += 4 + Math.random() * 4;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Subtle noise
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      imgData.data[i] = clamp(imgData.data[i] + n, 0, 255);
      imgData.data[i + 1] = clamp(imgData.data[i + 1] + n, 0, 255);
      imgData.data[i + 2] = clamp(imgData.data[i + 2] + n, 0, 255);
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

// ---- Floor & Ceiling ----

function genFloor(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Cobblestone pattern
    const size = 16;
    for (let y = 0; y < TEX_SIZE; y += size) {
      for (let x = 0; x < TEX_SIZE; x += size) {
        const offset = (Math.floor(y / size) % 2) * (size / 2);
        const v = 45 + Math.floor(Math.random() * 25);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x + offset + 1, y + 1, size - 2, size - 2);
      }
    }
  });
}

function genCeiling(): Uint8Array {
  return createTexture((ctx) => {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Plaster texture
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 15;
      imgData.data[i] = clamp(imgData.data[i] + n, 0, 255);
      imgData.data[i + 1] = clamp(imgData.data[i + 1] + n, 0, 255);
      imgData.data[i + 2] = clamp(imgData.data[i + 2] + n, 0, 255);
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

// ---- Sprite Textures ----

function genEnemySprite(color: string, accent: string, isBoss: boolean): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;
    const scale = isBoss ? 1.1 : 1.0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(s / 2, s - 4, 14 * scale, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#222';
    ctx.fillRect(s / 2 - 8 * scale, s * 0.72, 6 * scale, s * 0.26);
    ctx.fillRect(s / 2 + 2 * scale, s * 0.72, 6 * scale, s * 0.26);

    // Body (suit)
    ctx.fillStyle = color;
    ctx.fillRect(s / 2 - 12 * scale, s * 0.35, 24 * scale, s * 0.4);

    // Tie
    ctx.fillStyle = accent;
    ctx.fillRect(s / 2 - 2 * scale, s * 0.38, 4 * scale, s * 0.15);

    // Arms
    ctx.fillStyle = color;
    ctx.fillRect(s / 2 - 16 * scale, s * 0.38, 5 * scale, s * 0.25);
    ctx.fillRect(s / 2 + 11 * scale, s * 0.38, 5 * scale, s * 0.25);

    // Hands
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(s / 2 - 16 * scale, s * 0.6, 5 * scale, 4 * scale);
    ctx.fillRect(s / 2 + 11 * scale, s * 0.6, 5 * scale, 4 * scale);

    // Gun in right hand
    ctx.fillStyle = '#333';
    ctx.fillRect(s / 2 + 13 * scale, s * 0.55, 8 * scale, 3 * scale);

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(s / 2, s * 0.28, 8 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Fedora
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(s / 2 - 10 * scale, s * 0.2, 20 * scale, 4 * scale);
    ctx.fillRect(s / 2 - 6 * scale, s * 0.12, 12 * scale, 10 * scale);

    // Fedora band
    ctx.fillStyle = accent;
    ctx.fillRect(s / 2 - 6 * scale, s * 0.24, 12 * scale, 2 * scale);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(s / 2 - 4 * scale, s * 0.27, 2 * scale, 2 * scale);
    ctx.fillRect(s / 2 + 2 * scale, s * 0.27, 2 * scale, 2 * scale);
  });
}

function genItemSprite(type: string): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;
    const cx = s / 2;
    const cy = s / 2;

    if (type === 'health') {
      // Medkit
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(cx - 14, cy - 10, 28, 20);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 2, cy - 8, 4, 16);
      ctx.fillRect(cx - 8, cy - 2, 16, 4);
    } else if (type === 'ammo') {
      // Ammo box
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(cx - 12, cy - 8, 24, 16);
      ctx.fillStyle = '#6B5335';
      ctx.fillRect(cx - 12, cy - 8, 24, 4);
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AMMO', cx, cy + 5);
    } else if (type === 'weapon') {
      // Weapon crate
      ctx.fillStyle = '#556B2F';
      ctx.fillRect(cx - 14, cy - 10, 28, 20);
      ctx.fillStyle = '#3B4B1F';
      ctx.fillRect(cx - 14, cy - 10, 28, 4);
      ctx.fillStyle = '#FFD700';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WEAPON', cx, cy + 5);
    } else if (type === 'exit') {
      // Exit sign
      ctx.fillStyle = '#22cc22';
      ctx.fillRect(cx - 16, cy - 12, 32, 24);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', cx, cy + 4);
    }

    // Glow effect
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function genPropSprite(type: PropType): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;
    const cx = s / 2;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, s - 5, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'barrel') {
      ctx.fillStyle = '#704a2a';
      ctx.fillRect(cx - 12, 18, 24, 34);
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(cx - 14, 22, 28, 4);
      ctx.fillRect(cx - 14, 42, 28, 4);
      ctx.fillStyle = '#2d2d2d';
      ctx.fillRect(cx - 13, 20, 26, 2);
      ctx.fillRect(cx - 13, 44, 26, 2);
    } else if (type === 'table') {
      ctx.fillStyle = '#6b4527';
      ctx.fillRect(cx - 18, 22, 36, 8);
      ctx.fillRect(cx - 15, 30, 4, 22);
      ctx.fillRect(cx + 11, 30, 4, 22);
      ctx.fillStyle = '#8b5c36';
      ctx.fillRect(cx - 18, 20, 36, 3);
    } else if (type === 'lamp') {
      ctx.fillStyle = '#2d2d2d';
      ctx.fillRect(cx - 2, 20, 4, 28);
      ctx.fillStyle = '#e8d28a';
      ctx.beginPath();
      ctx.arc(cx, 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 120, 0.18)';
      ctx.beginPath();
      ctx.arc(cx, 18, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5b4b24';
      ctx.fillRect(cx - 8, 12, 16, 8);
    }
  });
}

function genWeaponSprite(weaponId: string): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;

    if (weaponId === 'knife') {
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(s / 2, 8);
      ctx.lineTo(s / 2 + 4, 30);
      ctx.lineTo(s / 2 - 4, 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#553311';
      ctx.fillRect(s / 2 - 3, 30, 6, 12);
    } else if (weaponId === 'pistol') {
      ctx.fillStyle = '#333';
      ctx.fillRect(s / 2 - 3, 10, 6, 24);
      ctx.fillRect(s / 2 - 6, 34, 12, 16);
      ctx.fillStyle = '#553311';
      ctx.fillRect(s / 2 - 5, 38, 10, 12);
    } else if (weaponId === 'revolver') {
      ctx.fillStyle = '#444';
      ctx.fillRect(s / 2 - 3, 8, 6, 22);
      ctx.beginPath();
      ctx.arc(s / 2, 34, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#553311';
      ctx.fillRect(s / 2 - 5, 38, 10, 14);
    } else if (weaponId === 'tommygun') {
      ctx.fillStyle = '#333';
      ctx.fillRect(s / 2 - 2, 6, 4, 36);
      ctx.fillRect(s / 2 - 8, 42, 16, 10);
      ctx.fillStyle = '#553311';
      ctx.fillRect(s / 2 - 6, 52, 12, 8);
      ctx.fillStyle = '#444';
      ctx.fillRect(s / 2 - 1, 2, 2, 6);
    } else if (weaponId === 'shotgun') {
      ctx.fillStyle = '#444';
      ctx.fillRect(s / 2 - 4, 6, 8, 30);
      ctx.fillStyle = '#553311';
      ctx.fillRect(s / 2 - 6, 36, 12, 18);
      ctx.fillStyle = '#333';
      ctx.fillRect(s / 2 - 3, 2, 6, 6);
    }
  });
}

// ---- Public API ----

export function getWallTexture(type: WallType): Uint8Array {
  if (!textureCache.has(type)) {
    switch (type) {
      case WallType.RED_BRICK: textureCache.set(type, genRedBrick()); break;
      case WallType.BROWN_BRICK: textureCache.set(type, genBrownBrick()); break;
      case WallType.STONE: textureCache.set(type, genStone()); break;
      case WallType.WOOD: textureCache.set(type, genWood()); break;
      case WallType.METAL_DOOR: textureCache.set(type, genMetalDoor()); break;
      case WallType.DARK_BRICK: textureCache.set(type, genDarkBrick()); break;
      case WallType.MARBLE: textureCache.set(type, genMarble()); break;
    }
  }
  return textureCache.get(type)!;
}

export function getFloorTexture(): Uint8Array {
  if (!textureCache.has(-1)) textureCache.set(-1, genFloor());
  return textureCache.get(-1)!;
}

export function getCeilingTexture(): Uint8Array {
  if (!textureCache.has(-2)) textureCache.set(-2, genCeiling());
  return textureCache.get(-2)!;
}

export function getEnemySprite(color: string, accent: string, isBoss: boolean): Uint8Array {
  const key = `enemy_${color}_${accent}_${isBoss}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, genEnemySprite(color, accent, isBoss));
  }
  return spriteCache.get(key)!;
}

export function getItemSprite(type: string): Uint8Array {
  const key = `item_${type}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, genItemSprite(type));
  }
  return spriteCache.get(key)!;
}

export function getPropSprite(type: PropType): Uint8Array {
  const key = `prop_${type}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, genPropSprite(type));
  }
  return spriteCache.get(key)!;
}

export function getWeaponSprite(weaponId: string): Uint8Array {
  const key = `weapon_${weaponId}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, genWeaponSprite(weaponId));
  }
  return spriteCache.get(key)!;
}
