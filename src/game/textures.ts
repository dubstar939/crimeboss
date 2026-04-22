// ============================================================
// Little Italy: Turf Wars — Texture Loader
// Loads sprite textures from PNG files for 90s FPS aesthetic
// ============================================================

import { TEX_SIZE, WallType, PropType } from './types';

// Import all sprite PNGs
import enemySprite1 from '../components/LDZgviX.png';
import enemySprite2 from '../components/ggp2.png';
import enemySprite3 from '../components/gs.png';

// Animation frames
import ggp2TopFrame0 from '../components/ggp2_top_frame_0.png';
import ggp2TopFrame1 from '../components/ggp2_top_frame_1.png';
import ggp2TopFrame2 from '../components/ggp2_top_frame_2.png';
import ggp2TopFrame3 from '../components/ggp2_top_frame_3.png';
import ggp2BottomFrame0 from '../components/ggp2_bottom_frame_0.png';
import ggp2BottomFrame1 from '../components/ggp2_bottom_frame_1.png';
import ggp2BottomFrame2 from '../components/ggp2_bottom_frame_2.png';
import ggp2BottomFrame3 from '../components/ggp2_bottom_frame_3.png';

// Cache for generated textures (walls, floors, ceilings)
const textureCache = new Map<number, Uint8Array>();

// Cache for loaded sprite textures
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

// Load PNG and convert to Uint8Array at TEX_SIZE
async function loadPngToTexture(src: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
      const data = new Uint8Array(ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE).data);
      resolve(data);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Preload all sprite images on module init
let spritesLoaded = false;
const loadPromises: Promise<void>[] = [];

async function preloadSprite(key: string, src: string): Promise<void> {
  try {
    const data = await loadPngToTexture(src);
    spriteCache.set(key, data);
  } catch (e) {
    console.warn(`Failed to load sprite ${key}:`, e);
  }
}

export async function initializeSprites(): Promise<void> {
  if (spritesLoaded) return;
  spritesLoaded = true;
  
  // Clear any existing cached sprites
  spriteCache.clear();
  
  // Preload all enemy sprites
  loadPromises.push(preloadSprite('enemy_main', enemySprite1));
  loadPromises.push(preloadSprite('enemy_alt1', enemySprite2));
  loadPromises.push(preloadSprite('enemy_alt2', enemySprite3));
  
  // Preload animation frames
  loadPromises.push(preloadSprite('ggp2_top_0', ggp2TopFrame0));
  loadPromises.push(preloadSprite('ggp2_top_1', ggp2TopFrame1));
  loadPromises.push(preloadSprite('ggp2_top_2', ggp2TopFrame2));
  loadPromises.push(preloadSprite('ggp2_top_3', ggp2TopFrame3));
  loadPromises.push(preloadSprite('ggp2_bottom_0', ggp2BottomFrame0));
  loadPromises.push(preloadSprite('ggp2_bottom_1', ggp2BottomFrame1));
  loadPromises.push(preloadSprite('ggp2_bottom_2', ggp2BottomFrame2));
  loadPromises.push(preloadSprite('ggp2_bottom_3', ggp2BottomFrame3));
  
  await Promise.all(loadPromises);
  console.log('[TextureLoader] All sprites preloaded');
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

// Color manipulation helpers for shading
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 128, g: 128, b: 128 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r - amount, g - amount, b - amount);
}

