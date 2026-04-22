// ============================================================
// Little Italy: Turf Wars — Enemy AI System
// State machine: Idle, Patrol, Alert, Chase, Attack, Dead
// ============================================================

import { Enemy, EnemyState, Vec2, isWall } from './types';
import { ENEMY_DEFS, BOSS_DEFS } from './data';
import { AudioManager } from './audio';

export class EnemyAI {
  enemies: Enemy[] = [];

  spawn(type: string, x: number, y: number, isBoss: boolean = false): Enemy {
    const def = isBoss ? BOSS_DEFS[type] : ENEMY_DEFS[type];
    if (!def) throw new Error(`Unknown enemy type: ${type}`);

    const enemy: Enemy = {
      def,
      x,
      y,
      angle: Math.random() * Math.PI * 2,
      health: def.health,
      state: EnemyState.IDLE,
      alertTimer: 0,
      fireTimer: 0,
      patrolTarget: this.randomPatrolPoint(x, y),
      patrolTimer: 0,
      deathTimer: 0,
      hitFlash: 0,
      isBoss,
      justAttacked: false,
      bossPhase: 0,
      phaseThresholds: isBoss ? [0.66, 0.33] : [],
      hasSummoned: false,
      summonTimer: 0,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  private randomPatrolPoint(cx: number, cy: number): Vec2 {
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * 4;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  }

  update(dt: number, playerX: number, playerY: number, map: number[][], audio: AudioManager): Enemy[] {
    const newEnemies: Enemy[] = [];

    for (const e of this.enemies) {
      e.justAttacked = false;

      if (e.state === EnemyState.DEAD) {
        e.deathTimer += dt;
        continue;
      }

      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angleToPlayer = Math.atan2(dy, dx);

      // Line of sight check
      const hasLOS = this.checkLineOfSight(e.x, e.y, playerX, playerY, map);

      // State machine
      switch (e.state) {
        case EnemyState.IDLE:
          e.patrolTimer += dt;
          if (e.patrolTimer > 3) {
            e.patrolTarget = this.randomPatrolPoint(e.x, e.y);
            e.patrolTimer = 0;
            e.state = EnemyState.PATROL;
          }
          if (hasLOS && dist < 12) {
            e.state = EnemyState.ALERT;
            e.alertTimer = 0.5;
          }
          break;

        case EnemyState.PATROL:
          this.moveToTarget(e, e.patrolTarget.x, e.patrolTarget.y, dt, map);
          const pdx = e.patrolTarget.x - e.x;
          const pdy = e.patrolTarget.y - e.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < 0.5) {
            e.state = EnemyState.IDLE;
            e.patrolTimer = 0;
          }
          if (hasLOS && dist < 14) {
            e.state = EnemyState.ALERT;
            e.alertTimer = 0.5;
          }
          break;

        case EnemyState.ALERT:
          e.alertTimer -= dt;
          e.angle = angleToPlayer;
          if (e.alertTimer <= 0) {
            if (hasLOS && dist < e.def.range) {
              e.state = EnemyState.ATTACK;
            } else if (dist < 15) {
              e.state = EnemyState.CHASE;
            } else {
              e.state = EnemyState.IDLE;
            }
          }
          break;

        case EnemyState.CHASE:
          e.angle = angleToPlayer;
          if (hasLOS && dist < e.def.range) {
            e.state = EnemyState.ATTACK;
          } else if (!hasLOS || dist > 18) {
            e.state = EnemyState.ALERT;
            e.alertTimer = 2;
          } else {
            this.moveToTarget(e, playerX, playerY, dt, map);
          }
          break;

        case EnemyState.ATTACK:
          e.angle = angleToPlayer;
          e.fireTimer -= dt;
          if (e.fireTimer <= 0 && hasLOS && dist < e.def.range) {
            // Boss special behavior
            if (e.isBoss) {
              this.bossAttack(e, dist, angleToPlayer, map, newEnemies, audio);
            } else {
              this.enemyAttack(e, dist, audio);
            }
            e.justAttacked = true;
            e.fireTimer = 1 / e.def.fireRate;
          }
          // Strafe
          if (dist < 5) {
            const strafeAngle = angleToPlayer + Math.PI / 2 * (Math.sin(Date.now() * 0.003) > 0 ? 1 : -1);
            const sx = e.x + Math.cos(strafeAngle) * e.def.speed * dt * 0.5;
            const sy = e.y + Math.sin(strafeAngle) * e.def.speed * dt * 0.5;
            if (!isWall(map, sx, sy)) { e.x = sx; e.y = sy; }
          }
          if (!hasLOS || dist > e.def.range * 1.5) {
            e.state = EnemyState.CHASE;
          }
          break;
      }

      // Hit flash decay
      if (e.hitFlash > 0) e.hitFlash -= dt * 3;

      // Boss summoning
      if (e.isBoss && e.summonTimer > 0) {
        e.summonTimer -= dt;
      }
    }

    // Remove old dead enemies
    this.enemies = this.enemies.filter((e) => e.state !== EnemyState.DEAD || e.deathTimer < 3);

    return newEnemies;
  }

  private moveToTarget(e: Enemy, tx: number, ty: number, dt: number, map: number[][]) {
    const dx = tx - e.x;
    const dy = ty - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.1) return;

    const speed = e.def.speed * dt;
    const nx = dx / dist;
    const ny = dy / dist;

    // Try direct movement
    const newX = e.x + nx * speed;
    const newY = e.y + ny * speed;

    if (!isWall(map, newX, e.y)) e.x = newX;
    if (!isWall(map, e.x, newY)) e.y = newY;

    // If stuck, try sliding
    if (Math.abs(e.x - newX) < 0.01 && Math.abs(e.y - newY) < 0.01) {
      const perpX = -ny * speed;
      const perpY = nx * speed;
      if (!isWall(map, e.x + perpX, e.y)) e.x += perpX;
      else if (!isWall(map, e.x, e.y + perpY)) e.y += perpY;
    }
  }

