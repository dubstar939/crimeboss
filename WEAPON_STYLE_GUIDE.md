# WEAPON STYLE GUIDE IMPLEMENTATION

This document describes the pixel-art FPS weapon animation system implemented for the Little Italy: Turf Wars game engine.

## 1. Visual Identity

### Perspective
- **True FPS hand-held perspective** (Doom/Build-engine inspired)
- Centered or slightly right-biased positioning
- Consistent across all weapon types

### Silhouette Rules
- Strong, readable shapes with no ambiguous edges
- Avoid micro-details that blur at 1× scale
- Clear barrel, grip, and mechanical feature definition

### Palette Guidelines
- **4–8 shades per material**
- **Hard ramps** (no gradients)
- **Metals**: cool grays + 1 highlight tone
- **Wood**: warm browns with 2-tone grain
- **Plastics**: flat mid-tones with minimal specular

### Lighting
- Single top-front light source
- Consistent highlight direction across all frames
- No bloom, no glow, no soft shading

### Outlines
- 1-pixel dark outline on exterior edges
- No outlines on interior mechanical details unless needed for clarity

### Anti-aliasing
- Manual AA only
- Never use blur or automatic smoothing

---

## 2. Weapon Categories & Animation Rules

### Pistols / Revolvers
- Compact silhouette
- Barrel and cylinder readable at 1×
- **Recoil frames**: 2–3 px vertical rise
- **Fire animation**: 4 frames

### Shotguns
- Long silhouette with clear pump or break action
- **Muzzle flash**: wide, triangular, 2–3 frames
- **Reload**: hand + shell visible (12 frames)

### SMGs / Tommyguns
- Boxy silhouette
- Drum or stick magazine readable
- **Firing animation**: horizontal shake + muzzle flash
- **Flash frames**: 3 frames

### Knives / Melee
- High-contrast blade
- **Slash frames**: 3–5 frames with motion arcs
- **Idle**: subtle sway
- **Melee animation**: 8 frames total

### Snipers
- Long silhouette
- **Scope highlight**: 1–2 px reflection
- **Fire frame**: heavy recoil (4–6 px rise)

---

## 3. Naming Convention (Future-Proof)

### Base Format
```
weapon_<type>_<action>_<frame>.png
```

### Weapon Types
| Type | Description |
|------|-------------|
| `pistol` | Standard handgun |
| `revolver` | Cylinder revolver |
| `shotgun` | Pump-action shotgun |
| `smg` | Submachine gun |
| `tommygun` | Thompson SMG |
| `knife` | Melee blade |
| `sniper` | Scoped rifle |
| `gs` | Golden/special weapon |

### Actions
| Action | Description | Frame Count |
|--------|-------------|-------------|
| `idle` | Idle sway animation | 3 frames |
| `raise` | Weapon raise transition | 4–6 frames |
| `lower` | Weapon lower transition | 4–6 frames |
| `fire` | Firing sequence | 3–5 frames |
| `reload` | Reload animation | 6–12 frames |
| `melee` | Melee attack arc | 3–7 frames |
| `inspect` | Weapon inspection | Variable |
| `flash` | Muzzle flash overlay | 2–3 frames |
| `top` | Top-down view (special) | Variable |
| `bottom` | Bottom-up view (special) | Variable |

### Frame Indexing Rules
- **Always zero-padded** to 2 digits (00, 01, 02, ...)
- **Always sequential**
- **Always continuous**

### Examples
```
weapon_revolver_fire_00.png
weapon_revolver_fire_01.png
weapon_revolver_fire_02.png
weapon_revolver_fire_03.png

weapon_knife_melee_00.png
weapon_knife_melee_01.png
...
weapon_knife_melee_07.png

weapon_tommygun_flash_00.png
weapon_tommygun_flash_01.png
weapon_tommygun_flash_02.png
```

### Sprite Sheets (Optional)
```
weapon_<type>_<action>_sheet.png
```

---

## 4. Frame Timing Chart (60 FPS Optimized)

### Idle Animation
```
Frames: 2–3
Timing: 120–160 ms per frame
Motion: 1–2 px bob
```

### Raise / Lower Transitions
```
Frames: 4–6
Timing: 40–60 ms per frame
Motion: Smooth interpolation
```

### Fire Sequence
```
Frame 0 — Muzzle flash     (30 ms)
Frame 1 — Recoil peak      (40 ms)
Frame 2 — Recoil settle    (50 ms)
Frame 3 — Return to idle   (60 ms)
Total: ~180 ms
```

### Reload Sequence
```
Frames: 6–12
Timing: 50–80 ms per frame
Note: Hands must remain consistent across frames
```

### Melee Attack
```
Frames: 3–7
Timing: 30–50 ms per frame
Motion: Fast arc with stretched silhouettes
```

