export type MarioSize = 'small' | 'super' | 'fire';

export type GameStatus = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export type Direction = 'left' | 'right';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type BlockType =
  | 'empty'
  | 'ground'
  | 'brick'
  | 'question_coin'
  | 'question_mushroom'
  | 'question_fireflower'
  | 'question_star'
  | 'empty_block'
  | 'pipe_top_left'
  | 'pipe_top_right'
  | 'pipe_body_left'
  | 'pipe_body_right'
  | 'stair_block'
  | 'flagpole_finial'
  | 'flagpole_pole'
  | 'castle_block'
  | 'castle_door'
  | 'castle_battlement';

export interface Block {
  type: BlockType;
  bumpOffset: number; // for head bump animation
  bumpVy: number;
  coinsLeft?: number;
}

export type EnemyType = 'goomba' | 'koopa' | 'piranha';

export type EnemyState = 'walking' | 'squished' | 'shell_idle' | 'shell_moving' | 'dead_falling';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  direction: Direction;
  state: EnemyState;
  stateTimer: number; // for squished duration, etc.
  pipeBaseY?: number; // for piranha plant
  animTimer: number;
}

export type PickupType = 'coin' | 'mushroom' | 'fireflower' | 'star' | 'oneup';

export interface Pickup {
  id: number;
  type: PickupType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  emerging: boolean;
  emergeTargetY: number;
  grounded: boolean;
  animTimer: number;
}

export interface Fireball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  bounces: number;
  animTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'brick' | 'sparkle' | 'smoke' | 'fire';
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  action: boolean;
  actionPressed: boolean;
}

export interface GameStats {
  score: number;
  coins: number;
  lives: number;
  time: number;
  world: string;
  highScore: number;
  status: GameStatus;
  marioSize: MarioSize;
  invincible: boolean;
}
