// ============================================================
// Little Italy: Turf Wars — Event Emitter
// Simple pub/sub system for game state changes
// ============================================================

export type GameEventType = 
  | 'screen_change'
  | 'level_complete'
  | 'game_over'
  | 'victory'
  | 'player_damage'
  | 'enemy_killed'
  | 'item_pickup'
  | 'settings_change';

export interface GameEvent {
  type: GameEventType;
  payload?: unknown;
}

export type EventCallback = (event: GameEvent) => void;

export class EventEmitter {
  private listeners: Map<GameEventType, Set<EventCallback>> = new Map();

  on(event: GameEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: GameEventType, callback: EventCallback): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  emit(event: GameEvent): void {
    const set = this.listeners.get(event.type);
    if (set) {
      set.forEach(callback => callback(event));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
