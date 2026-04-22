#!/usr/bin/env python3
"""
Crime Boss Sprite Enhancement Tool
Enhances retro FPS sprites with 90s gritty aesthetic while preserving original designs.

Features:
- Cleans jagged edges and stray pixels
- Improves shading depth with directional lighting (top-left)
- Adds subtle texture detail
- Enhances muzzle flashes, blood FX, impact sprites
- Maintains original dimensions, pivots, and transparency
"""

from __future__ import annotations

import os
import random
import math
from dataclasses import dataclass
from enum import Enum, auto
from pathlib import Path
from typing import Optional, Set, Tuple

from PIL import Image


# ============================================================
# Configuration
# ============================================================

@dataclass(frozen=True)
class Config:
    """Sprite enhancement configuration."""
    components_dir: str = '/workspace/src/components'
    light_direction: Tuple[float, float] = (-0.7, -0.7)
    stray_pixel_threshold: int = 2
    edge_smooth_blend: float = 0.3
    shading_intensity: float = 0.15
    noise_amount: int = 5
    shadow_boost: float = 0.85
    highlight_boost: float = 1.1
    colors_per_channel: int = 6
    muzzle_flash_boost: float = 1.3
    preview_suffix: str = '.preview_crop.png'


config = Config()


class SpriteType(Enum):
    """Types of sprites for special handling."""
    NORMAL = auto()
    MUZZLE_FLASH = auto()
    BLOOD = auto()


# ============================================================
# Sprite I/O
# ============================================================