function genEnemySprite(color: string, accent: string, isBoss: boolean): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;
    const scale = isBoss ? 1.15 : 1.0;

    // Shadow - soft diffuse shadow for ground contact
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(s / 2, s - 3, 18 * scale, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs with cylindrical shading and denim/pant texture
    const legBase = '#1f1f2e';
    const legShadow = '#12121a';
    const legHighlight = '#2a2a3d';
    
    // Left leg
    ctx.fillStyle = legBase;
    ctx.fillRect(s / 2 - 10 * scale, s * 0.68, 8 * scale, s * 0.30);
    ctx.fillStyle = legShadow;
    ctx.fillRect(s / 2 - 4 * scale, s * 0.68, 4 * scale, s * 0.30);
    ctx.fillStyle = legHighlight;
    ctx.fillRect(s / 2 - 10 * scale, s * 0.68, 2 * scale, s * 0.30);
    
    // Right leg
    ctx.fillStyle = legBase;
    ctx.fillRect(s / 2 + 2 * scale, s * 0.68, 8 * scale, s * 0.30);
    ctx.fillStyle = legShadow;
    ctx.fillRect(s / 2 + 6 * scale, s * 0.68, 4 * scale, s * 0.30);
    ctx.fillStyle = legHighlight;
    ctx.fillRect(s / 2 + 2 * scale, s * 0.68, 2 * scale, s * 0.30);

    // Shoes
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(s / 2 - 11 * scale, s * 0.94, 10 * scale, 5 * scale);
    ctx.fillRect(s / 2 + 1 * scale, s * 0.94, 10 * scale, 5 * scale);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(s / 2 - 11 * scale, s * 0.94, 10 * scale, 2 * scale);
    ctx.fillRect(s / 2 + 1 * scale, s * 0.94, 10 * scale, 2 * scale);

    // Body (suit) with depth shading and fabric texture suggestion
    const suitMain = color;
    const suitShadow = darkenColor(color, 30);
    const suitShadowDeep = darkenColor(color, 45);
    const suitHighlight = lightenColor(color, 18);
    const suitHighlightSoft = lightenColor(color, 8);
    
    // Main torso with subtle gradient
    ctx.fillStyle = suitMain;
    ctx.fillRect(s / 2 - 14 * scale, s * 0.32, 28 * scale, s * 0.42);
    
    // Shadow side (right side, light from top-left)
    ctx.fillStyle = suitShadow;
    ctx.fillRect(s / 2 + 9 * scale, s * 0.32, 5 * scale, s * 0.42);
    
    // Deep shadow at bottom
    ctx.fillStyle = suitShadowDeep;
    ctx.fillRect(s / 2 - 14 * scale, s * 0.62, 28 * scale, s * 0.12);
    
    // Highlight on left shoulder/chest
    ctx.fillStyle = suitHighlight;
    ctx.fillRect(s / 2 - 14 * scale, s * 0.32, 5 * scale, s * 0.18);
    
    // Subtle highlight transition
    ctx.fillStyle = suitHighlightSoft;
    ctx.fillRect(s / 2 - 9 * scale, s * 0.32, 4 * scale, s * 0.18);

    // Suit lapels (subtle V-shape suggestion)
    ctx.fillStyle = suitShadow;
    ctx.fillRect(s / 2 - 4 * scale, s * 0.35, 3 * scale, s * 0.12);
    ctx.fillRect(s / 2 + 1 * scale, s * 0.35, 3 * scale, s * 0.12);

    // Tie with gradient and knot detail
    const tieMain = accent;
    const tieShadow = darkenColor(accent, 25);
    const tieHighlight = lightenColor(accent, 20);
    
    ctx.fillStyle = tieMain;
    ctx.fillRect(s / 2 - 3 * scale, s * 0.36, 6 * scale, s * 0.20);
    ctx.fillStyle = tieShadow;
    ctx.fillRect(s / 2 + 1 * scale, s * 0.36, 2 * scale, s * 0.20);
    ctx.fillStyle = tieHighlight;
    ctx.fillRect(s / 2 - 3 * scale, s * 0.36, 2 * scale, s * 0.20);
    
    // Tie knot
    ctx.fillStyle = tieShadow;
    ctx.fillRect(s / 2 - 2 * scale, s * 0.34, 4 * scale, 3 * scale);

    // Arms with cylindrical shading
    ctx.fillStyle = suitMain;
    ctx.fillRect(s / 2 - 20 * scale, s * 0.36, 7 * scale, s * 0.30);
    ctx.fillRect(s / 2 + 13 * scale, s * 0.36, 7 * scale, s * 0.30);
    
    // Arm shadows (right side of each arm)
    ctx.fillStyle = suitShadow;
    ctx.fillRect(s / 2 - 15 * scale, s * 0.36, 2 * scale, s * 0.30);
    ctx.fillRect(s / 2 + 18 * scale, s * 0.36, 2 * scale, s * 0.30);
    
    // Arm highlights (left edge)
    ctx.fillStyle = suitHighlight;
    ctx.fillRect(s / 2 - 20 * scale, s * 0.36, 2 * scale, s * 0.30);
    ctx.fillRect(s / 2 + 13 * scale, s * 0.36, 2 * scale, s * 0.30);

    // Shirt cuffs
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(s / 2 - 20 * scale, s * 0.64, 7 * scale, 4 * scale);
    ctx.fillRect(s / 2 + 13 * scale, s * 0.64, 7 * scale, 4 * scale);

    // Hands with skin tone variation and knuckle detail
    const skinBase = '#d4a574';
    const skinShadow = '#b8905f';
    const skinMidShadow = '#c49868';
    const skinHighlight = '#e8b88a';
    
    // Left hand
    ctx.fillStyle = skinBase;
    ctx.fillRect(s / 2 - 20 * scale, s * 0.66, 7 * scale, 6 * scale);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(s / 2 - 15 * scale, s * 0.66, 2 * scale, 6 * scale);
    ctx.fillStyle = skinHighlight;
    ctx.fillRect(s / 2 - 20 * scale, s * 0.66, 2 * scale, 3 * scale);
    
    // Right hand
    ctx.fillStyle = skinBase;
    ctx.fillRect(s / 2 + 13 * scale, s * 0.66, 7 * scale, 6 * scale);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(s / 2 + 18 * scale, s * 0.66, 2 * scale, 6 * scale);
    ctx.fillStyle = skinHighlight;
    ctx.fillRect(s / 2 + 13 * scale, s * 0.66, 2 * scale, 3 * scale);

    // Gun with metallic shading and detail
    const gunMetal = '#2a2a2a';
    const gunDark = '#1a1a1a';
    const gunHighlight = '#4a4a4a';
    const gunBarrel = '#0f0f0f';
    
    // Gun body in right hand
    ctx.fillStyle = gunMetal;
    ctx.fillRect(s / 2 + 17 * scale, s * 0.58, 12 * scale, 5 * scale);
    ctx.fillStyle = gunDark;
    ctx.fillRect(s / 2 + 17 * scale, s * 0.61, 12 * scale, 2 * scale);
    ctx.fillStyle = gunHighlight;
    ctx.fillRect(s / 2 + 17 * scale, s * 0.58, 12 * scale, 1 * scale);
    
    // Barrel extension
    ctx.fillStyle = gunBarrel;
    ctx.fillRect(s / 2 + 27 * scale, s * 0.59, 4 * scale, 4 * scale);

    // Head with spherical shading and facial structure
    const skinBaseHead = '#d4a574';
    const skinShadowHead = '#b8905f';
    const skinHighlightHead = '#e8b88a';
    const skinBrowShadow = 'rgba(180, 140, 90, 0.4)';
    
    // Main head sphere
    ctx.fillStyle = skinBaseHead;
    ctx.beginPath();
    ctx.arc(s / 2, s * 0.26, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Shadow on right/bottom-right side of face
    ctx.fillStyle = skinShadowHead;
    ctx.beginPath();
    ctx.arc(s / 2 + 4 * scale, s * 0.28, 7 * scale, -Math.PI/2, Math.PI/2);
    ctx.fill();
    
    // Highlight on left forehead
    ctx.fillStyle = skinHighlightHead;
    ctx.beginPath();
    ctx.arc(s / 2 - 4 * scale, s * 0.22, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle cheek/nose shading
    ctx.fillStyle = skinMidShadow;
    ctx.fillRect(s / 2 - 2 * scale, s * 0.28, 4 * scale, 5 * scale);

    // Fedora with depth, brim highlights, and band detail
    const hatMain = '#1a1a1a';
    const hatShadow = '#0f0f0f';
    const hatHighlight = '#2a2a2a';
    const hatBand = accent;
    const hatBandHighlight = lightenColor(accent, 30);
    
    // Hat brim (bottom layer)
    ctx.fillStyle = hatMain;
    ctx.fillRect(s / 2 - 12 * scale, s * 0.17, 24 * scale, 6 * scale);
    
    // Hat crown (top part)
    ctx.fillStyle = hatMain;
    ctx.fillRect(s / 2 - 8 * scale, s * 0.09, 16 * scale, 12 * scale);
    
    // Brim highlight (top edge catches light)
    ctx.fillStyle = hatHighlight;
    ctx.fillRect(s / 2 - 12 * scale, s * 0.17, 24 * scale, 2 * scale);
    
    // Crown shadow (right side)
    ctx.fillStyle = hatShadow;
    ctx.fillRect(s / 2 + 4 * scale, s * 0.09, 4 * scale, 12 * scale);
    
    // Fedora band
    ctx.fillStyle = hatBand;
    ctx.fillRect(s / 2 - 8 * scale, s * 0.21, 16 * scale, 3 * scale);
    ctx.fillStyle = hatBandHighlight;
    ctx.fillRect(s / 2 - 8 * scale, s * 0.21, 16 * scale, 1 * scale);
    
    // Hat crease detail
    ctx.fillStyle = hatShadow;
    ctx.fillRect(s / 2 - 3 * scale, s * 0.09, 6 * scale, 2 * scale);

    // Eyes with depth, brow ridge shadow, and glint
    const eyeWhite = '#f0f0f0';
    const eyePupil = '#1a1a1a';
    const eyeGlint = '#ffffff';
    
    // Eye whites (subtle, not too bright)
    ctx.fillStyle = eyeWhite;
    ctx.fillRect(s / 2 - 6 * scale, s * 0.25, 4 * scale, 4 * scale);
    ctx.fillRect(s / 2 + 2 * scale, s * 0.25, 4 * scale, 4 * scale);
    
    // Pupils
    ctx.fillStyle = eyePupil;
    ctx.fillRect(s / 2 - 4 * scale, s * 0.26, 2 * scale, 3 * scale);
    ctx.fillRect(s / 2 + 3 * scale, s * 0.26, 2 * scale, 3 * scale);
    
    // Eye glints (small specular highlights)
    ctx.fillStyle = eyeGlint;
    ctx.fillRect(s / 2 - 4 * scale, s * 0.26, 1 * scale, 1 * scale);
    ctx.fillRect(s / 2 + 3 * scale, s * 0.26, 1 * scale, 1 * scale);
    
    // Brow ridge shadow over eyes
    ctx.fillStyle = skinBrowShadow;
    ctx.fillRect(s / 2 - 7 * scale, s * 0.22, 14 * scale, 3 * scale);

    // Nose suggestion (subtle side shading)
    ctx.fillStyle = skinShadowHead;
    ctx.fillRect(s / 2, s * 0.28, 2 * scale, 4 * scale);
  });
}

