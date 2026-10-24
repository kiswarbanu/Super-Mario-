import { Block, Direction, Enemy, Fireball, FloatingText, MarioSize, Particle, Pickup } from './types';
import { BackgroundElement, LEVEL_HEIGHT_PX, LEVEL_WIDTH_PX, TILE_SIZE } from './level';
import marioBgUrl from '../assets/mario_bg.jpg';

export interface MarioRenderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  size: MarioSize;
  direction: Direction;
  isGrounded: boolean;
  isSkidding: boolean;
  isDead: boolean;
  onPole: boolean;
  animTimer: number;
  invincibleTimer: number;
  starTimer: number;
  squashX: number;
  squashY: number;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private bgImage: HTMLImageElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.bgImage = new Image();
    this.bgImage.src = marioBgUrl;
  }

  public render(
    cameraX: number,
    tiles: Block[][],
    bgElements: BackgroundElement[],
    mario: MarioRenderState,
    enemies: Enemy[],
    pickups: Pickup[],
    fireballs: Fireball[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    flagpole: { x: number; topY: number; bottomY: number; flagY: number },
    screenShake: number = 0
  ) {
    const ctx = this.ctx;
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;

    ctx.save();

    // Screen shake
    if (screenShake > 0) {
      const shakeX = (Math.random() * 2 - 1) * screenShake;
      const shakeY = (Math.random() * 2 - 1) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Painted Mushroom Kingdom Panorama Background
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      const bgW = Math.round(viewH * (16 / 9));
      const parallax = -Math.floor((cameraX * 0.18) % bgW);
      ctx.drawImage(this.bgImage, parallax, 0, bgW, viewH);
      ctx.drawImage(this.bgImage, parallax + bgW, 0, bgW, viewH);
      if (parallax + bgW < viewW) {
        ctx.drawImage(this.bgImage, parallax + bgW * 2, 0, bgW, viewH);
      }
    } else {
      ctx.fillStyle = '#5c94fc';
      ctx.fillRect(0, 0, viewW, viewH);
    }

    ctx.save();
    ctx.translate(-Math.floor(cameraX), 0);

    // 1. Draw Background elements (clouds, hills, bushes)
    this.drawBackground(bgElements, cameraX, viewW);

    // 2. Draw Castle & Flagpole
    this.drawFlagpole(flagpole);

    // 3. Draw Tiles
    this.drawTiles(tiles, cameraX, viewW);

    // 4. Draw Pickups
    for (const pickup of pickups) {
      this.drawPickup(pickup);
    }

    // 5. Draw Enemies
    for (const enemy of enemies) {
      this.drawEnemy(enemy);
    }

    // 6. Draw Fireballs
    for (const fb of fireballs) {
      this.drawFireball(fb);
    }

    // 7. Draw Mario
    this.drawMario(mario);

    // 8. Draw Particles
    this.drawParticles(particles);

    // 9. Draw Floating texts
    this.drawFloatingTexts(floatingTexts);

    ctx.restore();
    ctx.restore();
  }

  private drawBackground(bgElements: BackgroundElement[], cameraX: number, viewW: number) {
    const ctx = this.ctx;
    for (const bg of bgElements) {
      if (bg.x + 120 < cameraX || bg.x - 30 > cameraX + viewW) continue;

      if (bg.type === 'cloud') {
        this.drawCloud(bg.x, bg.y, bg.variant);
      } else if (bg.type === 'hill') {
        this.drawHill(bg.x, bg.y, bg.variant);
      } else if (bg.type === 'bush') {
        this.drawBush(bg.x, bg.y, bg.variant);
      }
    }
  }

  private drawCloud(x: number, y: number, variant: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    const width = variant === 1 ? 32 : variant === 2 ? 48 : 64;

    // Rounded cloud body
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
    ctx.arc(x + width / 2, y + 6, 11, 0, Math.PI * 2);
    ctx.arc(x + width - 10, y + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(x + 10, y + 8, width - 20, 10);
    // Cloud border outline subtle
    ctx.strokeStyle = '#b8d0fc';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawHill(x: number, y: number, variant: number) {
    const ctx = this.ctx;
    const w = variant === 1 ? 48 : variant === 2 ? 80 : 96;
    const h = variant === 1 ? 24 : variant === 2 ? 36 : 44;

    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, 0);
    ctx.fill();

    // Dark contour lines
    ctx.strokeStyle = '#005800';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hill peak dot eye
    ctx.fillStyle = '#005800';
    ctx.fillRect(x + w / 2 - 2, y + 6, 4, 4);
  }

  private drawBush(x: number, y: number, variant: number) {
    const ctx = this.ctx;
    const w = variant === 1 ? 32 : variant === 2 ? 48 : 64;
    const h = 16;

    ctx.fillStyle = '#80d010';
    ctx.beginPath();
    ctx.arc(x + 8, y + h - 6, 8, 0, Math.PI * 2);
    ctx.arc(x + w / 2, y + h - 10, 10, 0, Math.PI * 2);
    ctx.arc(x + w - 8, y + h - 6, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(x + 8, y + h - 8, w - 16, 8);
    ctx.strokeStyle = '#005800';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawTiles(tiles: Block[][], cameraX: number, viewW: number) {
    const ctx = this.ctx;
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
    const endCol = Math.min(tiles[0].length - 1, Math.ceil((cameraX + viewW) / TILE_SIZE) + 1);

    for (let r = 0; r < tiles.length; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const block = tiles[r][c];
        if (block.type === 'empty') continue;

        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE - block.bumpOffset;

        this.drawTile(block, x, y);
      }
    }
  }

  private drawTile(block: Block, x: number, y: number) {
    const ctx = this.ctx;
    const s = TILE_SIZE;

    switch (block.type) {
      case 'ground': {
        // Classic brown ground brick
        ctx.fillStyle = '#d87020';
        ctx.fillRect(x, y, s, s);

        // Highlight and shadow
        ctx.fillStyle = '#fca044';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y, 2, s);

        ctx.fillStyle = '#883800';
        ctx.fillRect(x + s - 2, y, 2, s);
        ctx.fillRect(x, y + s - 2, s, 2);

        // Inner brick lines
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 7, y + 3, 2, 5);
        ctx.fillRect(x + 2, y + 8, s - 4, 1);
        ctx.fillRect(x + 11, y + 9, 2, 5);
        break;
      }

      case 'brick': {
        // Breakable brick
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x, y, s, s);

        // Dark mortar grooves
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y + 7, s, 2);
        ctx.fillRect(x + 7, y, 2, 7);
        ctx.fillRect(x + 3, y + 9, 2, 7);
        ctx.fillRect(x + 12, y + 9, 2, 7);

        // Highlights
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(x, y, 7, 2);
        ctx.fillRect(x + 9, y, 7, 2);
        ctx.fillRect(x, y + 9, 3, 2);
        ctx.fillRect(x + 5, y + 9, 7, 2);
        break;
      }

      case 'question_coin':
      case 'question_mushroom':
      case 'question_fireflower':
      case 'question_star': {
        // Glowing gold question block
        const time = Date.now() / 250;
        const pulse = Math.floor(time) % 4;
        const goldHue = pulse === 0 ? '#fcb040' : pulse === 1 ? '#f8d878' : '#e49020';

        ctx.fillStyle = goldHue;
        ctx.fillRect(x, y, s, s);

        // Border shadow
        ctx.fillStyle = '#000000';
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);

        // 4 corner rivets
        ctx.fillStyle = '#7c3800';
        ctx.fillRect(x + 2, y + 2, 2, 2);
        ctx.fillRect(x + s - 4, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + s - 4, 2, 2);
        ctx.fillRect(x + s - 4, y + s - 4, 2, 2);

        // '?' symbol
        ctx.fillStyle = '#7c3800';
        ctx.fillRect(x + 5, y + 3, 6, 2);
        ctx.fillRect(x + 9, y + 5, 2, 3);
        ctx.fillRect(x + 7, y + 7, 3, 2);
        ctx.fillRect(x + 7, y + 11, 2, 2);
        break;
      }

      case 'empty_block': {
        // Spent metal block
        ctx.fillStyle = '#8c5028';
        ctx.fillRect(x, y, s, s);

        ctx.fillStyle = '#000000';
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);

        ctx.fillStyle = '#5c2c10';
        ctx.fillRect(x + 2, y + 2, 2, 2);
        ctx.fillRect(x + s - 4, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + s - 4, 2, 2);
        ctx.fillRect(x + s - 4, y + s - 4, 2, 2);
        break;
      }

      case 'pipe_top_left': {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, s, s);
        // Highlight stripe
        ctx.fillStyle = '#80d010';
        ctx.fillRect(x + 3, y, 4, s);
        ctx.fillStyle = '#005800';
        ctx.fillRect(x, y, 2, s);
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y + s - 2, s, 2);
        break;
      }

      case 'pipe_top_right': {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#005800';
        ctx.fillRect(x + s - 3, y, 3, s);
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y + s - 2, s, 2);
        break;
      }

      case 'pipe_body_left': {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x + 2, y, s - 2, s);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(x + 5, y, 4, s);
        ctx.fillStyle = '#005800';
        ctx.fillRect(x + 2, y, 2, s);
        break;
      }

      case 'pipe_body_right': {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, s - 2, s);
        ctx.fillStyle = '#005800';
        ctx.fillRect(x + s - 4, y, 2, s);
        break;
      }

      case 'stair_block': {
        // Tan solid stone block
        ctx.fillStyle = '#c46014';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#fca044';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y, 2, s);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + s - 2, y, 2, s);
        ctx.fillRect(x, y + s - 2, s, 2);
        break;
      }

      case 'castle_block': {
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x, y, s, s);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
        break;
      }

      case 'castle_door': {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, s, s);
        break;
      }

      case 'castle_battlement': {
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x + 2, y + 4, s - 4, s - 4);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x + 2.5, y + 4.5, s - 5, s - 5);
        break;
      }
    }
  }

  private drawFlagpole(flagpole: { x: number; topY: number; bottomY: number; flagY: number }) {
    const ctx = this.ctx;
    const x = flagpole.x + 6;

    // Pole line
    ctx.fillStyle = '#80d010';
    ctx.fillRect(x, flagpole.topY, 4, flagpole.bottomY - flagpole.topY);
    ctx.fillStyle = '#005800';
    ctx.fillRect(x + 3, flagpole.topY, 1, flagpole.bottomY - flagpole.topY);

    // Golden sphere finial on top
    ctx.fillStyle = '#fca044';
    ctx.beginPath();
    ctx.arc(x + 2, flagpole.topY - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c3800';
    ctx.stroke();

    // Sliding Flag
    const fy = flagpole.flagY;
    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.moveTo(x - 2, fy);
    ctx.lineTo(x - 18, fy + 8);
    ctx.lineTo(x - 2, fy + 16);
    ctx.closePath();
    ctx.fill();

    // Emblem on flag
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 9, fy + 8, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMario(mario: MarioRenderState) {
    const ctx = this.ctx;

    // Blink if invincible during iframes
    if (mario.invincibleTimer > 0 && Math.floor(mario.invincibleTimer * 16) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(mario.x + mario.w / 2, mario.y + mario.h);

    // Direction flip
    if (mario.direction === 'left') {
      ctx.scale(-1, 1);
    }

    // Squash and stretch
    ctx.scale(mario.squashX, mario.squashY);

    // Color palette determination
    let hatColor = '#d82800';
    let shirtColor = '#d82800';
    let overallColor = '#0028d8';
    let skinColor = '#fc9838';

    if (mario.size === 'fire') {
      hatColor = '#ffffff';
      shirtColor = '#ffffff';
      overallColor = '#d82800';
    } else if (mario.starTimer > 0) {
      // Rainbow cycling
      const cycle = Math.floor(Date.now() / 60) % 5;
      const palettes = [
        { hat: '#00d800', over: '#f8d800' },
        { hat: '#d80000', over: '#00d800' },
        { hat: '#0028d8', over: '#fc9838' },
        { hat: '#fc9838', over: '#d82800' },
        { hat: '#ffffff', over: '#00a800' },
      ];
      hatColor = palettes[cycle].hat;
      shirtColor = palettes[cycle].hat;
      overallColor = palettes[cycle].over;
    }

    if (mario.isDead) {
      // Death jump pose
      this.drawDeadMario(ctx);
    } else if (mario.size === 'small') {
      this.drawSmallMario(ctx, mario, hatColor, overallColor, skinColor);
    } else {
      this.drawSuperMario(ctx, mario, hatColor, shirtColor, overallColor, skinColor);
    }

    ctx.restore();
  }

  private drawSmallMario(
    ctx: CanvasRenderingContext2D,
    mario: MarioRenderState,
    hat: string,
    overalls: string,
    skin: string
  ) {
    const isJumping = !mario.isGrounded;
    const isWalking = Math.abs(mario.vx) > 10;
    const walkFrame = Math.floor(mario.animTimer * 12) % 3;

    // Cap (Rows -16 to -13)
    ctx.fillStyle = hat;
    ctx.fillRect(-4, -16, 10, 2); // cap crown
    ctx.fillRect(-5, -14, 14, 2); // cap visor

    // Face / Hair (Rows -12 to -8)
    ctx.fillStyle = '#6c3400'; // hair
    ctx.fillRect(-6, -12, 3, 4);
    ctx.fillRect(-3, -10, 2, 2);

    ctx.fillStyle = skin; // face
    ctx.fillRect(-3, -12, 8, 4);
    ctx.fillRect(5, -11, 2, 2); // nose

    ctx.fillStyle = '#000000'; // eye & mustache
    ctx.fillRect(2, -12, 2, 2); // eye
    ctx.fillStyle = '#6c3400';
    ctx.fillRect(1, -9, 6, 2); // mustache

    // Body / Shirt / Overalls (Rows -7 to 0)
    if (isJumping) {
      // Jump pose: arm forward, feet separated
      ctx.fillStyle = hat;
      ctx.fillRect(-4, -7, 10, 3); // shirt
      ctx.fillStyle = overalls;
      ctx.fillRect(-5, -5, 11, 4);
      // Shoes
      ctx.fillStyle = '#6c3400';
      ctx.fillRect(-7, -2, 5, 2);
      ctx.fillRect(3, -3, 5, 3);
    } else if (mario.isSkidding) {
      // Skid pose
      ctx.fillStyle = hat;
      ctx.fillRect(-4, -7, 8, 2);
      ctx.fillStyle = overalls;
      ctx.fillRect(-6, -5, 12, 4);
      ctx.fillStyle = '#6c3400';
      ctx.fillRect(-7, -2, 6, 2);
      ctx.fillRect(1, -2, 6, 2);
    } else if (isWalking) {
      // 3-frame walk
      ctx.fillStyle = hat;
      ctx.fillRect(-4, -7, 8, 3);
      ctx.fillStyle = overalls;
      ctx.fillRect(-5, -5, 10, 4);

      ctx.fillStyle = '#6c3400';
      if (walkFrame === 0) {
        ctx.fillRect(-6, -2, 5, 2);
        ctx.fillRect(1, -2, 5, 2);
      } else if (walkFrame === 1) {
        ctx.fillRect(-7, -3, 5, 2);
        ctx.fillRect(2, -1, 5, 2);
      } else {
        ctx.fillRect(-4, -1, 5, 2);
        ctx.fillRect(2, -3, 5, 2);
      }
    } else {
      // Idle
      ctx.fillStyle = hat;
      ctx.fillRect(-4, -7, 8, 3);
      ctx.fillStyle = overalls;
      ctx.fillRect(-5, -5, 10, 4);
      ctx.fillStyle = '#6c3400';
      ctx.fillRect(-6, -2, 5, 2);
      ctx.fillRect(1, -2, 5, 2);
    }
  }

  private drawSuperMario(
    ctx: CanvasRenderingContext2D,
    mario: MarioRenderState,
    hat: string,
    shirt: string,
    overalls: string,
    skin: string
  ) {
    // Super Mario is 16px wide, 32px tall
    const isJumping = !mario.isGrounded;
    const isWalking = Math.abs(mario.vx) > 10;
    const walkFrame = Math.floor(mario.animTimer * 12) % 3;

    // Cap
    ctx.fillStyle = hat;
    ctx.fillRect(-7, -32, 14, 4);
    ctx.fillRect(-5, -28, 16, 3);

    // Head / Face
    ctx.fillStyle = skin;
    ctx.fillRect(-6, -25, 12, 6);
    // Mustache, hair, eye
    ctx.fillStyle = '#6c3400';
    ctx.fillRect(-8, -25, 3, 5);
    ctx.fillRect(0, -21, 8, 3); // big mustache
    ctx.fillRect(3, -24, 3, 3); // eye

    // Torso (Shirt + Overalls)
    ctx.fillStyle = shirt;
    ctx.fillRect(-6, -19, 12, 7);

    ctx.fillStyle = overalls;
    ctx.fillRect(-7, -15, 14, 8);
    // Yellow button pips
    ctx.fillStyle = '#fca044';
    ctx.fillRect(-4, -13, 2, 2);
    ctx.fillRect(2, -13, 2, 2);

    // Legs & Shoes
    ctx.fillStyle = '#6c3400';
    if (isJumping) {
      ctx.fillStyle = overalls;
      ctx.fillRect(-9, -10, 6, 7);
      ctx.fillRect(3, -9, 6, 7);
      ctx.fillStyle = '#6c3400';
      ctx.fillRect(-10, -4, 6, 4);
      ctx.fillRect(4, -3, 6, 4);
    } else if (mario.isSkidding) {
      ctx.fillStyle = overalls;
      ctx.fillRect(-8, -8, 16, 6);
      ctx.fillStyle = '#6c3400';
      ctx.fillRect(-9, -3, 7, 3);
      ctx.fillRect(2, -3, 7, 3);
    } else if (isWalking) {
      ctx.fillStyle = overalls;
      if (walkFrame === 0) {
        ctx.fillRect(-7, -8, 6, 6);
        ctx.fillRect(1, -8, 6, 6);
        ctx.fillStyle = '#6c3400';
        ctx.fillRect(-8, -3, 6, 3);
        ctx.fillRect(2, -3, 6, 3);
      } else if (walkFrame === 1) {
        ctx.fillRect(-9, -9, 6, 6);
        ctx.fillRect(3, -7, 6, 6);
        ctx.fillStyle = '#6c3400';
        ctx.fillRect(-10, -4, 6, 3);
        ctx.fillRect(4, -2, 6, 3);
      } else {
        ctx.fillRect(-5, -7, 6, 6);
        ctx.fillRect(2, -9, 6, 6);
        ctx.fillStyle = '#6c3400';
        ctx.fillRect(-6, -2, 6, 3);
        ctx.fillRect(3, -4, 6, 3);
      }
    } else {
      // Idle
      ctx.fillStyle = overalls;
      ctx.fillRect(-7, -8, 6, 6);
      ctx.fillRect(1, -8, 6, 6);
      ctx.fillStyle = '#6c3400';
      ctx.fillRect(-8, -3, 6, 3);
      ctx.fillRect(2, -3, 6, 3);
    }
  }

  private drawDeadMario(ctx: CanvasRenderingContext2D) {
    // Classic death jump pose
    ctx.fillStyle = '#d82800';
    ctx.fillRect(-6, -16, 12, 4);
    ctx.fillStyle = '#fc9838';
    ctx.fillRect(-5, -12, 10, 5);
    ctx.fillStyle = '#6c3400';
    ctx.fillRect(-1, -10, 6, 2);
    ctx.fillStyle = '#0028d8';
    ctx.fillRect(-6, -7, 12, 5);
    ctx.fillStyle = '#6c3400';
    ctx.fillRect(-8, -2, 6, 2);
    ctx.fillRect(2, -2, 6, 2);
  }

  private drawEnemy(enemy: Enemy) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h);

    if (enemy.direction === 'right') {
      ctx.scale(-1, 1);
    }

    if (enemy.type === 'goomba') {
      this.drawGoomba(ctx, enemy);
    } else if (enemy.type === 'koopa') {
      this.drawKoopa(ctx, enemy);
    } else if (enemy.type === 'piranha') {
      this.drawPiranha(ctx, enemy);
    }

    ctx.restore();
  }

  private drawGoomba(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    if (enemy.state === 'squished') {
      // Flat squished pancake
      ctx.fillStyle = '#a84000';
      ctx.fillRect(-8, -5, 16, 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-5, -4, 3, 2);
      ctx.fillRect(2, -4, 3, 2);
      return;
    }

    if (enemy.state === 'dead_falling') {
      ctx.scale(1, -1);
      ctx.translate(0, 16);
    }

    const walkFrame = Math.floor(enemy.animTimer * 6) % 2;

    // Cap / head (mushroom-like brown dome)
    ctx.fillStyle = '#a84000';
    ctx.beginPath();
    ctx.arc(0, -9, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-8, -9, 16, 4);

    // Face / stem
    ctx.fillStyle = '#fcd8a8';
    ctx.fillRect(-5, -6, 10, 4);

    // Angry eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -8, 3, 4);
    ctx.fillRect(1, -8, 3, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -7, 2, 2);
    ctx.fillRect(2, -7, 2, 2);

    // Brows
    ctx.fillRect(-5, -9, 4, 1);
    ctx.fillRect(1, -9, 4, 1);

    // Feet
    ctx.fillStyle = '#000000';
    if (walkFrame === 0) {
      ctx.fillRect(-7, -2, 6, 2);
      ctx.fillRect(2, -1, 5, 2);
    } else {
      ctx.fillRect(-7, -1, 5, 2);
      ctx.fillRect(1, -2, 6, 2);
    }
  }

  private drawKoopa(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    if (enemy.state === 'shell_idle' || enemy.state === 'shell_moving') {
      // Shell only
      const spinFrame = Math.floor(enemy.animTimer * 16) % 4;
      ctx.fillStyle = '#00a800';
      ctx.beginPath();
      ctx.arc(0, -7, 7, 0, Math.PI * 2);
      ctx.fill();

      // Shell rim
      ctx.fillStyle = '#fcb040';
      ctx.fillRect(-7, -3, 14, 3);
      ctx.fillStyle = '#ffffff';
      if (enemy.state === 'shell_moving') {
        // Spinning lines
        const offset = spinFrame * 2 - 3;
        ctx.fillRect(offset, -9, 2, 5);
      } else {
        ctx.fillRect(-3, -9, 6, 4);
      }
      return;
    }

    const walkFrame = Math.floor(enemy.animTimer * 6) % 2;

    // Green Shell
    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.arc(-2, -12, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fcb040';
    ctx.fillRect(-8, -8, 12, 3);

    // Yellow head & beak
    ctx.fillStyle = '#fca044';
    ctx.fillRect(1, -22, 7, 8);
    ctx.fillStyle = '#000000';
    ctx.fillRect(5, -20, 2, 3); // eye

    // Feet
    ctx.fillStyle = '#fca044';
    if (walkFrame === 0) {
      ctx.fillRect(-7, -3, 6, 3);
      ctx.fillRect(0, -2, 6, 3);
    } else {
      ctx.fillRect(-7, -2, 6, 3);
      ctx.fillRect(1, -4, 6, 3);
    }
  }

  private drawPiranha(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const mouthOpen = Math.floor(enemy.animTimer * 6) % 2 === 0;

    // Stem
    ctx.fillStyle = '#00a800';
    ctx.fillRect(-2, -14, 4, 14);

    // Leaves
    ctx.fillRect(-6, -8, 4, 2);
    ctx.fillRect(2, -8, 4, 2);

    // Red Head with white spots
    ctx.fillStyle = '#d82800';
    ctx.beginPath();
    ctx.arc(0, -18, 7, 0, Math.PI * 2);
    ctx.fill();

    // White polka dots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -22, 2, 2);
    ctx.fillRect(2, -21, 2, 2);
    ctx.fillRect(-1, -16, 2, 2);

    // Snapping Mouth
    ctx.fillStyle = '#ffffff';
    if (mouthOpen) {
      ctx.fillRect(-4, -19, 8, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-3, -18, 6, 1);
    } else {
      ctx.fillRect(-5, -18, 10, 2);
    }
  }

  private drawPickup(pickup: Pickup) {
    const ctx = this.ctx;
    const x = pickup.x;
    const y = pickup.y;

    switch (pickup.type) {
      case 'coin': {
        // Spinning golden coin with shiny shimmer
        const frame = Math.floor(pickup.animTimer * 10) % 4;
        const w = frame === 0 ? 10 : frame === 1 ? 7 : frame === 2 ? 3 : 7;
        const cx = x + 5;

        // Outer dark gold border
        ctx.fillStyle = '#b85800';
        ctx.fillRect(cx - w / 2 - 0.5, y, w + 1, 14);

        // Core gold fill
        ctx.fillStyle = '#fcb040';
        ctx.fillRect(cx - w / 2, y + 1, w, 12);

        // Inner vertical shine line
        ctx.fillStyle = '#ffffff';
        if (w >= 6) {
          ctx.fillRect(cx - 1, y + 3, 2, 8);
        } else if (w >= 3) {
          ctx.fillRect(cx, y + 3, 1, 8);
        }
        break;
      }

      case 'mushroom': {
        // Red Super Mushroom
        ctx.fillStyle = '#d82800';
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x + 1, y + 6, 14, 3);

        // White spots
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 6, y + 2, 4, 4);
        ctx.fillRect(x + 1, y + 5, 2, 3);
        ctx.fillRect(x + 13, y + 5, 2, 3);

        // Stem & eyes
        ctx.fillStyle = '#fcd8a8';
        ctx.fillRect(x + 3, y + 9, 10, 7);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 5, y + 10, 2, 3);
        ctx.fillRect(x + 9, y + 10, 2, 3);
        break;
      }

      case 'oneup': {
        // Green 1UP Mushroom
        ctx.fillStyle = '#00a800';
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x + 1, y + 6, 14, 3);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 6, y + 2, 4, 4);
        ctx.fillRect(x + 1, y + 5, 2, 3);
        ctx.fillRect(x + 13, y + 5, 2, 3);

        ctx.fillStyle = '#fcd8a8';
        ctx.fillRect(x + 3, y + 9, 10, 7);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 5, y + 10, 2, 3);
        ctx.fillRect(x + 9, y + 10, 2, 3);
        break;
      }

      case 'fireflower': {
        // Fire Flower
        const pulse = Math.floor(pickup.animTimer * 10) % 3;
        const petals = pulse === 0 ? '#d82800' : pulse === 1 ? '#fc9838' : '#fcb040';

        ctx.fillStyle = '#00a800';
        ctx.fillRect(x + 7, y + 8, 2, 8); // stem
        ctx.fillRect(x + 3, y + 11, 4, 2); // left leaf
        ctx.fillRect(x + 9, y + 11, 4, 2); // right leaf

        ctx.fillStyle = petals;
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 6, y + 4, 4, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 7, y + 5, 2, 2);
        break;
      }

      case 'star': {
        // Super Star
        ctx.fillStyle = '#fca044';
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 6, 1, 3);
        ctx.fillRect(x + 9, y + 6, 1, 3);
        break;
      }
    }
  }

  private drawFireball(fb: Fireball) {
    const ctx = this.ctx;
    const frame = Math.floor(fb.animTimer * 16) % 4;

    ctx.save();
    ctx.translate(fb.x + fb.w / 2, fb.y + fb.h / 2);
    ctx.rotate((frame * Math.PI) / 2);

    ctx.fillStyle = '#fc9838';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -2, 4, 4);

    ctx.restore();
  }

  private drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  private drawFloatingTexts(texts: FloatingText[]) {
    const ctx = this.ctx;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';

    for (const t of texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}