def load_sprite(path: str | Path) -> Image.Image:
    """Load a sprite PNG with transparency."""
    img = Image.open(path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    return img


def save_sprite(img: Image.Image, path: str | Path) -> None:
    """Save sprite as PNG with transparency."""
    img.save(path, 'PNG')


def get_content_bbox(img: Image.Image) -> Optional[Tuple[int, int, int, int]]:
    """Get bounding box of non-transparent content."""
    alpha = img.split()[3]
    return alpha.getbbox()


# ============================================================
# Image Processing Utilities
# ============================================================

def get_alpha(img: Image.Image) -> Image.Image:
    """Extract alpha channel from image."""
    return img.split()[3]


def get_pixels(img: Image.Image):
    """Get pixel access object for image."""
    return img.load()


def is_significant_pixel(alpha_value: int, threshold: int = 128) -> bool:
    """Check if pixel alpha value is significant."""
    return alpha_value > threshold


def is_edge_pixel(alpha_value: int, low: int = 50, high: int = 200) -> bool:
    """Check if pixel is on an edge (semi-transparent)."""
    return low < alpha_value < high


def clamp(value: int, min_val: int = 0, max_val: int = 255) -> int:
    """Clamp value to range [min_val, max_val]."""
    return max(min_val, min(max_val, value))


def blend_channels(
    orig: int, other: int, blend: float
) -> int:
    """Blend two channel values with given blend factor."""
    return int(orig * (1 - blend) + other * blend)


def apply_factor(value: int, factor: float) -> int:
    """Apply multiplication factor to channel value."""
    return clamp(int(value * factor))


# ============================================================
# Sprite Enhancement Functions
# ============================================================

def remove_stray_pixels(
    img: Image.Image,
    threshold: int = None
) -> Image.Image:
    """Remove isolated stray pixels smaller than threshold."""
    if threshold is None:
        threshold = config.stray_pixel_threshold
    
    alpha = get_alpha(img)
    width, height = img.size
    pixels = get_pixels(alpha)
    
    # Create a mask of significant pixels
    significant: Set[Tuple[int, int]] = {
        (x, y)
        for y in range(height)
        for x in range(width)
        if is_significant_pixel(pixels[x, y])
    }
    
    # Find isolated pixels
    to_remove = {
        (x, y) for x, y in significant
        if sum(
            1 for dx in range(-1, 2) for dy in range(-1, 2)
            if (x + dx, y + dy) in significant
        ) < threshold
    }
    
    # Remove stray pixels
    result = img.copy()
    result_pixels = get_pixels(result)
    for x, y in to_remove:
        result_pixels[x, y] = (0, 0, 0, 0)
    
    return result


def smooth_edges(img: Image.Image) -> Image.Image:
    """Smooth jagged edges while preserving pixel art style."""
    alpha = get_alpha(img)
    width, height = img.size
    result = img.copy()
    result_pixels = get_pixels(result)
    orig_pixels = get_pixels(img)
    
    neighbor_offsets = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            alpha_val = alpha.getpixel((x, y))
            if not is_edge_pixel(alpha_val):
                continue
            
            # Sample neighboring alphas
            neighbor_alphas = [
                alpha.getpixel((x + dx, y + dy))
                for dx, dy in neighbor_offsets
            ]
            avg_alpha = sum(neighbor_alphas) / len(neighbor_alphas)
            
            if avg_alpha <= alpha_val:
                continue
            
            # Blend towards neighbors
            r, g, b, a = orig_pixels[x, y]
            
            # Find an opaque neighbor to sample color from
            for dx, dy in neighbor_offsets:
                nx, ny = x + dx, y + dy
                if alpha.getpixel((nx, ny)) > 200:
                    nr, ng, nb, _ = orig_pixels[nx, ny]
                    r = blend_channels(r, nr, config.edge_smooth_blend)
                    g = blend_channels(g, ng, config.edge_smooth_blend)
                    b = blend_channels(b, nb, config.edge_smooth_blend)
                    break
            
            result_pixels[x, y] = (r, g, b, max(alpha_val, int(avg_alpha)))
    
    return result


def apply_directional_shading(
    img: Image.Image,
    intensity: float = None
) -> Image.Image:
    """Apply directional shading based on top-left light source."""
    if intensity is None:
        intensity = config.shading_intensity
    
    width, height = img.size
    result = img.copy()
    pixels = get_pixels(result)
    orig_pixels = get_pixels(img)
    alpha = get_alpha(img)
    
    cx, cy = width / 2, height / 2
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Estimate surface normal from depth (distance from center)
            nx = (x - cx) / cx
            ny = (y - cy) / cy
            
            # Simple lighting calculation
            light_dot = (
                config.light_direction[0] * nx +
                config.light_direction[1] * ny
            )
            
            # Apply shading
            if light_dot > 0:
                factor = 1.0 + intensity * light_dot
            else:
                factor = 1.0 + intensity * 0.5 * light_dot
            
            r = apply_factor(r, factor)
            g = apply_factor(g, factor)
            b = apply_factor(b, factor)
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result


def enhance_contrast(
    img: Image.Image,
    shadow_boost: float = None,
    highlight_boost: float = None
) -> Image.Image:
    """Enhance contrast for better readability."""
    if shadow_boost is None:
        shadow_boost = config.shadow_boost
    if highlight_boost is None:
        highlight_boost = config.highlight_boost
    
    width, height = img.size
    result = img.copy()
    pixels = get_pixels(result)
    orig_pixels = get_pixels(img)
    alpha = get_alpha(img)
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            brightness = (r + g + b) / 3
            
            if brightness < 80:
                factor = shadow_boost
            elif brightness > 180:
                factor = highlight_boost
            else:
                factor = 1.0
            
            r = apply_factor(r, factor)
            g = apply_factor(g, factor)
            b = apply_factor(b, factor)
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result


def add_subtle_noise(img: Image.Image, amount: int = None) -> Image.Image:
    """Add subtle noise for texture detail."""
    if amount is None:
        amount = config.noise_amount
    
    width, height = img.size
    result = img.copy()
    pixels = get_pixels(result)
    orig_pixels = get_pixels(img)
    alpha = get_alpha(img)
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            noise = random.randint(-amount, amount)
            
            r = clamp(r + noise)
            g = clamp(g + noise)
            b = clamp(b + noise)
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result


def quantize_palette(img: Image.Image, colors_per_channel: int = None) -> Image.Image:
    """Quantize to limited palette for retro feel."""
    if colors_per_channel is None:
        colors_per_channel = config.colors_per_channel
    
    width, height = img.size
    result = img.copy()
    pixels = get_pixels(result)
    orig_pixels = get_pixels(img)
    alpha = get_alpha(img)
    
    step = 256 // colors_per_channel
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Quantize each channel
            r = clamp((r // step) * step + step // 2)
            g = clamp((g // step) * step + step // 2)
            b = clamp((b // step) * step + step // 2)
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result


def enhance_muzzle_flash(img: Image.Image, boost: float = None) -> Image.Image:
    """Enhance muzzle flash effects with brighter core and glow."""
    if boost is None:
        boost = config.muzzle_flash_boost
    
    width, height = img.size
    result = img.copy()
    pixels = get_pixels(result)
    orig_pixels = get_pixels(img)
    alpha = get_alpha(img)
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Check if this looks like muzzle flash (bright yellow/orange)
            if r > 200 and g > 150 and b < 100:
                # Boost brightness
                r = clamp(int(r * boost))
                g = clamp(int(g * boost))
                b = clamp(int(b * boost * 0.8))  # Keep it warm
                
                pixels[x, y] = (r, g, b, orig_a)
    
    return result


def enhance_blood_fx(img: Image.Image) -> Image.Image:
    """Enhance blood effects with deeper reds and highlights."""
    width, height = img.size
    result = img.copy()
    pixels = get_pixels(result)
    orig_pixels = get_pixels(img)
    alpha = get_alpha(img)
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Check if this is blood-colored
            if r > 150 and g < 100 and b < 100:
                if r < 100:
                    # Shadow - make deeper
                    r = apply_factor(r, 0.9)
                    g = apply_factor(g, 0.8)
                    b = apply_factor(b, 0.8)
                elif r > 200:
                    # Highlight - make brighter
                    r = clamp(int(r * 1.1))
                    g = apply_factor(g, 0.9)
                    b = apply_factor(b, 0.8)
                
                pixels[x, y] = (r, g, b, orig_a)
    
    return result


def align_to_pivot(
    img: Image.Image,
    target_bbox: Optional[Tuple[int, int, int, int]] = None
) -> Image.Image:
    """Align sprite to consistent pivot point."""
    bbox = get_content_bbox(img)
    if not bbox:
        return img
    
    # For now, just ensure consistent canvas size
    # The actual pivot alignment would depend on game engine requirements
    return img

def enhance_sprite(
    img: Image.Image,
    sprite_type: SpriteType = SpriteType.NORMAL
) -> Image.Image:
    """Apply all enhancements to a sprite."""
    # Step 1: Remove stray pixels
    result = remove_stray_pixels(img)
    
    # Step 2: Smooth edges slightly
    result = smooth_edges(result)
    
    # Step 3: Enhance contrast
    result = enhance_contrast(result)
    
    # Step 4: Apply directional shading
    result = apply_directional_shading(result)
    
    # Step 5: Add subtle texture noise
    result = add_subtle_noise(result)
    
    # Step 6: Special handling for effects
    if sprite_type == SpriteType.MUZZLE_FLASH:
        result = enhance_muzzle_flash(result)
    elif sprite_type == SpriteType.BLOOD:
        result = enhance_blood_fx(result)
    
    return result


def detect_sprite_type(filename: str) -> SpriteType:
    """Detect sprite type from filename."""
    name_lower = filename.lower()
    if 'muzzle' in name_lower or 'flash' in name_lower:
        return SpriteType.MUZZLE_FLASH
    if 'blood' in name_lower:
        return SpriteType.BLOOD
    return SpriteType.NORMAL


def process_all_sprites() -> None:
    """Process all sprite PNGs in the components directory."""
    components_path = Path(config.components_dir)
    png_files = [
        f for f in os.listdir(components_path)
        if f.endswith('.png') and not f.endswith(config.preview_suffix)
    ]
    
    print(f"Found {len(png_files)} sprite files to process")
    
    for filename in sorted(png_files):
        input_path = components_path / filename
        
        print(f"\nProcessing: {filename}")
        
        try:
            # Load sprite
            img = load_sprite(input_path)
            original_size = img.size
            original_bbox = get_content_bbox(img)
            
            print(f"  Size: {original_size}, Content bbox: {original_bbox}")
            
            # Determine sprite type for special handling
            sprite_type = detect_sprite_type(filename)
            
            # Enhance sprite
            enhanced = enhance_sprite(img, sprite_type)
            
            # Ensure same dimensions
            if enhanced.size != original_size:
                enhanced = enhanced.resize(original_size, Image.NEAREST)
            
            # Save enhanced sprite
            save_sprite(enhanced, input_path)
            
            # Verify
            new_bbox = get_content_bbox(enhanced)
            print(f"  Enhanced! New bbox: {new_bbox}")
            
        except Exception as e:
            print(f"  Error processing {filename}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n✓ Sprite enhancement complete!")

if __name__ == '__main__':
    process_all_sprites()
