import { MarioSize, Rect } from './types';

export const SCORE_VALUES = {
  COIN: 200,
  BRICK_BREAK: 50,
  QUESTION_BLOCK: 100,
  MUSHROOM: 1000,
  FIREFLOWER: 1000,
  STAR: 1000,
  STOMP_BASE: 100,
  FLAGPOLE_MAX: 5000,
};

/**
 * Calculates combo score for continuous stomps or shell kicks.
 * Sequence: 100, 200, 400, 800, 1000, 2000, 4000, 8000, then 1UP (-1 represents 1UP)
 */
export function calculateScoreForStomp(comboCount: number): { score: number; is1Up: boolean; label: string } {
  const steps = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
  const idx = Math.max(0, comboCount - 1);
  if (idx >= steps.length) {
    return { score: 0, is1Up: true, label: '1UP' };
  }
  const score = steps[idx];
  return { score, is1Up: false, label: `${score}` };
}

/**
 * Adds a coin and checks if 100 coins threshold triggers an extra life.
 */
export function addCoin(
  currentCoins: number,
  currentLives: number,
  currentScore: number
): { coins: number; lives: number; score: number; awardedLife: boolean } {
  const newCoins = currentCoins + 1;
  const newScore = currentScore + SCORE_VALUES.COIN;
  if (newCoins >= 100) {
    return {
      coins: newCoins % 100,
      lives: currentLives + 1,
      score: newScore,
      awardedLife: true,
    };
  }
  return {
    coins: newCoins,
    lives: currentLives,
    score: newScore,
    awardedLife: false,
  };
}

/**
 * Applies a powerup pickup to Mario.
 */
export function applyPowerUp(
  currentState: MarioSize,
  pickup: 'mushroom' | 'fireflower' | 'star' | 'oneup',
  currentLives: number,
  currentScore: number
): {
  newSize: MarioSize;
  newLives: number;
  newScore: number;
  isGrowth: boolean;
  scoreText: string;
} {
  if (pickup === 'oneup') {
    return {
      newSize: currentState,
      newLives: currentLives + 1,
      newScore: currentScore,
      isGrowth: false,
      scoreText: '1UP',
    };
  }

  if (pickup === 'mushroom') {
    const isGrowth = currentState === 'small';
    const newSize: MarioSize = currentState === 'small' ? 'super' : currentState;
    return {
      newSize,
      newLives: currentLives,
      newScore: currentScore + SCORE_VALUES.MUSHROOM,
      isGrowth,
      scoreText: '1000',
    };
  }

  if (pickup === 'fireflower') {
    const isGrowth = currentState !== 'fire';
    return {
      newSize: 'fire',
      newLives: currentLives,
      newScore: currentScore + SCORE_VALUES.FIREFLOWER,
      isGrowth,
      scoreText: '1000',
    };
  }

  // Star
  return {
    newSize: currentState,
    newLives: currentLives,
    newScore: currentScore + SCORE_VALUES.STAR,
    isGrowth: false,
    scoreText: '1000',
  };
}

/**
 * Applies damage to Mario.
 * If Super or Fire -> drops to Small with 2.0s iframe invulnerability.
 * If Small -> returns dead: true.
 */
export function applyDamage(
  currentState: MarioSize,
  invincibleTimer: number
): {
  newSize: MarioSize;
  isDead: boolean;
  iframes: number;
} {
  // If in iframes or star power, ignore damage
  if (invincibleTimer > 0) {
    return {
      newSize: currentState,
      isDead: false,
      iframes: invincibleTimer,
    };
  }

  if (currentState === 'fire' || currentState === 'super') {
    return {
      newSize: 'small',
      isDead: false,
      iframes: 2.0, // 2 seconds of invulnerability flashing
    };
  }

  return {
    newSize: 'small',
    isDead: true,
    iframes: 0,
  };
}

/**
 * Checks standard 2D AABB bounding box overlap
 */
export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Calculates penetration depth for AABB collision resolution
 */
export function getAABBOverlap(a: Rect, b: Rect): { ox: number; oy: number } {
  const halfAw = a.w / 2;
  const halfAh = a.h / 2;
  const halfBw = b.w / 2;
  const halfBh = b.h / 2;

  const centerAx = a.x + halfAw;
  const centerAy = a.y + halfAh;
  const centerBx = b.x + halfBw;
  const centerBy = b.y + halfBh;

  const dx = centerAx - centerBx;
  const dy = centerAy - centerBy;

  const ox = halfAw + halfBw - Math.abs(dx);
  const oy = halfAh + halfBh - Math.abs(dy);

  return { ox, oy };
}

/**
 * Determines if Mario stomps an enemy from above.
 * Stomp occurs if Mario is moving downward (vy > 0) and Mario's feet are near/above enemy midline.
 */
export function isStompingEnemy(
  marioRect: Rect,
  marioVy: number,
  enemyRect: Rect
): boolean {
  if (marioVy <= -20) return false;
  const marioBottom = marioRect.y + marioRect.h;
  const enemyTop = enemyRect.y;
  const enemyMid = enemyRect.y + enemyRect.h * 0.6;
  return marioBottom <= enemyMid && marioBottom >= enemyTop - 6;
}

/**
 * Calculates flagpole bonus based on height reached on the pole.
 * Higher contact = up to 5,000 points!
 */
export function calculateFlagpoleScore(contactY: number, topY: number, bottomY: number): number {
  const totalH = Math.max(1, bottomY - topY);
  const relativeH = Math.max(0, Math.min(1, (bottomY - contactY) / totalH));

  if (relativeH >= 0.85) return 5000;
  if (relativeH >= 0.65) return 2000;
  if (relativeH >= 0.45) return 800;
  if (relativeH >= 0.25) return 400;
  return 100;
}

/**
 * Formats score with 6-digit leading zeros like classic arcade Mario.
 */
export function formatMarioScore(score: number): string {
  return Math.max(0, Math.floor(score)).toString().padStart(6, '0');
}

/**
 * Formats timer with 3 digits.
 */
export function formatMarioTime(seconds: number): string {
  return Math.max(0, Math.floor(seconds)).toString().padStart(3, '0');
}

/**
 * Formats coins with 2 digits.
 */
export function formatMarioCoins(coins: number): string {
  return Math.max(0, Math.floor(coins)).toString().padStart(2, '0');
}
