import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScoreForStomp,
  addCoin,
  applyPowerUp,
  applyDamage,
  checkAABB,
  getAABBOverlap,
  isStompingEnemy,
  calculateFlagpoleScore,
  formatMarioScore,
  formatMarioTime,
  formatMarioCoins,
} from './rules';

test('stomp combo scoring increments through steps and yields 1UP', () => {
  const step1 = calculateScoreForStomp(1);
  assert.equal(step1.score, 100);
  assert.equal(step1.is1Up, false);

  const step2 = calculateScoreForStomp(2);
  assert.equal(step2.score, 200);

  const step3 = calculateScoreForStomp(3);
  assert.equal(step3.score, 400);

  const step8 = calculateScoreForStomp(8);
  assert.equal(step8.score, 8000);
  assert.equal(step8.is1Up, false);

  const step9 = calculateScoreForStomp(9);
  assert.equal(step9.score, 0);
  assert.equal(step9.is1Up, true);
  assert.equal(step9.label, '1UP');
});

test('coin collection increments and awards 1UP on 100 coins', () => {
  const c1 = addCoin(0, 3, 0);
  assert.equal(c1.coins, 1);
  assert.equal(c1.lives, 3);
  assert.equal(c1.score, 200);
  assert.equal(c1.awardedLife, false);

  const c100 = addCoin(99, 3, 1000);
  assert.equal(c100.coins, 0);
  assert.equal(c100.lives, 4);
  assert.equal(c100.awardedLife, true);
  assert.equal(c100.score, 1200);
});

test('powerup pickup transitions sizes accurately', () => {
  // Small Mario gets mushroom -> Super Mario
  const p1 = applyPowerUp('small', 'mushroom', 3, 0);
  assert.equal(p1.newSize, 'super');
  assert.equal(p1.isGrowth, true);
  assert.equal(p1.newScore, 1000);

  // Super Mario gets mushroom -> stays Super, gains points
  const p2 = applyPowerUp('super', 'mushroom', 3, 1000);
  assert.equal(p2.newSize, 'super');
  assert.equal(p2.isGrowth, false);
  assert.equal(p2.newScore, 2000);

  // Super Mario gets fire flower -> Fire Mario
  const p3 = applyPowerUp('super', 'fireflower', 3, 2000);
  assert.equal(p3.newSize, 'fire');
  assert.equal(p3.isGrowth, true);
  assert.equal(p3.newScore, 3000);

  // 1UP mushroom awards a life
  const p4 = applyPowerUp('small', 'oneup', 3, 0);
  assert.equal(p4.newLives, 4);
  assert.equal(p4.scoreText, '1UP');
});

test('damage application handles sizes, death, and invulnerability iframes', () => {
  // Fire Mario takes damage -> drops to small with 2.0s iframes
  const d1 = applyDamage('fire', 0);
  assert.equal(d1.newSize, 'small');
  assert.equal(d1.isDead, false);
  assert.equal(d1.iframes, 2.0);

  // Super Mario takes damage -> drops to small with 2.0s iframes
  const d2 = applyDamage('super', 0);
  assert.equal(d2.newSize, 'small');
  assert.equal(d2.isDead, false);
  assert.equal(d2.iframes, 2.0);

  // Small Mario taking damage -> dead
  const d3 = applyDamage('small', 0);
  assert.equal(d3.isDead, true);

  // Mario in invulnerability iframes ignores damage
  const d4 = applyDamage('small', 1.5);
  assert.equal(d4.isDead, false);
  assert.equal(d4.iframes, 1.5);
});

test('AABB collision and overlap calculations are exact', () => {
  const boxA = { x: 10, y: 10, w: 20, h: 20 };
  const boxB = { x: 20, y: 15, w: 20, h: 20 };
  const boxC = { x: 50, y: 50, w: 10, h: 10 };

  assert.equal(checkAABB(boxA, boxB), true);
  assert.equal(checkAABB(boxA, boxC), false);

  const overlap = getAABBOverlap(boxA, boxB);
  assert.equal(overlap.ox, 10); // 20 - 10
  assert.equal(overlap.oy, 15); // 25 - 10
});

test('stomp detection detects top landing versus side impact', () => {
  const enemy = { x: 100, y: 100, w: 16, h: 16 };

  // Mario moving down, feet hitting top of enemy -> stomping
  const marioAbove = { x: 102, y: 88, w: 14, h: 16 };
  assert.equal(isStompingEnemy(marioAbove, 120, enemy), true);

  // Mario jumping up into enemy from below -> NOT stomping
  assert.equal(isStompingEnemy(marioAbove, -100, enemy), false);

  // Mario at same height running into enemy from side -> NOT stomping
  const marioSide = { x: 90, y: 104, w: 14, h: 16 };
  assert.equal(isStompingEnemy(marioSide, 10, enemy), false);
});

test('flagpole scoring scales with height', () => {
  const topY = 40;
  const bottomY = 200;

  // Contact near the top
  const scoreHigh = calculateFlagpoleScore(50, topY, bottomY);
  assert.equal(scoreHigh, 5000);

  // Contact in middle
  const scoreMid = calculateFlagpoleScore(110, topY, bottomY);
  assert.equal(scoreMid, 800);

  // Contact near bottom
  const scoreLow = calculateFlagpoleScore(190, topY, bottomY);
  assert.equal(scoreLow, 100);
});

test('formatting utilities output authentic retro digits', () => {
  assert.equal(formatMarioScore(1250), '001250');
  assert.equal(formatMarioScore(0), '000000');
  assert.equal(formatMarioTime(382.4), '382');
  assert.equal(formatMarioCoins(7), '07');
  assert.equal(formatMarioCoins(99), '99');
});