function genItemSprite(type: string): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;
    const cx = s / 2;
    const cy = s / 2;

    if (type === 'health') {
      // Medkit with 90s gritty detail
      const medkitRed = '#b82020';
      const medkitDark = '#8a1818';
      const medkitLight = '#d43030';
      
      // Main box body
      ctx.fillStyle = medkitRed;
      ctx.fillRect(cx - 15, cy - 11, 30, 22);
      // Shadow on right/bottom edges
      ctx.fillStyle = medkitDark;
      ctx.fillRect(cx + 10, cy - 11, 5, 22);
      ctx.fillRect(cx - 15, cy + 7, 25, 4);
      // Highlight on top/left edges
      ctx.fillStyle = medkitLight;
      ctx.fillRect(cx - 15, cy - 11, 30, 3);
      ctx.fillRect(cx - 15, cy - 8, 3, 19);
      // White cross with depth
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(cx - 3, cy - 9, 6, 18);
      ctx.fillRect(cx - 9, cy - 3, 18, 6);
      // Cross shadow
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(cx + 2, cy - 9, 1, 18);
      ctx.fillRect(cx - 9, cy + 2, 18, 1);
      // Metallic latch detail
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(cx + 8, cy + 4, 4, 4);
    } else if (type === 'ammo') {
      // Ammo box with weathered metal look
      const ammoBrown = '#7a6345';
      const ammoDark = '#5a4830';
      const ammoLight = '#9a7f5a';
      const rustColor = '#8b5a2b';
      
      // Main box
      ctx.fillStyle = ammoBrown;
      ctx.fillRect(cx - 13, cy - 9, 26, 18);
      // Lid (darker)
      ctx.fillStyle = ammoDark;
      ctx.fillRect(cx - 13, cy - 9, 26, 5);
      // Highlight on lid edge
      ctx.fillStyle = ammoLight;
      ctx.fillRect(cx - 13, cy - 9, 26, 2);
      // Side shading
      ctx.fillStyle = ammoDark;
      ctx.fillRect(cx + 8, cy - 4, 5, 13);
      // Rust spots for weathered look
      ctx.fillStyle = rustColor;
      ctx.fillRect(cx - 8, cy - 2, 2, 2);
      ctx.fillRect(cx + 5, cy + 3, 2, 2);
      ctx.fillRect(cx - 3, cy + 5, 2, 2);
      // "AMMO" stencil text (pixel style)
      ctx.fillStyle = '#c9b080';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AMMO', cx, cy + 4);
    } else if (type === 'weapon') {
      // Weapon crate with military green
      const crateGreen = '#4a5a2a';
      const crateDark = '#3a4820';
      const crateLight = '#5a6a3a';
      
      // Main crate body
      ctx.fillStyle = crateGreen;
      ctx.fillRect(cx - 15, cy - 11, 30, 22);
      // Top panel
      ctx.fillStyle = crateDark;
      ctx.fillRect(cx - 15, cy - 11, 30, 6);
      // Highlight on top edge
      ctx.fillStyle = crateLight;
      ctx.fillRect(cx - 15, cy - 11, 30, 2);
      // Corner reinforcements (metal)
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(cx - 15, cy - 11, 4, 4);
      ctx.fillRect(cx + 11, cy - 11, 4, 4);
      ctx.fillRect(cx - 15, cy + 7, 4, 4);
      ctx.fillRect(cx + 11, cy + 7, 4, 4);
      // Stencil text
      ctx.fillStyle = '#c0d080';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WEAPON', cx, cy + 5);
      // Bullet decal
      ctx.fillStyle = '#8a8a6a';
      ctx.fillRect(cx - 10, cy + 2, 6, 3);
    } else if (type === 'exit') {
      // Exit sign with worn industrial look
      const exitGreen = '#1aa01a';
      const exitDark = '#107010';
      const exitLight = '#2ac02a';
      
      // Sign background
      ctx.fillStyle = exitGreen;
      ctx.fillRect(cx - 17, cy - 13, 34, 26);
      // Beveled edge highlight
      ctx.fillStyle = exitLight;
      ctx.fillRect(cx - 17, cy - 13, 34, 3);
      ctx.fillRect(cx - 17, cy - 10, 3, 23);
      // Beveled edge shadow
      ctx.fillStyle = exitDark;
      ctx.fillRect(cx + 12, cy - 10, 5, 23);
      ctx.fillRect(cx - 14, cy + 10, 31, 3);
      // Mounting bolts
      ctx.fillStyle = '#5a5a5a';
      ctx.beginPath();
      ctx.arc(cx - 13, cy - 9, 2, 0, Math.PI * 2);
      ctx.arc(cx + 13, cy - 9, 2, 0, Math.PI * 2);
      ctx.arc(cx - 13, cy + 9, 2, 0, Math.PI * 2);
      ctx.arc(cx + 13, cy + 9, 2, 0, Math.PI * 2);
      ctx.fill();
      // "EXIT" text with glow effect
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', cx, cy + 4);
      // Subtle glow around text
      ctx.fillStyle = 'rgba(100, 255, 100, 0.2)';
      ctx.fillRect(cx - 12, cy - 2, 24, 12);
    }

    // Subtle ambient glow (less pronounced than before)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function genPropSprite(type: PropType): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;
    const cx = s / 2;

    // Ground shadow - more defined for better depth
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, s - 4, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'barrel') {
      // Oil drum with rusty metal texture
      const barrelRust = '#6a4a2a';
      const barrelDark = '#4a3520';
      const barrelLight = '#8a5f3a';
      const rustSpot = '#7a4a2a';
      
      // Main barrel body (cylindrical shading)
      ctx.fillStyle = barrelRust;
      ctx.fillRect(cx - 13, 16, 26, 38);
      // Shadow on right side (light from top-left)
      ctx.fillStyle = barrelDark;
      ctx.fillRect(cx + 8, 16, 5, 38);
      // Highlight on left edge
      ctx.fillStyle = barrelLight;
      ctx.fillRect(cx - 13, 16, 3, 38);
      // Top rim
      ctx.fillStyle = barrelDark;
      ctx.fillRect(cx - 15, 18, 30, 5);
      ctx.fillStyle = barrelLight;
      ctx.fillRect(cx - 15, 18, 30, 2);
      // Bottom rim
      ctx.fillStyle = barrelDark;
      ctx.fillRect(cx - 15, 50, 30, 5);
      ctx.fillStyle = barrelLight;
      ctx.fillRect(cx - 15, 50, 30, 2);
      // Reinforcement rings
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(cx - 14, 24, 28, 3);
      ctx.fillRect(cx - 14, 46, 28, 3);
      // Rust spots and wear
      ctx.fillStyle = rustSpot;
      ctx.fillRect(cx - 6, 28, 3, 3);
      ctx.fillRect(cx + 4, 35, 4, 3);
      ctx.fillRect(cx - 8, 42, 3, 3);
      // Dents/damage marks
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(cx + 2, 30, 2, 4);
      ctx.fillRect(cx - 4, 38, 2, 3);
    } else if (type === 'table') {
      // Wooden table with worn surface
      const woodMain = '#5a4028';
      const woodDark = '#403020';
      const woodLight = '#705035';
      const woodGrain = '#4a3525';
      
      // Tabletop with bevel
      ctx.fillStyle = woodMain;
      ctx.fillRect(cx - 20, 20, 40, 10);
      // Top surface highlight
      ctx.fillStyle = woodLight;
      ctx.fillRect(cx - 20, 20, 40, 3);
      // Front edge shadow
      ctx.fillStyle = woodDark;
      ctx.fillRect(cx - 20, 27, 40, 3);
      // Wood grain details
      ctx.fillStyle = woodGrain;
      ctx.fillRect(cx - 18, 22, 8, 1);
      ctx.fillRect(cx - 5, 21, 6, 1);
      ctx.fillRect(cx + 8, 23, 7, 1);
      // Legs with perspective
      ctx.fillStyle = woodDark;
      ctx.fillRect(cx - 17, 30, 6, 24);
      ctx.fillRect(cx + 11, 30, 6, 24);
      // Leg highlights
      ctx.fillStyle = woodLight;
      ctx.fillRect(cx - 17, 30, 2, 24);
      ctx.fillRect(cx + 11, 30, 2, 24);
      // Leg braces
      ctx.fillStyle = woodMain;
      ctx.fillRect(cx - 14, 48, 28, 3);
    } else if (type === 'lamp') {
      // Street lamp with warm glow
      const poleMetal = '#3a3a3a';
      const poleDark = '#252525';
      const poleHighlight = '#505050';
      const bulbGlow = '#ffd780';
      const bulbCore = '#fff0c0';
      const shade = '#4a4030';
      
      // Pole with cylindrical shading
      ctx.fillStyle = poleMetal;
      ctx.fillRect(cx - 3, 22, 6, 32);
      // Shadow on right
      ctx.fillStyle = poleDark;
      ctx.fillRect(cx + 1, 22, 2, 32);
      // Highlight on left
      ctx.fillStyle = poleHighlight;
      ctx.fillRect(cx - 3, 22, 1, 32);
      // Lamp shade (top cap)
      ctx.fillStyle = shade;
      ctx.fillRect(cx - 10, 14, 20, 8);
      ctx.fillStyle = '#3a3025';
      ctx.fillRect(cx - 10, 14, 20, 2);
      // Bulb/globe
      ctx.fillStyle = bulbGlow;
      ctx.beginPath();
      ctx.arc(cx, 16, 9, 0, Math.PI * 2);
      ctx.fill();
      // Bright core
      ctx.fillStyle = bulbCore;
      ctx.beginPath();
      ctx.arc(cx - 1, 15, 5, 0, Math.PI * 2);
      ctx.fill();
      // Glow halo (subtle)
      ctx.fillStyle = 'rgba(255, 200, 100, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, 16, 14, 0, Math.PI * 2);
      ctx.fill();
      // Pole base/cap at bottom
      ctx.fillStyle = poleDark;
      ctx.fillRect(cx - 4, 52, 8, 4);
    }
  });
}

