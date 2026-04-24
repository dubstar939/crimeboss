# TypeScript Strict Mode Fixes Required

After enabling stricter TypeScript options (`noUncheckedIndexedAccess`, `noImplicitReturns`), the compiler has identified **60+ type safety issues** that need to be addressed.

## Summary by Category

### 1. Array Index Access (35+ errors)
**Cause:** `noUncheckedIndexedAccess` now requires checking for `undefined` when accessing arrays by index.

**Files Affected:**
- `src/game/engine.ts` - bullet/particle array access in loops
- `src/game/audio.ts` - chord array access  
- `src/game/enemy.ts` - phaseThresholds array access

**Pattern to Fix:**
```typescript
// ❌ Before (now error)
for (let i = this.bullets.length - 1; i >= 0; i--) {
  const bullet = this.bullets[i]; // possibly undefined
  bullet.x += moveX; // error
}

// ✅ After (safe)
for (let i = this.bullets.length - 1; i >= 0; i--) {
  const bullet = this.bullets[i];
  if (!bullet) continue; // or use non-null assertion if certain
  bullet.x += moveX;
}

// OR better - use filter/map to avoid index access
this.bullets = this.bullets.filter(bullet => {
  bullet.x += bullet.dx * bulletSpeed * dt;
  // return true to keep, false to remove
});
```

### 2. Optional Object Properties (20+ errors)
**Cause:** Accessing properties on objects that could be `undefined`.

**Files Affected:**
- `src/components/Game.tsx` - `level` from LEVELS array
- `src/game/engine.ts` - `level` variable throughout loadLevel()

**Pattern to Fix:**
```typescript
// ❌ Before
const level = LEVELS[idx];
this.map = parseMap(level); // error: level possibly undefined

// ✅ After
if (idx < 0 || idx >= LEVELS.length) return;
const level = LEVELS[idx]!; // non-null assertion after bounds check
// OR
const level = LEVELS[idx];
if (!level) return;
this.map = parseMap(level);
```

### 3. Implicit Return Values (5+ errors)
**Cause:** `noImplicitReturns` requires all code paths to return a value.

**Check these functions:**
- Review any function with conditional returns
- Ensure all branches return appropriate values

## Priority Fixes

### High Priority (Breaks Build)

#### File: `src/game/engine.ts`

**Lines 371-408: Bullet Update Loop**
```typescript
private updateBullets(dt: number) {
  const bulletSpeed = 30;

  for (let i = this.bullets.length - 1; i >= 0; i--) {
    const bullet = this.bullets[i];
    if (!bullet) continue; // ADD THIS CHECK
    
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
```

**Lines 503-509: Particle Update Loop**
```typescript
private updateParticles(dt: number) {
  for (let i = this.particles.length - 1; i >= 0; i--) {
    const particle = this.particles[i];
    if (!particle) continue; // ADD THIS CHECK
    
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    if (particle.life <= 0) this.particles.splice(i, 1);
  }
}
```

**Lines 206-244: loadLevel Method**
```typescript
loadLevel(idx: number) {
  if (idx < 0 || idx >= LEVELS.length) return;

  this.currentLevelIdx = idx;
  const level = LEVELS[idx]!; // Add non-null assertion after bounds check
  
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
```

#### File: `src/components/Game.tsx`

**Lines ~248-317: Level Data Access**
```typescript
// Find where 'level' is accessed and add null checks
const level = LEVELS[this.currentLevelIdx];
if (!level) return null; // or handle appropriately

// Then safe to use level.name, level.description, etc.
```

#### File: `src/game/audio.ts`

**Lines 266, 277, 314: Chord Array Access**
```typescript
startMusic(tempo: number = 100) {
  // ... existing code ...
  
  const playBeat = () => {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const chord = chords[chordIndex % chords.length];
    if (!chord) return; // ADD NULL CHECK
    
    // Bass note
    const bass = this.ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = chord[0] / 2; // Now safe
    
    // ... rest of function using chord safely ...
    
    // Walking bass line
    if (beatIndex % 4 < 2) {
      const walk = this.ctx.createOscillator();
      walk.type = 'sine';
      const freqIndex = beatIndex % 2 === 0 ? 0 : 1;
      walk.frequency.value = chord[freqIndex] * 1.5; // Now safe
      // ...
    }
  };
}
```

#### File: `src/game/enemy.ts`

**Line 225: Phase Thresholds Access**
```typescript
private bossAttack(e: Enemy, dist: number, angle: number, map: number[][], newEnemies: Enemy[], _audio: AudioManager) {
  const bossId = e.def.id;

  // Phase transitions
  const healthRatio = e.health / e.def.health;
  for (let i = 0; i < e.phaseThresholds.length; i++) {
    const threshold = e.phaseThresholds[i];
    if (threshold === undefined) continue; // ADD CHECK
    
    if (healthRatio <= threshold && e.bossPhase <= i) {
      e.bossPhase = i + 1;
      e.def.fireRate *= 1.3;
      e.def.speed *= 1.2;
    }
  }
  // ... rest of function
}
```

## Quick Fix Strategy

### Option 1: Conservative (Recommended)
Add proper null/undefined checks everywhere. This is safest and most maintainable.

**Time estimate:** 1-2 hours

### Option 2: Quick Fix
Use non-null assertions (`!`) where you're certain the value exists.

**Example:**
```typescript
const level = LEVELS[idx]!; // Trust that bounds check above is sufficient
const bullet = this.bullets[i]!; // Trust loop bounds
```

**Warning:** This bypasses type safety. Only use when absolutely certain.

**Time estimate:** 30 minutes

### Option 3: Hybrid Approach (Best Balance)
- Use proper checks for external data (LEVELS array, user input)
- Use non-null assertions for internal loops where bounds are guaranteed
- Refactor problematic patterns (like array splicing during iteration)

**Time estimate:** 45 minutes

## Recommended Actions

1. **Immediate (Today):** Apply Option 2 to get build passing
2. **Short-term (This Week):** Refactor bullet/particle loops to use filter pattern
3. **Medium-term (Next Sprint):** Implement proper validation for all external data access

## Verification

After applying fixes, run:
```bash
npx tsc --noEmit
```

Should return exit code 0 with no errors.

## Prevention

To prevent similar issues in the future:

1. **Enable these rules permanently** in `tsconfig.json` (already done ✓)
2. **Add ESLint rules** to catch issues earlier:
   ```json
   {
     "@typescript-eslint/no-unnecessary-condition": "error",
     "@typescript-eslint/prefer-nullish-coalescing": "warn"
   }
   ```
3. **Use array methods** (filter, map, forEach) instead of index-based loops
4. **Add runtime validation** for external data (API responses, localStorage)

---

## Additional Files to Review

While not showing errors now, proactively check:

- `src/game/player.ts` - weapon array access
- `src/game/textures.ts` - cache Map access
- `src/game/raycast.ts` - map boundary checks

These may have similar patterns that could cause issues later.
