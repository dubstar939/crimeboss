#!/usr/bin/env python3
"""
Crime Boss Sprite Generator
Generates all pixel-art sprites for 90s FPS aesthetic game
Follows WEAPON_STYLE_GUIDE.md specifications

Output: 41+ PNG sprites to src/components/
"""

from PIL import Image, ImageDraw
import os
from pathlib import Path
from typing import Tuple, List
import math


# ============================================================
# Configuration
# ============================================================

OUTPUT_DIR = Path('src/components')
SPRITE_SIZE = 64
DARK_OUTLINE = '#1a1a1a'
TRANSPARENT = (0, 0, 0, 0)


# ============================================================
# Utility Functions
# ============================================================

def create_sprite(name: str) -> Tuple[Image.Image, ImageDraw.ImageDraw]:
    """Create a new RGBA sprite canvas."""
    img = Image.new('RGBA', (SPRITE_SIZE, SPRITE_SIZE), TRANSPARENT)
    draw = ImageDraw.Draw(img)
    return img, draw


def save_sprite(img: Image.Image, name: str) -> None:
    """Save sprite to components directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"{name}.png"
    img.save(path, 'PNG')
    print(f"✓ {path}")


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def blend_color(color1: str, color2: str, ratio: float) -> str:
    """Blend two hex colors."""
    r1, g1, b1 = hex_to_rgb(color1)
    r2, g2, b2 = hex_to_rgb(color2)
    
    r = int(r1 * (1 - ratio) + r2 * ratio)
    g = int(g1 * (1 - ratio) + g2 * ratio)
    b = int(b1 * (1 - ratio) + b2 * ratio)
    
    return f"#{r:02x}{g:02x}{b:02x}"


def outline_rect(draw: ImageDraw.ImageDraw, bbox: Tuple, fill: str, outline: str = DARK_OUTLINE, width: int = 1):
    """Draw filled rectangle with outline."""
    draw.rectangle(bbox, fill=fill, outline=outline, width=width)


def outline_polygon(draw: ImageDraw.ImageDraw, points: List, fill: str, outline: str = DARK_OUTLINE):
    """Draw filled polygon with outline."""
    draw.polygon(points, fill=fill, outline=outline)


# ============================================================
# WEAPON SPRITES
# ============================================================

def gen_knife_base():
    """Base knife sprite (idle/held)."""
    img, draw = create_sprite('knife')
    
    # Blade (high-contrast steel)
    blade_points = [
        (32, 12),   # tip
        (36, 14),   # right edge
        (38, 50),   # bottom right
        (32, 52),   # bottom
        (26, 50),   # bottom left
        (28, 14),   # left edge
    ]
    outline_polygon(draw, blade_points, '#a0a0a0', '#4a4a4a')
    
    # Blade highlight
    draw.line([(28, 16), (26, 48)], fill='#e0e0e0', width=1)
    
    # Blood groove
    draw.line([(32, 18), (32, 48)], fill='#6a6a6a', width=1)
    
    # Handle (wood)
    outline_rect(draw, (26, 48, 38, 62), '#6a4420', '#402810', 1)
    
    # Handle grooves
    for y in [52, 56]:
        draw.line([(27, y), (37, y)], fill='#402810', width=1)
    
    # Pommel
    outline_rect(draw, (24, 60, 40, 64), '#5a5a5a', '#3a3a3a', 1)
    
    save_sprite(img, 'knife')


def gen_pistol_base():
    """Base pistol sprite."""
    img, draw = create_sprite('pistol')
    
    # Barrel/slide
    outline_rect(draw, (28, 14, 36, 38), '#4a4a4a', '#2a2a2a', 1)
    
    # Slide highlight
    draw.line([(28, 16), (28, 36)], fill='#707070', width=1)
    
    # Frame
    outline_rect(draw, (26, 38, 38, 48), '#3a3a3a', '#2a2a2a', 1)
    
    # Trigger guard
    draw.line([(29, 42), (29, 48)], fill='#2a2a2a', width=2)
    draw.line([(29, 48), (35, 48)], fill='#2a2a2a', width=2)
    
    # Grip (wood)
    outline_rect(draw, (24, 44, 40, 62), '#6a4420', '#402810', 1)
    
    # Grip panels
    for y in [48, 52, 56]:
        draw.line([(26, y), (38, y)], fill='#402810', width=1)
    
    # Grip screws
    draw.ellipse([(27, 54, 31, 58)], fill='#5a5a5a', outline='#3a3a3a')
    draw.ellipse([(33, 54, 37, 58)], fill='#5a5a5a', outline='#3a3a3a')
    
    save_sprite(img, 'pistol')


def gen_revolver_base():
    """Base revolver sprite."""
    img, draw = create_sprite('revolver')
    
    # Barrel
    outline_rect(draw, (28, 10, 36, 36), '#5a5a5a', '#3a3a3a', 1)
    
    # Barrel highlight
    draw.line([(28, 12), (28, 34)], fill='#8a8a8a', width=1)
    
    # Cylinder
    draw.ellipse([(26, 36, 38, 50)], fill='#5a5a5a', outline='#3a3a3a')
    
    # Cylinder chambers
    for i in range(6):
        angle = (i / 6) * 360
        rad = math.radians(angle)
        cx = 32 + math.cos(rad) * 4
        cy = 43 + math.sin(rad) * 4
        draw.ellipse([(cx-1.5, cy-1.5, cx+1.5, cy+1.5)], fill='#1a1a1a')
    
    # Frame
    outline_rect(draw, (26, 48, 38, 56), '#5a5a5a', '#3a3a3a', 1)
    
    # Trigger
    trigger_pts = [(30, 50), (34, 50), (32, 54)]
    outline_polygon(draw, trigger_pts, '#3a3a3a', '#2a2a2a')
    
    # Grip (wood)
    outline_rect(draw, (22, 54, 42, 62), '#6a4420', '#402810', 1)
    
    # Grip texture
    for y in [56, 59]:
        draw.line([(24, y), (40, y)], fill='#402810', width=1)
    
    save_sprite(img, 'revolver')


def gen_tommygun_base():
    """Base Tommy Gun sprite."""
    img, draw = create_sprite('tommygun')
    
    # Receiver
    outline_rect(draw, (28, 8, 36, 40), '#4a4a4a', '#2a2a2a', 1)
    
    # Receiver highlight
    draw.line([(28, 10), (28, 38)], fill='#707070', width=1)
    
    # Barrel shroud
    outline_rect(draw, (29, 8, 35, 20), '#3a3a3a', '#2a2a2a', 1)
    
    # Front grip
    outline_rect(draw, (26, 40, 38, 54), '#6a4420', '#402810', 1)
    
    # Grip texture
    for y in [43, 47, 51]:
        draw.line([(27, y), (37, y)], fill='#402810', width=1)
    
    # Magazine (stick mag)
    outline_rect(draw, (22, 48, 42, 62), '#3a3a3a', '#2a2a2a', 1)
    
    # Mag ridges
    for y in range(50, 62, 2):
        draw.line([(24, y), (40, y)], fill='#2a2a2a', width=1)
    
    # Stock
    outline_rect(draw, (20, 8, 24, 16), '#6a4420', '#402810', 1)
    
    # Rear sight
    outline_rect(draw, (30, 6, 34, 9), '#3a3a3a', '#2a2a2a', 1)
    
    save_sprite(img, 'tommygun')


def gen_shotgun_base():
    """Base shotgun sprite."""
    img, draw = create_sprite('shotgun')
    
    # Long barrel
    outline_rect(draw, (28, 6, 36, 36), '#5a5a5a', '#3a3a3a', 1)
    
    # Barrel highlight
    draw.line([(28, 8), (28, 34)], fill='#8a8a8a', width=1)
    
    # Magazine tube
    outline_rect(draw, (29, 24, 35, 38), '#3a3a3a', '#2a2a2a', 1)
    
    # Pump forend (wood)
    outline_rect(draw, (22, 38, 42, 48), '#6a4420', '#402810', 1)
    
    # Forend grain
    draw.line([(24, 42), (40, 42)], fill='#402810', width=1)
    draw.line([(24, 46), (40, 46)], fill='#402810', width=1)
    
    # Receiver
    outline_rect(draw, (22, 48, 42, 58), '#5a5a5a', '#3a3a3a', 1)
    
    # Stock (wood)
    outline_rect(draw, (18, 56, 46, 64), '#6a4420', '#402810', 1)
    
    # Butt plate
    outline_rect(draw, (18, 62, 46, 64), '#2a2a2a', '#1a1a1a', 1)
    
    # Safety button
    draw.ellipse([(38, 50, 42, 54)], fill='#7a7a7a', outline='#4a4a4a')
    
    save_sprite(img, 'shotgun')


def gen_knife_melee_frames():
    """Generate 8-frame knife melee attack animation."""
    frames = [
        # Frame 0: Starting position
        lambda draw: (
            draw.polygon([(32, 20), (38, 16), (40, 48), (34, 50)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(32, 22), (32, 48)], fill='#6a6a6a', width=1),
            draw.rectangle([(26, 48, 38, 58)], fill='#6a4420', outline='#402810', width=1)
        ),
        # Frame 1: Start slash
        lambda draw: (
            draw.polygon([(30, 16), (40, 24), (38, 52), (28, 48)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(34, 20), (34, 50)], fill='#6a6a6a', width=1),
            draw.rectangle([(24, 48, 40, 58)], fill='#6a4420', outline='#402810', width=1)
        ),
        # Frame 2: Mid slash
        lambda draw: (
            draw.polygon([(28, 14), (42, 32), (36, 54), (22, 46)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(32, 20), (36, 50)], fill='#6a6a6a', width=1),
            draw.rectangle([(22, 50, 42, 60)], fill='#6a4420', outline='#402810', width=1)
        ),
        # Frame 3: Peak slash
        lambda draw: (
            draw.polygon([(26, 12), (44, 38), (34, 56), (16, 50)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(30, 18), (38, 52)], fill='#6a6a6a', width=1),
            draw.rectangle([(20, 52, 44, 62)], fill='#6a4420', outline='#402810', width=1)
        ),
        # Frame 4: Return mid
        lambda draw: (
            draw.polygon([(28, 14), (42, 32), (36, 54), (22, 46)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(32, 20), (36, 50)], fill='#6a6a6a', width=1),
            draw.rectangle([(22, 50, 42, 60)], fill='#6a4420', outline='#402810', width=1)
        ),
        # Frame 5: Return to start
        lambda draw: (
            draw.polygon([(30, 16), (40, 24), (38, 52), (28, 48)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(34, 20), (34, 50)], fill='#6a6a6a', width=1),
            draw.rectangle([(24, 48, 40, 58)], fill='#6a4420', outline='#402810', width=1)
        ),
        # Frame 6: Idle sway left
        lambda draw: (
            draw.polygon([(31, 18), (39, 16), (39, 50), (33, 50)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(32, 20), (32, 48)], fill='#6a6a6a', width=1),
            draw.rectangle([(26, 48, 38, 58)], fill='#6a4420', outline='#402810', width=1)
        ),
        # Frame 7: Idle sway right
        lambda draw: (
            draw.polygon([(33, 16), (41, 18), (41, 50), (35, 50)], fill='#a0a0a0', outline='#4a4a4a'),
            draw.line([(34, 20), (34, 48)], fill='#6a6a6a', width=1),
            draw.rectangle([(28, 48, 40, 58)], fill='#6a4420', outline='#402810', width=1)
        ),
    ]
    
    for i, draw_func in enumerate(frames):
        img, draw = create_sprite(f'knife_frame_{i}')
        draw_func(draw)
        save_sprite(img, f'knife_frame_{i}')


def gen_tommygun_flash_frames():
    """Generate 3-frame muzzle flash."""
    frames = [
        # Frame 0: Initial flash (bright yellow)
        lambda draw: (
            draw.polygon([(30, 8), (34, 6), (38, 12), (36, 18), (32, 16)], fill='#ffff00', outline='#ffcc00'),
            draw.polygon([(31, 6), (35, 4), (39, 10), (37, 16), (33, 15)], fill='#ffff80', outline='#ffff00'),
        ),
        # Frame 1: Mid flash (orange-yellow)
        lambda draw: (
            draw.polygon([(28, 10), (36, 6), (42, 14), (38, 22), (30, 20)], fill='#ffdd00', outline='#ffaa00'),
            draw.polygon([(29, 8), (37, 4), (43, 12), (39, 20), (31, 19)], fill='#ffff88', outline='#ffdd00'),
        ),
        # Frame 2: Fading flash (orange)
        lambda draw: (
            draw.polygon([(26, 12), (34, 8), (40, 16), (36, 24), (28, 22)], fill='#ff8800', outline='#cc6600'),
            draw.polygon([(27, 10), (35, 6), (41, 14), (37, 22), (29, 21)], fill='#ffcc00', outline='#ff8800'),
        ),
    ]
    
    for i, draw_func in enumerate(frames):
        img, draw = create_sprite(f'tommygunflash{i+1}')
        draw_func(draw)
        save_sprite(img, f'tommygunflash{i+1}')


def gen_sniper_frames():
    """Generate sniper rifle frames (idle and fire)."""
    # Idle frames (3)
    idle_frames = [
        # Frame 0: Scope left
        lambda draw: (
            draw.rectangle([(24, 8, 40, 42)], fill='#4a4a4a', outline='#2a2a2a', width=1),
            draw.ellipse([(26, 10, 38, 22)], fill='#1a1a1a', outline='#2a2a2a', width=1),
            draw.line([(32, 12), (32, 20)], fill='#888888', width=1),
            draw.rectangle([(28, 42, 36, 60)], fill='#6a4420', outline='#402810', width=1),
        ),
        # Frame 1: Center
        lambda draw: (
            draw.rectangle([(26, 8, 38, 42)], fill='#4a4a4a', outline='#2a2a2a', width=1),
            draw.ellipse([(28, 10, 36, 22)], fill='#1a1a1a', outline='#2a2a2a', width=1),
            draw.line([(32, 12), (32, 20)], fill='#888888', width=1),
            draw.rectangle([(28, 42, 36, 60)], fill='#6a4420', outline='#402810', width=1),
        ),
        # Frame 2: Scope right
        lambda draw: (
            draw.rectangle([(24, 8, 40, 42)], fill='#4a4a4a', outline='#2a2a2a', width=1),
            draw.ellipse([(26, 10, 38, 22)], fill='#1a1a1a', outline='#2a2a2a', width=1),
            draw.line([(32, 12), (32, 20)], fill='#888888', width=1),
            draw.rectangle([(28, 42, 36, 60)], fill='#6a4420', outline='#402810', width=1),
        ),
    ]
    
    for i, draw_func in enumerate(idle_frames):
        img, draw = create_sprite(f'ss2sniper{i+1}')
        draw_func(draw)
        save_sprite(img, f'ss2sniper{i+1}')
    
    # Fire frames (3)
    fire_frames = [
        # Frame 0: Flash
        lambda draw: (
            draw.rectangle([(26, 4, 38, 40)], fill='#4a4a4a', outline='#2a2a2a', width=1),
            draw.polygon([(28, 6), (36, 8), (34, 14), (30, 12)], fill='#ffff00', outline='#ffaa00'),
            draw.rectangle([(28, 40, 36, 58)], fill='#6a4420', outline='#402810', width=1),
        ),
        # Frame 1: Heavy recoil
        lambda draw: (
            draw.rectangle([(28, 2, 36, 36)], fill='#4a4a4a', outline='#2a2a2a', width=1),
            draw.ellipse([(30, 6, 34, 16)], fill='#1a1a1a', outline='#2a2a2a', width=1),
            draw.rectangle([(28, 36, 36, 52)], fill='#6a4420', outline='#402810', width=1),
        ),
        # Frame 2: Settling
        lambda draw: (
            draw.rectangle([(26, 6, 38, 40)], fill='#4a4a4a', outline='#2a2a2a', width=1),
            draw.ellipse([(28, 10, 36, 20)], fill='#1a1a1a', outline='#2a2a2a', width=1),
            draw.rectangle([(28, 40, 36, 58)], fill='#6a4420', outline='#402810', width=1),
        ),
    ]
    
    fire_names = ['ss2sniperFir1', 'ss2sniper4', 'ss2sniper5']
    for i, (draw_func, name) in enumerate(zip(fire_frames, fire_names)):
        img, draw = create_sprite(name)
        draw_func(draw)
        save_sprite(img, name)


# ============================================================
# ENEMY SPRITES
# ============================================================

def gen_enemy_sprite(name: str, color: str):
    """Generate enemy sprite with given colors."""
    img, draw = create_sprite(name)
    
    # Shadow
    draw.ellipse([(14, 54, 50, 60)], fill='rgba(0,0,0,100)')
    
    # Legs (pants)
    draw.rectangle([(22, 42, 28, 60)], fill='#1f1f2e', outline='#12121a', width=1)
    draw.rectangle([(36, 42, 42, 60)], fill='#1f1f2e', outline='#12121a', width=1)
    
    # Shoes
    draw.rectangle([(20, 58, 30, 62)], fill='#2a2a2a', outline='#1a1a1a', width=1)
    draw.rectangle([(34, 58, 44, 62)], fill='#2a2a2a', outline='#1a1a1a', width=1)
    
    # Body (suit)
    draw.rectangle([(18, 26, 46, 42)], fill=color, outline=color)
    
    # Arms
    draw.rectangle([(12, 28, 18, 42)], fill=color, outline=color)
    draw.rectangle([(46, 28, 52, 42)], fill=color, outline=color)
    
    # Head
    draw.ellipse([(26, 14, 38, 26)], fill='#d4a574', outline='#b8905f')
    
    # Fedora
    draw.rectangle([(20, 12, 44, 18)], fill='#1a1a1a', outline='#0f0f0f', width=1)
    draw.rectangle([(22, 8, 42, 14)], fill='#1a1a1a', outline='#0f0f0f', width=1)
    
    # Eyes
    draw.ellipse([(26, 18, 29, 21)], fill='#f0f0f0', outline='#1a1a1a', width=1)
    draw.ellipse([(35, 18, 38, 21)], fill='#f0f0f0', outline='#1a1a1a', width=1)
    
    save_sprite(img, name)


def gen_enemy_sprites():
    """Generate all enemy sprite variants."""
    gen_enemy_sprite('LDZgviX', '#555555')      # Main thug
    gen_enemy_sprite('ggp2', '#3a3a5c')         # GGP2 (blue suit)
    gen_enemy_sprite('gs', '#2a2a2a')           # Heavy (dark suit)


def gen_ggp2_animation():
    """Generate GGP2 top/bottom animation frames."""
    # Top half frames (idle sway, 4 frames)
    for i in range(4):
        img, draw = create_sprite(f'ggp2_top_frame_{i}')
        
        # Body (blue suit) with slight sway
        sway = 2 if i % 2 == 0 else 0
        draw.rectangle([(18+sway, 20, 46-sway, 40)], fill='#3a3a5c', outline='#3a3a5c')
        
        # Arms
        draw.rectangle([(12, 24, 18, 38)], fill='#3a3a5c', outline='#3a3a5c')
        draw.rectangle([(46, 24, 52, 38)], fill='#3a3a5c', outline='#3a3a5c')
        
        # Head
        draw.ellipse([(26, 8, 38, 20)], fill='#d4a574', outline='#b8905f')
        
        # Fedora
        draw.rectangle([(20, 6, 44, 12)], fill='#1a1a1a', outline='#0f0f0f', width=1)
        
        save_sprite(img, f'ggp2_top_frame_{i}')
    
    # Bottom half frames (4 frames)
    for i in range(4):
        img, draw = create_sprite(f'ggp2_bottom_frame_{i}')
        
        # Legs
        draw.rectangle([(22, 12, 28, 46)], fill='#1f1f2e', outline='#12121a', width=1)
        draw.rectangle([(36, 12, 42, 46)], fill='#1f1f2e', outline='#12121a', width=1)
        
        # Shoes (slight walk animation)
        pos = 44 if i % 2 == 0 else 46
        draw.rectangle([(20, pos, 30, pos+4)], fill='#2a2a2a', outline='#1a1a1a', width=1)
        draw.rectangle([(34, pos, 44, pos+4)], fill='#2a2a2a', outline='#1a1a1a', width=1)
        
        save_sprite(img, f'ggp2_bottom_frame_{i}')


# ============================================================
# Main Generator
# ============================================================

def generate_all_sprites():
    """Generate all 41+ sprites."""
    print("🎨 Generating Crime Boss Sprites...")
    print()
    
    print("📍 Weapon Base Sprites:")
    gen_knife_base()
    gen_pistol_base()
    gen_revolver_base()
    gen_tommygun_base()
    gen_shotgun_base()
    
    print("\n🔪 Knife Animation (8 frames):")
    gen_knife_melee_frames()
    
    print("\n💥 Tommy Gun Flash (3 frames):")
    gen_tommygun_flash_frames()
    
    print("\n🎯 Sniper Rifle (6 frames):")
    gen_sniper_frames()
    
    print("\n👿 Enemy Sprites:")
    gen_enemy_sprites()
    
    print("\n🚶 GGP2 Animation (8 frames):")
    gen_ggp2_animation()
    
    print("\n✅ All sprites generated!")
    print(f"📁 Output: {OUTPUT_DIR}/")


if __name__ == '__main__':
    generate_all_sprites()