function genWeaponSprite(weaponId: string): Uint8Array {
  return createTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    const s = TEX_SIZE;

    if (weaponId === 'knife') {
      // Combat knife with metallic blade
      const bladeSteel = '#9a9a9a';
      const bladeDark = '#6a6a6a';
      const bladeHighlight = '#c0c0c0';
      const handleWood = '#5a3a20';
      const handleDark = '#402818';
      
      // Blade with beveled edges
      ctx.fillStyle = bladeSteel;
      ctx.beginPath();
      ctx.moveTo(s / 2 - 4, 10);
      ctx.lineTo(s / 2 + 4, 10);
      ctx.lineTo(s / 2 + 2, 32);
      ctx.lineTo(s / 2 - 2, 32);
      ctx.closePath();
      ctx.fill();
      // Blade highlight (left edge)
      ctx.fillStyle = bladeHighlight;
      ctx.fillRect(s / 2 - 4, 10, 1, 20);
      // Blade shadow (right edge)
      ctx.fillStyle = bladeDark;
      ctx.fillRect(s / 2 + 2, 12, 2, 18);
      // Blood groove
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(s / 2 - 1, 14, 2, 14);
      // Handle
      ctx.fillStyle = handleWood;
      ctx.fillRect(s / 2 - 4, 32, 8, 16);
      // Handle grooves for grip
      ctx.fillStyle = handleDark;
      ctx.fillRect(s / 2 - 4, 35, 8, 2);
      ctx.fillRect(s / 2 - 4, 40, 8, 2);
      ctx.fillRect(s / 2 - 4, 45, 8, 2);
      // Pommel
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(s / 2 - 5, 46, 10, 3);
    } else if (weaponId === 'pistol') {
      // Classic pistol with wood grip
      const gunMetal = '#3a3a3a';
      const gunDark = '#252525';
      const gunHighlight = '#505050';
      const gripWood = '#6a4420';
      const gripDark = '#4a3018';
      
      // Barrel/slide
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 4, 12, 8, 20);
      // Slide highlight (top)
      ctx.fillStyle = gunHighlight;
      ctx.fillRect(s / 2 - 4, 12, 8, 3);
      // Slide shadow (bottom)
      ctx.fillStyle = gunDark;
      ctx.fillRect(s / 2 - 4, 28, 8, 4);
      // Frame
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 4, 32, 8, 8);
      // Trigger guard
      ctx.strokeStyle = gunDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s / 2 - 2, 38);
      ctx.lineTo(s / 2 - 2, 44);
      ctx.lineTo(s / 2 + 2, 44);
      ctx.stroke();
      // Grip
      ctx.fillStyle = gripWood;
      ctx.fillRect(s / 2 - 5, 40, 10, 14);
      // Grip panels texture
      ctx.fillStyle = gripDark;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(s / 2 - 4, 42 + i * 3, 8, 1);
      }
      // Grip screws
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.arc(s / 2 - 2, 46, 1.5, 0, Math.PI * 2);
      ctx.arc(s / 2 + 2, 46, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (weaponId === 'revolver') {
      // Heavy revolver with cylinder detail
      const gunMetal = '#404040';
      const gunDark = '#282828';
      const gunHighlight = '#585858';
      const gripWood = '#5a3a18';
      
      // Barrel
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 4, 10, 8, 22);
      // Barrel highlight
      ctx.fillStyle = gunHighlight;
      ctx.fillRect(s / 2 - 4, 10, 2, 22);
      // Barrel shadow
      ctx.fillStyle = gunDark;
      ctx.fillRect(s / 2 + 2, 10, 2, 22);
      // Cylinder
      ctx.fillStyle = gunMetal;
      ctx.beginPath();
      ctx.arc(s / 2, 36, 7, 0, Math.PI * 2);
      ctx.fill();
      // Cylinder chambers (visible ends)
      ctx.fillStyle = '#1a1a1a';
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const cx_off = Math.cos(angle) * 4;
        const cy_off = Math.sin(angle) * 4;
        ctx.beginPath();
        ctx.arc(s / 2 + cx_off, 36 + cy_off, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Frame/trigger guard
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 4, 42, 8, 6);
      // Trigger
      ctx.fillStyle = gunDark;
      ctx.beginPath();
      ctx.moveTo(s / 2 - 1, 44);
      ctx.lineTo(s / 2 + 1, 44);
      ctx.lineTo(s / 2, 48);
      ctx.closePath();
      ctx.fill();
      // Grip
      ctx.fillStyle = gripWood;
      ctx.fillRect(s / 2 - 5, 48, 10, 12);
      // Grip texture
      ctx.fillStyle = '#402810';
      ctx.fillRect(s / 2 - 4, 50, 8, 1);
      ctx.fillRect(s / 2 - 4, 54, 8, 1);
      ctx.fillRect(s / 2 - 4, 58, 8, 1);
    } else if (weaponId === 'tommygun') {
      // Thompson submachine gun
      const gunMetal = '#353535';
      const gunDark = '#202020';
      const gunHighlight = '#4a4a4a';
      const gripWood = '#5a3a18';
      const gripDark = '#3a2510';
      
      // Main receiver/body
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 4, 8, 8, 32);
      // Receiver highlight
      ctx.fillStyle = gunHighlight;
      ctx.fillRect(s / 2 - 4, 8, 2, 32);
      // Receiver shadow
      ctx.fillStyle = gunDark;
      ctx.fillRect(s / 2 + 2, 8, 2, 32);
      // Barrel shroud (cooling fins suggested)
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 3, 8, 6, 14);
      // Front grip (vertical foregrip)
      ctx.fillStyle = gripWood;
      ctx.fillRect(s / 2 - 4, 36, 8, 14);
      // Grip texture lines
      ctx.fillStyle = gripDark;
      ctx.fillRect(s / 2 - 3, 38, 6, 1);
      ctx.fillRect(s / 2 - 3, 42, 6, 1);
      ctx.fillRect(s / 2 - 3, 46, 6, 1);
      // Magazine (stick mag)
      ctx.fillStyle = gunDark;
      ctx.fillRect(s / 2 - 5, 44, 10, 14);
      // Mag highlights
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 5, 44, 2, 14);
      // Mag ridges
      ctx.fillStyle = '#2a2a2a';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(s / 2 - 4, 46 + i * 2, 8, 1);
      }
      // Stock rear
      ctx.fillStyle = gripWood;
      ctx.fillRect(s / 2 - 6, 8, 4, 8);
      // Rear sight
      ctx.fillStyle = gunDark;
      ctx.fillRect(s / 2 - 2, 6, 4, 3);
    } else if (weaponId === 'shotgun') {
      // Pump-action shotgun
      const gunMetal = '#3a3a3a';
      const gunDark = '#222222';
      const gunHighlight = '#505050';
      const stockWood = '#6a4424';
      const woodDark = '#4a3018';
      
      // Barrel (long)
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 4, 6, 8, 28);
      // Barrel highlight
      ctx.fillStyle = gunHighlight;
      ctx.fillRect(s / 2 - 4, 6, 2, 28);
      // Barrel shadow
      ctx.fillStyle = gunDark;
      ctx.fillRect(s / 2 + 2, 6, 2, 28);
      // Magazine tube (under barrel)
      ctx.fillStyle = gunDark;
      ctx.fillRect(s / 2 - 3, 20, 6, 14);
      // Pump forend (wood)
      ctx.fillStyle = stockWood;
      ctx.fillRect(s / 2 - 5, 26, 10, 10);
      // Forend grain/detail
      ctx.fillStyle = woodDark;
      ctx.fillRect(s / 2 - 4, 28, 8, 1);
      ctx.fillRect(s / 2 - 4, 32, 8, 1);
      // Receiver
      ctx.fillStyle = gunMetal;
      ctx.fillRect(s / 2 - 5, 34, 10, 10);
      // Receiver highlight
      ctx.fillStyle = gunHighlight;
      ctx.fillRect(s / 2 - 5, 34, 2, 10);
      // Trigger guard
      ctx.strokeStyle = gunDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s / 2 - 2, 42);
      ctx.lineTo(s / 2 - 2, 48);
      ctx.lineTo(s / 2 + 2, 48);
      ctx.stroke();
      // Stock (wooden buttstock)
      ctx.fillStyle = stockWood;
      ctx.fillRect(s / 2 - 7, 44, 14, 16);
      // Stock cheek piece inset
      ctx.fillStyle = woodDark;
      ctx.fillRect(s / 2 - 5, 46, 10, 8);
      // Butt plate
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(s / 2 - 7, 58, 14, 4);
      // Safety button
      ctx.fillStyle = '#5a5a5a';
      ctx.beginPath();
      ctx.arc(s / 2 + 3, 38, 2, 0, Math.PI * 2);
      ctx.fill();
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
  // Try to use preloaded PNG sprites first
  const key = `enemy_${color}_${accent}_${isBoss}`;
  
  // Check if we have a preloaded sprite for this enemy type
  // Use different sprites based on color/accent combinations
  if (spriteCache.has('enemy_main')) {
    return spriteCache.get('enemy_main')!;
  }
  if (spriteCache.has('enemy_alt1')) {
    return spriteCache.get('enemy_alt1')!;
  }
  if (spriteCache.has('enemy_alt2')) {
    return spriteCache.get('enemy_alt2')!;
  }
  
  // Fallback to procedural generation if no PNG loaded
  if (!spriteCache.has(key)) {
    spriteCache.set(key, genEnemySprite(color, accent, isBoss));
  }
  return spriteCache.get(key)!;
}

// Get specific animation frame for ggp2 enemy
export function getGgp2AnimationFrame(isTop: boolean, frameIndex: number): Uint8Array | null {
  const baseName = isTop ? 'ggp2_top' : 'ggp2_bottom';
  const key = `${baseName}_${frameIndex}`;
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }
  return null;
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

// Get animation frame by index
export function getAnimationFrame(baseName: string, frameIndex: number): Uint8Array | null {
  const key = `${baseName}_${frameIndex}`;
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }
  return null;
}
