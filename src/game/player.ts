// ============================================================
// Little Italy: Turf Wars — Player Controller
// Movement, weapons, shooting, health
// ============================================================

import {
  PlayerState,
  WeaponState,
  WeaponDef,
  isWall,
} from './types';
import { WEAPONS } from './data';
import { AudioManager } from './audio';

export class PlayerController {
  state: PlayerState;

  constructor(startX: number, startY: number, startAngle: number) {
    this.state = {
      x: startX,
      y: startY,
      angle: startAngle,
      pitch: 0,
      health: 100,
      maxHealth: 100,
      armor: 0,
      weapons: [],
      currentWeaponIndex: 0,
      keys: 0,
      score: 0,
      bobPhase: 0,
      damageFlash: 0,
      isSprinting: false,
      isCrouching: false,
    };

    // Give starting weapons
    this.addWeapon(WEAPONS[0]); // knife
    this.addWeapon(WEAPONS[1]); // pistol
    this.addWeapon(WEAPONS[2]); // revolver
  }

  addWeapon(def: WeaponDef) {
    // Check if already have this weapon
    if (this.state.weapons.find((w) => w.id === def.id)) return;
    const ws: WeaponState = {
      ...def,
      currentAmmo: def.ammoCapacity === Infinity ? Infinity : def.ammoCapacity,
      isReloading: false,
      reloadTimer: 0,
      fireTimer: 0,
      recoilOffset: 0,
    };
    this.state.weapons.push(ws);
  }

  getCurrentWeapon(): WeaponState {
    return this.state.weapons[this.state.currentWeaponIndex];
  }

  switchWeapon(index: number) {
    if (index >= 0 && index < this.state.weapons.length) {
      this.state.currentWeaponIndex = index;
    }
  }

  switchToWeapon(id: string) {
    const idx = this.state.weapons.findIndex((w) => w.id === id);
    if (idx >= 0) this.state.currentWeaponIndex = idx;
  }

  takeDamage(amount: number): boolean {
    let dmg = amount;
    if (this.state.armor > 0) {
      const armorAbsorb = Math.min(this.state.armor, dmg * 0.6);
      this.state.armor -= armorAbsorb;
      dmg -= armorAbsorb;
    }
    this.state.health = Math.max(0, this.state.health - dmg);
    this.state.damageFlash = 0.3;
    return this.state.health <= 0;
  }

  heal(amount: number) {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  addAmmo(weaponId: string, amount: number) {
    const w = this.state.weapons.find((w) => w.id === weaponId);
    if (w && w.ammoCapacity !== Infinity) {
      w.currentAmmo = Math.min(w.ammoCapacity, w.currentAmmo + amount);
    }
  }

  update(dt: number, keys: Set<string>, mouseDeltaX: number, sensitivity: number, map: number[][], audio: AudioManager): { fired: boolean; moved: boolean } {
    let fired = false;
    let moved = false;
    const s = this.state;
    const weapon = this.getCurrentWeapon();

    // Mouse look
    s.angle += mouseDeltaX * sensitivity * 0.002;

    // Sprint & crouch
    s.isSprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
    s.isCrouching = keys.has('ControlLeft') || keys.has('ControlRight');

    // Movement speed
    const baseSpeed = s.isCrouching ? 1.5 : s.isSprinting ? 4.5 : 3.0;
    const speed = baseSpeed * dt;

    // Calculate movement
    let dx = 0, dy = 0;
    const cos = Math.cos(s.angle);
    const sin = Math.sin(s.angle);

    if (keys.has('KeyW') || keys.has('ArrowUp')) { dx += cos * speed; dy += sin * speed; moved = true; }
    if (keys.has('KeyS') || keys.has('ArrowDown')) { dx -= cos * speed; dy -= sin * speed; moved = true; }
    if (keys.has('KeyA') || keys.has('ArrowLeft')) { dx += sin * speed; dy -= cos * speed; moved = true; }
    if (keys.has('KeyD') || keys.has('ArrowRight')) { dx -= sin * speed; dy += cos * speed; moved = true; }

    // Collision detection with sliding
    const radius = 0.2;
    const newX = s.x + dx;
    const newY = s.y + dy;

    if (!isWall(map, newX + radius, s.y) && !isWall(map, newX - radius, s.y) &&
        !isWall(map, newX, s.y + radius) && !isWall(map, newX, s.y - radius)) {
      s.x = newX;
    }
    if (!isWall(map, s.x, newY + radius) && !isWall(map, s.x, newY - radius) &&
        !isWall(map, s.x + radius, newY) && !isWall(map, s.x - radius, newY)) {
      s.y = newY;
    }

    // Head bob
    if (moved) {
      s.bobPhase += dt * (s.isSprinting ? 14 : 10);
    } else {
      s.bobPhase *= 0.9;
    }

    // Weapon timers
    if (weapon.fireTimer > 0) weapon.fireTimer -= dt;
    if (weapon.recoilOffset > 0) weapon.recoilOffset *= 0.85;
    if (s.damageFlash > 0) s.damageFlash -= dt;

    // Reload
    if (weapon.isReloading) {
      weapon.reloadTimer -= dt;
      if (weapon.reloadTimer <= 0) {
        weapon.isReloading = false;
        weapon.currentAmmo = weapon.ammoCapacity;
        audio.playReload();
      }
    }

    // Reload key
    if (keys.has('KeyR') && !weapon.isReloading && weapon.ammoCapacity !== Infinity && weapon.currentAmmo < weapon.ammoCapacity) {
      weapon.isReloading = true;
      weapon.reloadTimer = weapon.reloadTime;
      audio.playReload();
    }

    // Weapon switching
    for (let i = 1; i <= 5; i++) {
      if (keys.has(`Digit${i}`)) {
        this.switchWeapon(i - 1);
        keys.delete(`Digit${i}`);
      }
    }

    // Shooting
    const mouseDown = keys.has('Mouse0');
    if ((mouseDown || keys.has('Space')) && !weapon.isReloading && weapon.fireTimer <= 0) {
      if (weapon.currentAmmo > 0 || weapon.ammoCapacity === Infinity) {
        if (weapon.ammoCapacity !== Infinity) {
          weapon.currentAmmo--;
        }
        weapon.fireTimer = 1 / weapon.fireRate;
        weapon.recoilOffset = 1;
        fired = true;

        if (weapon.id === 'shotgun') {
          audio.playShotgunBlast();
        } else if (weapon.id === 'knife') {
          // Melee - no sound needed
        } else {
          audio.playGunshot(weapon.auto);
        }
      } else {
        audio.playEmpty();
      }
    }

    return { fired, moved };
  }

  getWeaponDamage(): number {
    const w = this.getCurrentWeapon();
    if (w.id === 'shotgun') return w.damage; // shotgun pellets handled separately
    return w.damage;
  }

  getWeaponSpread(): number {
    return this.getCurrentWeapon().spread;
  }

  getWeaponRange(): number {
    return this.getCurrentWeapon().range;
  }

  isMelee(): boolean {
    return this.getCurrentWeapon().id === 'knife';
  }

  isShotgun(): boolean {
    return this.getCurrentWeapon().id === 'shotgun';
  }
}