### Sniper Fire (Heavy Recoil)
```
Frame 0 — Flash            (30 ms)
Frame 1 — Heavy recoil     (60 ms)
Frame 2 — Settle           (80 ms)
Frame 3 — Return           (100 ms)
Total: ~270 ms
```

---

## 5. Implementation Details

### TypeScript Types (`src/game/types.ts`)

```typescript
export type WeaponType = 'pistol' | 'revolver' | 'shotgun' | 'smg' | 'tommygun' | 'knife' | 'sniper' | 'gs';

export type WeaponAction = 'idle' | 'raise' | 'lower' | 'fire' | 'reload' | 'melee' | 'inspect' | 'flash' | 'top' | 'bottom';

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
  weaponType: WeaponType;
  animFrames: {
    idle: number;
    raise: number;
    lower: number;
    fire: number;
    reload: number;
    melee: number;
  };
}
```

### Texture Loader API (`src/game/textures.ts`)

```typescript
// Get specific weapon animation frame
export function getWeaponAnimationFrame(
  weaponType: WeaponType, 
  action: WeaponAction, 
  frameIndex: number
): Uint8Array | null;

// Get available frame count for an animation
export function getWeaponAnimFrameCount(
  weaponType: WeaponType, 
  action: WeaponAction
): number;

// Legacy support - base weapon sprite
export function getWeaponSprite(weaponId: string): Uint8Array;
```

### Usage Example

```typescript
import { getWeaponAnimationFrame, getWeaponAnimFrameCount } from './textures';
import { WeaponType, WeaponAction } from './types';

// During render loop
const frameIdx = Math.floor(Date.now() / 50) % getWeaponAnimFrameCount('revolver', 'fire');
const sprite = getWeaponAnimationFrame('revolver', 'fire', frameIdx);

if (sprite) {
  // Render the sprite
  ctx.drawImage(/* ... */);
}
```

---

## 6. Current Asset Inventory

### Loaded Sprites (as of implementation)

#### Base Weapons
- `weapon_knife` (knife.png)
- `weapon_pistol` (revolver.png)
- `weapon_revolver` (revolver.png)
- `weapon_tommygun` (tommygun.png)
- `weapon_shotgun` (shotgun.png)

#### Knife Melee Frames
- `weapon_knife_melee_00` through `weapon_knife_melee_07` (8 frames)

#### Tommy Gun Flash
- `weapon_tommygun_flash_00` through `weapon_tommygun_flash_02` (3 frames)

#### Sniper Frames
- `weapon_sniper_idle_00` through `weapon_sniper_idle_02` (3 frames)
- `weapon_sniper_fire_00` through `weapon_sniper_fire_02` (3 frames)

#### Enemy Animation (ggp2)
- `ggp2_top_0` through `ggp2_top_3`
- `ggp2_bottom_0` through `ggp2_bottom_3`

---

## 7. Legacy Compatibility

The system maintains backward compatibility:

1. **Old names accepted**: `getWeaponSprite()` still works with weapon IDs
2. **New names output**: New code should use `getWeaponAnimationFrame()`
3. **Patches overwrite old files**: Updates replace sprites without deletion
4. **No directory renames**: Asset paths remain stable

---

## 8. Future Extensions

### Planned Additions
- Sprite sheet generation pipeline
- Automated frame interpolation tools
- Vercel deploy safety checks
- Qwen Coder integration patches

### Recommended Workflow
1. Create new weapon sprites following naming convention
2. Add imports to `textures.ts`
3. Register in `initializeSprites()`
4. Update `WEAPONS` array in `data.ts` with frame counts
5. Test animations at 60 FPS

---

## 9. File Structure

```
src/
├── components/          # PNG sprite assets
│   ├── knife.png
│   ├── knife_frame_0.png
│   ├── ...
│   ├── tommygunflash1.png
│   └── ...
├── game/
│   ├── types.ts         # WeaponType, WeaponAction, WeaponDef
│   ├── data.ts          # WEAPONS array with animFrames
│   ├── textures.ts      # Sprite loading & retrieval API
│   ├── engine.ts        # Render loop integration
│   └── player.ts        # Weapon state management
```

---

## 10. Quick Reference

### Creating a New Weapon Animation

1. **Name files correctly**: `weapon_<type>_<action>_<frame>.png`
2. **Zero-pad frames**: 00, 01, 02, not 0, 1, 2
3. **Follow timing chart**: Use recommended frame durations
4. **Maintain consistency**: Same hand position across reload frames
5. **Test at 1× scale**: Ensure readability without zoom

### Frame Count Guidelines

| Animation | Min Frames | Max Frames |
|-----------|------------|------------|
| Idle      | 2          | 3          |
| Raise     | 4          | 6          |
| Lower     | 4          | 6          |
| Fire      | 3          | 5          |
| Reload    | 6          | 12         |
| Melee     | 3          | 7          |

---

*Document generated for Little Italy: Turf Wars FPS Engine*
*Last updated: 2024*
