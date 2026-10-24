import {
  Block,
  Direction,
  Enemy,
  Fireball,
  FloatingText,
  GameStats,
  GameStatus,
  InputState,
  MarioSize,
  Particle,
  Pickup,
  Rect,
} from './types';
import {
  addCoin,
  applyDamage,
  applyPowerUp,
  calculateFlagpoleScore,
  calculateScoreForStomp,
  checkAABB,
  getAABBOverlap,
  isStompingEnemy,
  SCORE_VALUES,
} from './rules';
import { soundChip } from './audio';
import { createLevel1, LEVEL_HEIGHT_PX, LEVEL_WIDTH_PX, LEVEL_HEIGHT_TILES, LEVEL_WIDTH_TILES, LevelData, TILE_SIZE } from './level';
import { GameRenderer, MarioRenderState } from './renderer';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: GameRenderer;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Level & World State
  private level: LevelData;
  private cameraX: number = 0;
  private screenShake: number = 0;
  private hitstopTimer: number = 0;

  // Mario Physics State
  private mario = {
    x: 40,
    y: 12 * TILE_SIZE,
    vx: 0,
    vy: 0,
    w: 14,
    h: 16,
    size: 'small' as MarioSize,
    direction: 'right' as Direction,
    isGrounded: false,
    isSkidding: false,
    isDead: false,
    deadTimer: 0,
    onPole: false,
    poleSliding: false,
    walkingToCastle: false,
    insideCastle: false,
    animTimer: 0,
    invincibleTimer: 0,
    starTimer: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    squashX: 1,
    squashY: 1,
    comboCount: 0,
  };

  // Active Entities
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private fireballs: Fireball[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Stats
  private stats: GameStats = {
    score: 0,
    coins: 0,
    lives: 3,
    time: 400,
    world: '1-1',
    highScore: 10000,
    status: 'title',
    marioSize: 'small',
    invincible: false,
  };

  private input: InputState = {
    left: false,
    right: false,
    down: false,
    jump: false,
    jumpPressed: false,
    action: false,
    actionPressed: false,
  };

  private onStatsUpdate?: (stats: GameStats) => void;
  private nextEntityId: number = 2000;

  constructor(canvas: HTMLCanvasElement, onStatsUpdate?: (stats: GameStats) => void) {
    this.canvas = canvas;
    this.renderer = new GameRenderer(canvas);
    this.onStatsUpdate = onStatsUpdate;
    this.level = createLevel1();
    this.enemies = [...this.level.enemies];
    this.pickups = [...this.level.initialPickups];

    // Load highscore
    const saved = localStorage.getItem('super_mario_high_score');
    if (saved) {
      this.stats.highScore = parseInt(saved, 10) || 10000;
    }
  }

  public setInput(input: InputState) {
    this.input = input;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }

  public start() {
    this.resetGame();
    this.stats.status = 'playing';
    document.body.dataset.state = 'playing';
    soundChip.startMusic();
    this.notifyStats();
  }

  public pause() {
    if (this.stats.status === 'playing') {
      this.stats.status = 'paused';
      document.body.dataset.state = 'paused';
      soundChip.stopMusic();
      this.notifyStats();
    }
  }

  public resume() {
    if (this.stats.status === 'paused') {
      this.stats.status = 'playing';
      document.body.dataset.state = 'playing';
      soundChip.startMusic();
      this.lastTime = performance.now();
      this.notifyStats();
    }
  }

  public resetGame() {
    this.level = createLevel1();
    this.enemies = [...this.level.enemies];
    this.pickups = [...this.level.initialPickups];
    this.fireballs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.cameraX = 0;
    this.screenShake = 0;
    this.hitstopTimer = 0;

    this.mario = {
      x: 40,
      y: 12 * TILE_SIZE,
      vx: 0,
      vy: 0,
      w: 14,
      h: 16,
      size: 'small',
      direction: 'right',
      isGrounded: false,
      isSkidding: false,
      isDead: false,
      deadTimer: 0,
      onPole: false,
      poleSliding: false,
      walkingToCastle: false,
      insideCastle: false,
      animTimer: 0,
      invincibleTimer: 0,
      starTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      squashX: 1,
      squashY: 1,
      comboCount: 0,
    };

    this.stats.score = 0;
    this.stats.coins = 0;
    this.stats.lives = 3;
    this.stats.time = 400;
    this.stats.marioSize = 'small';
    this.stats.invincible = false;
  }

  private respawnMarioAtCheckpoint() {
    this.mario.x = Math.max(40, this.cameraX + 40);
    this.mario.y = 8 * TILE_SIZE;
    this.mario.vx = 0;
    this.mario.vy = 0;
    this.mario.w = 14;
    this.mario.h = 16;
    this.mario.size = 'small';
    this.mario.isDead = false;
    this.mario.deadTimer = 0;
    this.mario.onPole = false;
    this.mario.poleSliding = false;
    this.mario.walkingToCastle = false;
    this.mario.insideCastle = false;
    this.mario.invincibleTimer = 3.0; // 3 seconds respawn protection
    this.stats.marioSize = 'small';
    this.stats.invincible = false;
    soundChip.startMusic();
    this.notifyStats();
  }

  public runLoop() {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (this.stats.status === 'playing') {
        this.update(dt);
      }

      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    soundChip.stopMusic();
  }

  private update(dt: number) {
    // 1. Time countdown
    if (!this.mario.onPole && !this.mario.isDead) {
      this.stats.time = Math.max(0, this.stats.time - dt * 1.5);
      if (this.stats.time <= 0) {
        this.killMario();
      }
    }

    // 2. Hitstop check (freeze physics on impact)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      return;
    }

    // 3. Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 12);
    }

    // 4. Update Mario
    this.updateMario(dt);

    // 5. Update Blocks
    this.updateBlocks(dt);

    // 6. Update Enemies
    this.updateEnemies(dt);

    // 7. Update Pickups
    this.updatePickups(dt);

    // 8. Update Fireballs
    this.updateFireballs(dt);

    // 9. Update Particles & Texts
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // 10. Update Camera
    this.updateCamera(dt);
  }

  private updateMario(dt: number) {
    const m = this.mario;

    // A. Dead Mario sequence
    if (m.isDead) {
      m.deadTimer += dt;
      if (m.deadTimer > 0.4) {
        m.vy += 800 * dt;
        m.y += m.vy * dt;
      }
      if (m.deadTimer > 3.0) {
        if (this.stats.lives > 0) {
          this.respawnMarioAtCheckpoint();
        } else {
          this.triggerGameOver();
        }
      }
      return;
    }

    // B. Flagpole celebration sequence
    if (m.onPole) {
      if (m.poleSliding) {
        m.y += 120 * dt;
        // Slide flag down simultaneously
        this.level.flagpole.flagY = Math.min(this.level.flagpole.bottomY - 16, this.level.flagpole.flagY + 120 * dt);

        if (m.y >= this.level.flagpole.bottomY - m.h) {
          m.y = this.level.flagpole.bottomY - m.h;
          m.poleSliding = false;
          m.walkingToCastle = true;
          m.direction = 'right';
          m.x += 12; // hop off pole to the right side
          soundChip.playStageClear();
        }
      } else if (m.walkingToCastle) {
        m.animTimer += dt;
        m.vx = 70;
        m.x += m.vx * dt;

        // Enter castle door
        if (m.x >= this.level.castle.doorX) {
          m.insideCastle = true;
          m.walkingToCastle = false;
          // Calculate time bonus!
          const timeBonus = Math.floor(this.stats.time) * 50;
          this.addScore(timeBonus, 'TIME BONUS');
          setTimeout(() => {
            this.triggerVictory();
          }, 1500);
        }
      }
      return;
    }

    // C. Invincibility timer
    if (m.invincibleTimer > 0) {
      m.invincibleTimer -= dt;
    }
    if (m.starTimer > 0) {
      m.starTimer -= dt;
      this.stats.invincible = true;
      if (m.starTimer <= 0) {
        this.stats.invincible = false;
      }
    }

    // Squash & Stretch recovery
    m.squashX += (1 - m.squashX) * Math.min(1, dt * 15);
    m.squashY += (1 - m.squashY) * Math.min(1, dt * 15);

    // Height sync with powerup size
    m.h = m.size === 'small' ? 16 : 30;

    // Coyote & Buffer timers
    if (m.isGrounded) {
      m.coyoteTimer = 0.1;
      m.comboCount = 0;
    } else {
      m.coyoteTimer = Math.max(0, m.coyoteTimer - dt);
    }

    if (this.input.jumpPressed) {
      m.jumpBufferTimer = 0.12;
    } else {
      m.jumpBufferTimer = Math.max(0, m.jumpBufferTimer - dt);
    }

    // D. Horizontal Movement
    const isRunning = this.input.action;
    const maxSpeed = isRunning ? 220 : 135;
    const accel = isRunning ? 550 : 420;
    const friction = 500;
    const skidFriction = 950;

    if (this.input.left) {
      m.direction = 'left';
      if (m.vx > 20) {
        // Skidding!
        m.isSkidding = true;
        m.vx -= skidFriction * dt;
        if (Math.random() < 0.3) this.createDust(m.x + m.w / 2, m.y + m.h);
      } else {
        m.isSkidding = false;
        m.vx = Math.max(-maxSpeed, m.vx - accel * dt);
      }
      m.animTimer += dt;
    } else if (this.input.right) {
      m.direction = 'right';
      if (m.vx < -20) {
        // Skidding!
        m.isSkidding = true;
        m.vx += skidFriction * dt;
        if (Math.random() < 0.3) this.createDust(m.x + m.w / 2, m.y + m.h);
      } else {
        m.isSkidding = false;
        m.vx = Math.min(maxSpeed, m.vx + accel * dt);
      }
      m.animTimer += dt;
    } else {
      m.isSkidding = false;
      // Decelerate smoothly to 0
      if (m.vx > 0) {
        m.vx = Math.max(0, m.vx - friction * dt);
      } else if (m.vx < 0) {
        m.vx = Math.min(0, m.vx + friction * dt);
      }
    }

    // E. Jump & Gravity
    const canJump = m.isGrounded || m.coyoteTimer > 0;
    if (m.jumpBufferTimer > 0 && canJump) {
      m.jumpBufferTimer = 0;
      m.coyoteTimer = 0;
      m.isGrounded = false;
      m.vy = m.size === 'small' ? -350 : -375;
      m.squashX = 0.85;
      m.squashY = 1.25;
      soundChip.playJump(m.size !== 'small');
      this.createDust(m.x + m.w / 2, m.y + m.h);
    }

    // Variable Jump Cut (release jump to cut jump height)
    if (!this.input.jump && m.vy < -60) {
      m.vy *= 0.45;
    }

    // Gravity
    m.vy = Math.min(500, m.vy + 980 * dt);

    // F. Fireball action
    if (m.size === 'fire' && this.input.actionPressed && this.fireballs.length < 2) {
      this.shootFireball();
    }

    // G. Apply physics & resolve tile collisions
    this.moveMarioWithTiles(dt);

    // Fall into pit
    if (m.y > LEVEL_HEIGHT_PX + 20) {
      this.killMario();
    }

    // Clamp Mario to camera left edge
    if (m.x < this.cameraX) {
      m.x = this.cameraX;
      m.vx = Math.max(0, m.vx);
    }
  }

  private moveMarioWithTiles(dt: number) {
    const m = this.mario;

    // 1. Move Horizontally
    m.x += m.vx * dt;
    let marioRect: Rect = { x: m.x, y: m.y, w: m.w, h: m.h };

    const nearbyTiles = this.getNearbyTiles(marioRect);
    for (const tile of nearbyTiles) {
      if (this.isSolidTile(tile.block.type)) {
        const tileRect: Rect = { x: tile.x, y: tile.y, w: TILE_SIZE, h: TILE_SIZE };
        if (checkAABB(marioRect, tileRect)) {
          const overlap = getAABBOverlap(marioRect, tileRect);
          if (overlap.ox < overlap.oy) {
            if (m.vx > 0) {
              m.x = tileRect.x - m.w;
            } else if (m.vx < 0) {
              m.x = tileRect.x + tileRect.w;
            }
            m.vx = 0;
            marioRect.x = m.x;
          }
        }
      }
    }

    // 2. Move Vertically
    m.y += m.vy * dt;
    marioRect = { x: m.x, y: m.y, w: m.w, h: m.h };
    m.isGrounded = false;

    const nearbyVerticalTiles = this.getNearbyTiles(marioRect);
    for (const tile of nearbyVerticalTiles) {
      if (this.isSolidTile(tile.block.type)) {
        const tileRect: Rect = { x: tile.x, y: tile.y, w: TILE_SIZE, h: TILE_SIZE };
        if (checkAABB(marioRect, tileRect)) {
          const overlap = getAABBOverlap(marioRect, tileRect);
          if (overlap.oy <= overlap.ox) {
            if (m.vy > 0) {
              // Landing on solid ground
              m.y = tileRect.y - m.h;
              m.vy = 0;
              if (!m.isGrounded) {
                m.squashX = 1.2;
                m.squashY = 0.8;
              }
              m.isGrounded = true;
            } else if (m.vy < 0) {
              // Hitting block from below!
              m.y = tileRect.y + tileRect.h;
              m.vy = 20;
              this.bumpBlock(tile.r, tile.c, tile.block);
            }
            marioRect.y = m.y;
          }
        }
      }
    }

    // Check flagpole touch
    const fp = this.level.flagpole;
    if (
      !m.onPole &&
      m.x + m.w >= fp.x &&
      m.x <= fp.x + 8 &&
      m.y + m.h >= fp.topY &&
      m.y <= fp.bottomY
    ) {
      this.triggerFlagpole(m.y);
    }
  }

  private triggerFlagpole(marioY: number) {
    const m = this.mario;
    m.onPole = true;
    m.poleSliding = true;
    m.vx = 0;
    m.vy = 0;
    m.x = this.level.flagpole.x - 4;

    const score = calculateFlagpoleScore(marioY, this.level.flagpole.topY, this.level.flagpole.bottomY);
    this.addScore(score, `${score}`);
    soundChip.playFlagpole();
  }

  private bumpBlock(r: number, c: number, block: Block) {
    block.bumpVy = -130;
    block.bumpOffset = 1;

    // Check if Question Block
    if (block.type.startsWith('question_')) {
      const type = block.type;
      block.type = 'empty_block';

      if (type === 'question_coin') {
        this.collectCoinFromBlock(c * TILE_SIZE + 3, r * TILE_SIZE - 12);
        soundChip.playCoin();
      } else if (type === 'question_mushroom') {
        // Spawn mushroom
        soundChip.playPowerUp();
        this.spawnPickup('mushroom', c * TILE_SIZE, r * TILE_SIZE);
      } else if (type === 'question_fireflower') {
        soundChip.playPowerUp();
        const pickupType = this.mario.size === 'small' ? 'mushroom' : 'fireflower';
        this.spawnPickup(pickupType, c * TILE_SIZE, r * TILE_SIZE);
      } else if (type === 'question_star') {
        soundChip.playPowerUp();
        this.spawnPickup('star', c * TILE_SIZE, r * TILE_SIZE);
      }
    } else if (block.type === 'brick') {
      if (block.coinsLeft && block.coinsLeft > 0) {
        block.coinsLeft--;
        this.collectCoinFromBlock(c * TILE_SIZE + 3, r * TILE_SIZE - 12);
        soundChip.playCoin();
        if (block.coinsLeft === 0) {
          block.type = 'empty_block';
        }
      } else if (this.mario.size !== 'small') {
        // Super Mario smashes the brick!
        block.type = 'empty';
        soundChip.playBreak();
        this.shatterBrick(c * TILE_SIZE, r * TILE_SIZE);
        this.addScore(SCORE_VALUES.BRICK_BREAK, '50');
        this.screenShake = 3;
        this.hitstopTimer = 0.04;
      } else {
        // Small Mario bumps brick
        soundChip.playBump();
      }
    }
  }

  private collectCoinFromBlock(x: number, y: number) {
    const res = addCoin(this.stats.coins, this.stats.lives, this.stats.score);
    this.stats.coins = res.coins;
    this.stats.lives = res.lives;
    this.stats.score = res.score;
    if (res.awardedLife) soundChip.playOneUp();

    this.floatingTexts.push({
      x: x + 6,
      y: y - 8,
      vy: -50,
      text: '200',
      color: '#ffffff',
      life: 0.8,
      maxLife: 0.8,
    });

    // Coin pop sparkle
    this.createSparkle(x + 5, y);
    this.notifyStats();
  }

  private spawnPickup(type: 'mushroom' | 'fireflower' | 'star' | 'oneup', x: number, y: number) {
    this.pickups.push({
      id: this.nextEntityId++,
      type,
      x,
      y,
      vx: type === 'fireflower' ? 0 : 45,
      vy: 0,
      w: 16,
      h: 16,
      emerging: true,
      emergeTargetY: y - 16,
      grounded: false,
      animTimer: 0,
    });
  }

  private shatterBrick(x: number, y: number) {
    const pieces = [
      { vx: -60, vy: -220 },
      { vx: 60, vy: -220 },
      { vx: -40, vy: -150 },
      { vx: 40, vy: -150 },
    ];
    for (const p of pieces) {
      this.particles.push({
        x: x + 4,
        y: y + 4,
        vx: p.vx,
        vy: p.vy,
        size: 5,
        color: '#b84418',
        life: 1.0,
        maxLife: 1.0,
        type: 'brick',
      });
    }
  }

  private shootFireball() {
    const m = this.mario;
    const dir = m.direction === 'right' ? 1 : -1;
    this.fireballs.push({
      id: this.nextEntityId++,
      x: m.x + (dir === 1 ? m.w + 2 : -10),
      y: m.y + 8,
      vx: dir * 240,
      vy: 60,
      w: 8,
      h: 8,
      bounces: 0,
      animTimer: 0,
    });
    soundChip.playFireball();
  }

  private updateBlocks(dt: number) {
    const tiles = this.level.tiles;
    for (let r = 0; r < tiles.length; r++) {
      for (let c = 0; c < tiles[0].length; c++) {
        const b = tiles[r][c];
        if (b.bumpOffset !== 0 || b.bumpVy !== 0) {
          b.bumpVy += 700 * dt;
          b.bumpOffset -= b.bumpVy * dt;
          if (b.bumpOffset <= 0) {
            b.bumpOffset = 0;
            b.bumpVy = 0;
          }
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    const m = this.mario;
    const marioRect: Rect = { x: m.x, y: m.y, w: m.w, h: m.h };

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Piranha plant animation
      if (e.type === 'piranha') {
        e.animTimer += dt;
        const marioDist = Math.abs(m.x - e.x);
        // Only emerge if Mario is within 250px and not standing directly on pipe
        const nearPipe = marioDist < 24;
        if (!nearPipe && marioDist < 260) {
          const cycle = (Math.sin(e.animTimer * 2) + 1) / 2; // 0 to 1
          e.y = (e.pipeBaseY || 160) - cycle * 22;
        }

        // Piranha collision with Mario
        if (checkAABB(marioRect, { x: e.x, y: e.y, w: e.w, h: e.h })) {
          this.hitMario(e);
        }
        continue;
      }

      // Goomba / Koopa
      if (e.state === 'squished') {
        e.stateTimer += dt;
        if (e.stateTimer > 0.4) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      if (e.state === 'dead_falling') {
        e.vy += 800 * dt;
        e.y += e.vy * dt;
        if (e.y > LEVEL_HEIGHT_PX + 40) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Only activate enemy when camera is close
      if (e.x > this.cameraX + this.canvas.width + 100) continue;

      e.animTimer += dt;

      // Shell moving or normal walking
      let speed = e.vx;
      if (e.state === 'shell_moving') {
        speed = e.direction === 'right' ? 240 : -240;
      }

      // Horizontal move
      e.x += speed * dt;

      // Obstacle & Wall collision
      const eRect: Rect = { x: e.x, y: e.y, w: e.w, h: e.h };
      const nearby = this.getNearbyTiles(eRect);
      for (const t of nearby) {
        if (this.isSolidTile(t.block.type)) {
          const tRect = { x: t.x, y: t.y, w: TILE_SIZE, h: TILE_SIZE };
          if (checkAABB(eRect, tRect)) {
            const overlap = getAABBOverlap(eRect, tRect);
            if (overlap.ox < overlap.oy) {
              if (speed > 0) {
                e.x = tRect.x - e.w;
                e.direction = 'left';
                e.vx = -Math.abs(e.vx);
              } else {
                e.x = tRect.x + tRect.w;
                e.direction = 'right';
                e.vx = Math.abs(e.vx);
              }
              if (e.state === 'shell_moving') {
                soundChip.playBump();
                this.screenShake = 2;
              }
            }
          }
        }
      }

      // Vertical Gravity
      e.vy = Math.min(500, e.vy + 900 * dt);
      e.y += e.vy * dt;

      // Floor collision
      for (const t of this.getNearbyTiles({ x: e.x, y: e.y, w: e.w, h: e.h })) {
        if (this.isSolidTile(t.block.type)) {
          const tRect = { x: t.x, y: t.y, w: TILE_SIZE, h: TILE_SIZE };
          if (checkAABB({ x: e.x, y: e.y, w: e.w, h: e.h }, tRect)) {
            const overlap = getAABBOverlap({ x: e.x, y: e.y, w: e.w, h: e.h }, tRect);
            if (overlap.oy <= overlap.ox && e.vy > 0) {
              e.y = tRect.y - e.h;
              e.vy = 0;
            }
          }
        }
      }

      // Moving shell kills other enemies
      if (e.state === 'shell_moving') {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          if (i === j) continue;
          const other = this.enemies[j];
          if (other.state === 'squished' || other.state === 'dead_falling') continue;
          if (checkAABB({ x: e.x, y: e.y, w: e.w, h: e.h }, { x: other.x, y: other.y, w: other.w, h: other.h })) {
            other.state = 'dead_falling';
            other.vy = -200;
            soundChip.playKick();
            this.addScore(200, '200');
          }
        }
      }

      // Collision with Mario
      if (!m.isDead && checkAABB(marioRect, { x: e.x, y: e.y, w: e.w, h: e.h })) {
        // Star Mario destroys enemy instantly
        if (m.starTimer > 0) {
          e.state = 'dead_falling';
          e.vy = -220;
          soundChip.playKick();
          this.addScore(200, '200');
          continue;
        }

        if (e.state === 'shell_idle') {
          // Mario kicks the idle shell!
          e.state = 'shell_moving';
          e.direction = m.x < e.x ? 'right' : 'left';
          soundChip.playKick();
          this.addScore(400, '400');
          m.vy = -180;
        } else if (isStompingEnemy(marioRect, m.vy, { x: e.x, y: e.y, w: e.w, h: e.h })) {
          // Stomp on enemy!
          this.stompEnemy(e);
        } else {
          // Enemy hits Mario!
          this.hitMario(e);
        }
      }
    }
  }

  private stompEnemy(e: Enemy) {
    const m = this.mario;
    m.vy = this.input.jump ? -340 : -240; // Super bounce if holding jump!
    m.comboCount++;
    this.hitstopTimer = 0.05;

    const stompRes = calculateScoreForStomp(m.comboCount);
    if (stompRes.is1Up) {
      this.stats.lives++;
      soundChip.playOneUp();
      this.notifyStats();
    } else {
      this.addScore(stompRes.score, stompRes.label);
    }

    if (e.type === 'goomba') {
      e.state = 'squished';
      e.stateTimer = 0;
      soundChip.playStomp();
    } else if (e.type === 'koopa') {
      if (e.state === 'walking') {
        e.state = 'shell_idle';
        e.h = 16;
        soundChip.playStomp();
      } else if (e.state === 'shell_moving') {
        e.state = 'shell_idle';
        soundChip.playStomp();
      }
    }
  }

  private hitMario(hazard: { x: number; y: number }) {
    const m = this.mario;
    if (m.isDead || m.invincibleTimer > 0 || m.starTimer > 0) return;

    const dmg = applyDamage(m.size, m.invincibleTimer);
    if (dmg.isDead) {
      this.killMario();
    } else {
      m.size = dmg.newSize;
      m.invincibleTimer = dmg.iframes;
      this.stats.marioSize = m.size;
      soundChip.playPowerDown();
      this.hitstopTimer = 0.08;
      this.screenShake = 4;
      this.notifyStats();
    }
  }

  private killMario() {
    const m = this.mario;
    if (m.isDead) return;
    m.isDead = true;
    m.deadTimer = 0;
    m.vy = -340;
    m.vx = 0;
    this.stats.lives = Math.max(0, this.stats.lives - 1);
    soundChip.playDie();
    this.notifyStats();
  }

  private triggerGameOver() {
    this.stats.status = 'gameover';
    document.body.dataset.state = 'gameover';
    soundChip.stopMusic();
    this.notifyStats();
  }

  private triggerVictory() {
    this.stats.status = 'victory';
    document.body.dataset.state = 'victory';
    soundChip.stopMusic();
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('super_mario_high_score', this.stats.highScore.toString());
    }
    this.notifyStats();
  }

  private updatePickups(dt: number) {
    const m = this.mario;
    const marioRect: Rect = { x: m.x, y: m.y, w: m.w, h: m.h };

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.animTimer += dt;

      // Emerging from block upward
      if (p.emerging) {
        p.y -= 30 * dt;
        if (p.y <= p.emergeTargetY) {
          p.y = p.emergeTargetY;
          p.emerging = false;
        }
        continue;
      }

      // Moving pickups (mushroom, star)
      if (p.type === 'mushroom' || p.type === 'oneup' || p.type === 'star') {
        p.x += p.vx * dt;
        // Gravity
        p.vy = Math.min(400, p.vy + 700 * dt);
        p.y += p.vy * dt;

        // Ground & Wall collision
        const pRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        for (const t of this.getNearbyTiles(pRect)) {
          if (this.isSolidTile(t.block.type)) {
            const tRect = { x: t.x, y: t.y, w: TILE_SIZE, h: TILE_SIZE };
            if (checkAABB(pRect, tRect)) {
              const overlap = getAABBOverlap(pRect, tRect);
              if (overlap.oy <= overlap.ox) {
                if (p.vy > 0) {
                  p.y = tRect.y - p.h;
                  p.vy = p.type === 'star' ? -200 : 0; // Star bounces!
                }
              } else {
                p.vx = -p.vx; // Reverse on wall
              }
            }
          }
        }
      }

      // Mario touches pickup
      if (!m.isDead && checkAABB(marioRect, { x: p.x, y: p.y, w: p.w, h: p.h })) {
        this.collectPickup(p);
        this.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(p: Pickup) {
    const m = this.mario;
    if (p.type === 'coin') {
      const res = addCoin(this.stats.coins, this.stats.lives, this.stats.score);
      this.stats.coins = res.coins;
      this.stats.lives = res.lives;
      this.stats.score = res.score;
      soundChip.playCoin();
      if (res.awardedLife) soundChip.playOneUp();
      this.addScore(0, '200');
    } else {
      const res = applyPowerUp(m.size, p.type, this.stats.lives, this.stats.score);
      m.size = res.newSize;
      this.stats.marioSize = m.size;
      this.stats.lives = res.newLives;
      this.stats.score = res.newScore;
      if (res.isGrowth) {
        soundChip.playPowerUp();
        m.squashX = 0.8;
        m.squashY = 1.3;
      }
      if (p.type === 'star') {
        m.starTimer = 10.0; // 10s star power
      }
      this.addScore(0, res.scoreText);
    }
    this.notifyStats();
  }

  private updateFireballs(dt: number) {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.animTimer += dt;
      fb.x += fb.vx * dt;
      fb.vy += 800 * dt;
      fb.y += fb.vy * dt;

      // Bounce on floor
      const fbRect = { x: fb.x, y: fb.y, w: fb.w, h: fb.h };
      for (const t of this.getNearbyTiles(fbRect)) {
        if (this.isSolidTile(t.block.type)) {
          const tRect = { x: t.x, y: t.y, w: TILE_SIZE, h: TILE_SIZE };
          if (checkAABB(fbRect, tRect)) {
            const overlap = getAABBOverlap(fbRect, tRect);
            if (overlap.oy <= overlap.ox && fb.vy > 0) {
              fb.y = tRect.y - fb.h;
              fb.vy = -180; // bounce up
              fb.bounces++;
            } else {
              // Hit wall -> explode
              fb.bounces = 99;
            }
          }
        }
      }

      // Check hit against enemies
      for (const e of this.enemies) {
        if (e.state === 'squished' || e.state === 'dead_falling') continue;
        if (checkAABB(fbRect, { x: e.x, y: e.y, w: e.w, h: e.h })) {
          e.state = 'dead_falling';
          e.vy = -220;
          soundChip.playKick();
          this.addScore(200, '200');
          fb.bounces = 99;
          break;
        }
      }

      // Remove after 4 bounces or offscreen
      if (fb.bounces >= 4 || fb.y > LEVEL_HEIGHT_PX || fb.x > this.cameraX + this.canvas.width + 50) {
        this.createSparkle(fb.x, fb.y);
        this.fireballs.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += 600 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  private updateCamera(dt: number) {
    // Camera smoothly follows Mario rightwards, never scrolls backward
    const targetCamX = Math.max(0, this.mario.x - this.canvas.width * 0.38);
    if (targetCamX > this.cameraX) {
      this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 10);
    }
    // Clamp to level end
    const maxCamX = LEVEL_WIDTH_PX - this.canvas.width;
    if (this.cameraX > maxCamX) this.cameraX = maxCamX;
  }

  private render() {
    const m = this.mario;
    const marioRender: MarioRenderState = {
      x: m.x,
      y: m.y,
      vx: m.vx,
      vy: m.vy,
      w: m.w,
      h: m.h,
      size: m.size,
      direction: m.direction,
      isGrounded: m.isGrounded,
      isSkidding: m.isSkidding,
      isDead: m.isDead,
      onPole: m.onPole,
      animTimer: m.animTimer,
      invincibleTimer: m.invincibleTimer,
      starTimer: m.starTimer,
      squashX: m.squashX,
      squashY: m.squashY,
    };

    this.renderer.render(
      this.cameraX,
      this.level.tiles,
      this.level.bgElements,
      marioRender,
      this.enemies,
      this.pickups,
      this.fireballs,
      this.particles,
      this.floatingTexts,
      this.level.flagpole,
      this.screenShake
    );
  }

  private addScore(amount: number, label?: string) {
    this.stats.score += amount;
    if (label && this.mario) {
      this.floatingTexts.push({
        x: this.mario.x + 8,
        y: this.mario.y - 8,
        vy: -40,
        text: label,
        color: '#ffffff',
        life: 0.9,
        maxLife: 0.9,
      });
    }
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
    }
    this.notifyStats();
  }

  private createDust(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() * 8 - 4),
      y: y - 2,
      vx: (Math.random() * 2 - 1) * 30,
      vy: -Math.random() * 20,
      size: 3,
      color: '#ffffff',
      life: 0.25,
      maxLife: 0.25,
      type: 'smoke',
    });
  }

  private createSparkle(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: (Math.random() * 2 - 1) * 60,
        vy: (Math.random() * 2 - 1) * 60,
        size: 3,
        color: '#fca044',
        life: 0.35,
        maxLife: 0.35,
        type: 'sparkle',
      });
    }
  }

  private getNearbyTiles(box: Rect): { r: number; c: number; x: number; y: number; block: Block }[] {
    const list: { r: number; c: number; x: number; y: number; block: Block }[] = [];
    const minCol = Math.max(0, Math.floor((box.x - 4) / TILE_SIZE));
    const maxCol = Math.min(LEVEL_WIDTH_TILES - 1, Math.floor((box.x + box.w + 4) / TILE_SIZE));
    const minRow = Math.max(0, Math.floor((box.y - 4) / TILE_SIZE));
    const maxRow = Math.min(LEVEL_HEIGHT_TILES - 1, Math.floor((box.y + box.h + 4) / TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const block = this.level.tiles[r][c];
        list.push({
          r,
          c,
          x: c * TILE_SIZE,
          y: r * TILE_SIZE,
          block,
        });
      }
    }
    return list;
  }

  private isSolidTile(type: string): boolean {
    return (
      type === 'ground' ||
      type === 'brick' ||
      type === 'empty_block' ||
      type === 'stair_block' ||
      type === 'castle_block' ||
      type.startsWith('question_') ||
      type.startsWith('pipe_')
    );
  }

  private notifyStats() {
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }
}