  private checkLineOfSight(x1: number, y1: number, x2: number, y2: number, map: number[][]): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist * 4);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cx = x1 + dx * t;
      const cy = y1 + dy * t;
      if (isWall(map, cx, cy)) return false;
    }
    return true;
  }

  private enemyAttack(_e: Enemy, dist: number, _audio: AudioManager) {
    // Simple attack: deal damage if close enough
    if (_e.def.behavior === 'melee' && dist < _e.def.range) {
      // Melee attack - damage will be applied by game engine
    }
    // Ranged attacks handled by game engine via bullet system
  }

  private bossAttack(e: Enemy, dist: number, angle: number, map: number[][], newEnemies: Enemy[], _audio: AudioManager) {
    const bossId = e.def.id;

    // Phase transitions
    const healthRatio = e.health / e.def.health;
    for (let i = 0; i < e.phaseThresholds.length; i++) {
      if (healthRatio <= e.phaseThresholds[i] && e.bossPhase <= i) {
        e.bossPhase = i + 1;
        // Enraged - faster fire rate
        e.def.fireRate *= 1.3;
        e.def.speed *= 1.2;
      }
    }

    // Boss-specific behaviors
    switch (bossId) {
      case 'little_pete':
        // Simple: just shoots faster when low health
        break;

      case 'tony_two_toes':
        // Summons a thug at phase 1
        if (e.bossPhase >= 1 && !e.hasSummoned) {
          e.hasSummoned = true;
          const angle = Math.random() * Math.PI * 2;
          const sx = e.x + Math.cos(angle) * 3;
          const sy = e.y + Math.sin(angle) * 3;
          if (!isWall(map, sx, sy)) {
            const thug = this.spawn('thug', sx, sy);
            thug.state = EnemyState.CHASE;
            newEnemies.push(thug);
          }
        }
        break;

      case 'big_sal':
        // Charges at player when low health
        if (e.bossPhase >= 1 && dist > 3) {
          this.moveToTarget(e, e.x + Math.cos(angle) * 2, e.y + Math.sin(angle) * 2, 0.016, map);
        }
        break;

      case 'the_don':
        // Summons enforcers, uses multiple attack patterns
        if (e.bossPhase >= 1 && !e.hasSummoned) {
          e.hasSummoned = true;
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * Math.PI * 2;
            const sx = e.x + Math.cos(a) * 4;
            const sy = e.y + Math.sin(a) * 4;
            if (!isWall(map, sx, sy)) {
              const enforcer = this.spawn('enforcer', sx, sy);
              enforcer.state = EnemyState.CHASE;
              newEnemies.push(enforcer);
            }
          }
        }
        if (e.bossPhase >= 2 && e.summonTimer <= 0) {
          e.summonTimer = 10;
          const a = Math.random() * Math.PI * 2;
          const sx = e.x + Math.cos(a) * 5;
          const sy = e.y + Math.sin(a) * 5;
          if (!isWall(map, sx, sy)) {
            const gunman = this.spawn('gunman', sx, sy);
            gunman.state = EnemyState.CHASE;
            newEnemies.push(gunman);
          }
        }
        break;
    }
  }

  damageEnemy(enemy: Enemy, amount: number, audio: AudioManager): boolean {
    enemy.health -= amount;
    enemy.hitFlash = 1;
    enemy.state = EnemyState.CHASE;
    audio.playEnemyHit();

    if (enemy.health <= 0) {
      enemy.state = EnemyState.DEAD;
      enemy.deathTimer = 0;
      audio.playEnemyDeath();
      return true; // killed
    }
    return false;
  }

  getActiveEnemies(): Enemy[] {
    return this.enemies.filter((e) => e.state !== EnemyState.DEAD);
  }

  areAllDead(): boolean {
    return this.enemies.every((e) => e.state === EnemyState.DEAD);
  }

  clear() {
    this.enemies = [];
  }
}
