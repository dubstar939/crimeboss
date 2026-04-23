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

from PIL import Image, ImageFilter
import os
import math

# Configuration
COMPONENTS_DIR = 'crimeboss/src/components'
LIGHT_DIRECTION = (-0.7, -0.7)  # Top-left lighting

def load_sprite(path):
    """Load a sprite PNG with transparency."""
    img = Image.open(path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    return img

def save_sprite(img, path):
    """Save sprite as PNG with transparency."""
    img.save(path, 'PNG')

def get_content_bbox(img):
    """Get bounding box of non-transparent content."""
    alpha = img.split()[3]
    return alpha.getbbox()

def remove_stray_pixels(img, threshold=2):
    """Remove isolated stray pixels smaller than threshold."""
    alpha = img.split()[3]
    width, height = img.size
    
    # Create a mask of significant pixels
    pixels = alpha.load()
    significant = set()
    
    for y in range(height):
        for x in range(width):
            if pixels[x, y] > 128:
                significant.add((x, y))
    
    # Find isolated pixels
    to_remove = set()
    for x, y in significant:
        neighbors = sum(1 for dx in range(-1, 2) for dy in range(-1, 2) 
                       if (x+dx, y+dy) in significant)
        if neighbors < threshold:
            to_remove.add((x, y))
    
    # Remove stray pixels
    result = img.copy()
    result_pixels = result.load()
    for x, y in to_remove:
        result_pixels[x, y] = (0, 0, 0, 0)
    
    return result

def smooth_edges(img):
    """Smooth jagged edges while preserving pixel art style."""
    alpha = img.split()[3]
    width, height = img.size
    
    # Simple edge smoothing: average alpha values at boundaries
    result = img.copy()
    result_pixels = result.load()
    orig_pixels = img.load()
    
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            alpha_val = alpha.getpixel((x, y))
            if 50 < alpha_val < 200:  # Edge pixel
                # Sample neighboring alphas
                neighbors = [
                    alpha.getpixel((x-1, y)), alpha.getpixel((x+1, y)),
                    alpha.getpixel((x, y-1)), alpha.getpixel((x, y+1))
                ]
                avg_alpha = sum(neighbors) / 4
                
                if avg_alpha > alpha_val:
                    # Blend towards neighbors
                    blend = 0.3
                    r, g, b, a = orig_pixels[x, y]
                    # Find an opaque neighbor to sample color from
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                        nx, ny = x + dx, y + dy
                        if alpha.getpixel((nx, ny)) > 200:
                            nr, ng, nb, _ = orig_pixels[nx, ny]
                            r = int(r * (1-blend) + nr * blend)
                            g = int(g * (1-blend) + ng * blend)
                            b = int(b * (1-blend) + nb * blend)
                            break
                    result_pixels[x, y] = (r, g, b, max(alpha_val, int(avg_alpha)))
    
    return result

def apply_directional_shading(img, intensity=0.15):
    """Apply directional shading based on top-left light source."""
    width, height = img.size
    result = img.copy()
    pixels = result.load()
    orig_pixels = img.load()
    alpha = img.split()[3]
    
    # Calculate normal map approximation from alpha
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Estimate surface normal from depth (distance from center)
            cx, cy = width / 2, height / 2
            nx = (x - cx) / cx
            ny = (y - cy) / cy
            
            # Simple lighting calculation
            light_dot = LIGHT_DIRECTION[0] * nx + LIGHT_DIRECTION[1] * ny
            
            # Apply shading
            if light_dot > 0:
                # Highlight
                factor = 1.0 + intensity * light_dot
            else:
                # Shadow
                factor = 1.0 + intensity * 0.5 * light_dot
            
            r = min(255, max(0, int(r * factor)))
            g = min(255, max(0, int(g * factor)))
            b = min(255, max(0, int(b * factor)))
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result

def enhance_contrast(img, shadow_boost=0.85, highlight_boost=1.1):
    """Enhance contrast for better readability."""
    width, height = img.size
    result = img.copy()
    pixels = result.load()
    orig_pixels = img.load()
    alpha = img.split()[3]
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            brightness = (r + g + b) / 3
            
            if brightness < 80:
                # Shadows - deepen slightly
                factor = shadow_boost
            elif brightness > 180:
                # Highlights - boost slightly
                factor = highlight_boost
            else:
                factor = 1.0
            
            r = min(255, max(0, int(r * factor)))
            g = min(255, max(0, int(g * factor)))
            b = min(255, max(0, int(b * factor)))
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result

def add_subtle_noise(img, amount=8):
    """Add subtle noise for texture detail."""
    import random
    width, height = img.size
    result = img.copy()
    pixels = result.load()
    orig_pixels = img.load()
    alpha = img.split()[3]
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            noise = random.randint(-amount, amount)
            
            r = min(255, max(0, r + noise))
            g = min(255, max(0, g + noise))
            b = min(255, max(0, b + noise))
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result

def quantize_palette(img, colors_per_channel=6):
    """Quantize to limited palette for retro feel."""
    width, height = img.size
    result = img.copy()
    pixels = result.load()
    orig_pixels = img.load()
    alpha = img.split()[3]
    
    step = 256 // colors_per_channel
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Quantize each channel
            r = (r // step) * step + step // 2
            g = (g // step) * step + step // 2
            b = (b // step) * step + step // 2
            
            r = min(255, max(0, r))
            g = min(255, max(0, g))
            b = min(255, max(0, b))
            
            pixels[x, y] = (r, g, b, orig_a)
    
    return result

def enhance_muzzle_flash(img):
    """Enhance muzzle flash effects with brighter core and glow."""
    width, height = img.size
    result = img.copy()
    pixels = result.load()
    orig_pixels = img.load()
    alpha = img.split()[3]
    
    # Detect bright yellow/orange pixels (muzzle flash colors)
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Check if this looks like muzzle flash (bright yellow/orange)
            if r > 200 and g > 150 and b < 100:
                # Boost brightness
                boost = 1.3
                r = min(255, int(r * boost))
                g = min(255, int(g * boost))
                b = min(255, int(b * boost * 0.8))  # Keep it warm
                
                pixels[x, y] = (r, g, b, orig_a)
    
    return result

def enhance_blood_fx(img):
    """Enhance blood effects with deeper reds and highlights."""
    width, height = img.size
    result = img.copy()
    pixels = result.load()
    orig_pixels = img.load()
    alpha = img.split()[3]
    
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a < 50:
                continue
            
            r, g, b, orig_a = orig_pixels[x, y]
            
            # Check if this is blood-colored
            if r > 150 and g < 100 and b < 100:
                # Deepen shadows, boost highlights
                if r < 100:
                    # Shadow - make deeper
                    r = int(r * 0.9)
                    g = int(g * 0.8)
                    b = int(b * 0.8)
                elif r > 200:
                    # Highlight - make brighter
                    r = min(255, int(r * 1.1))
                    g = int(g * 0.9)
                    b = int(b * 0.8)
                
                pixels[x, y] = (r, g, b, orig_a)
    
    return result

def align_to_pivot(img, target_bbox=None):
    """Align sprite to consistent pivot point."""
    bbox = get_content_bbox(img)
    if not bbox:
        return img
    
    # For now, just ensure consistent canvas size
    # The actual pivot alignment would depend on game engine requirements
    return img

def enhance_sprite(img, is_muzzle_flash=False, is_blood=False):
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
    result = add_subtle_noise(result, amount=5)
    
    # Step 6: Special handling for effects
    if is_muzzle_flash:
        result = enhance_muzzle_flash(result)
    if is_blood:
        result = enhance_blood_fx(result)
    
    return result

def process_all_sprites():
    """Process all sprite PNGs in the components directory."""
    png_files = [f for f in os.listdir(COMPONENTS_DIR) 
                 if f.endswith('.png') and not f.endswith('.preview_crop.png')]
    
    print(f"Found {len(png_files)} sprite files to process")
    
    for filename in sorted(png_files):
        input_path = os.path.join(COMPONENTS_DIR, filename)
        output_path = input_path  # Overwrite in place
        
        print(f"\nProcessing: {filename}")
        
        try:
            # Load sprite
            img = load_sprite(input_path)
            original_size = img.size
            original_bbox = get_content_bbox(img)
            
            print(f"  Size: {original_size}, Content bbox: {original_bbox}")
            
            # Determine sprite type for special handling
            is_muzzle = 'muzzle' in filename.lower() or 'flash' in filename.lower()
            is_blood = 'blood' in filename.lower()
            
            # Enhance sprite
            enhanced = enhance_sprite(img, is_muzzle_flash=is_muzzle, is_blood=is_blood)
            
            # Ensure same dimensions
            if enhanced.size != original_size:
                enhanced = enhanced.resize(original_size, Image.NEAREST)
            
            # Save enhanced sprite
            save_sprite(enhanced, output_path)
            
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
