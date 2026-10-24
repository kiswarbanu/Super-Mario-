import { Block, BlockType, Enemy, Pickup } from './types';

export const TILE_SIZE = 16;
export const LEVEL_WIDTH_TILES = 215;
export const LEVEL_HEIGHT_TILES = 15;
export const LEVEL_WIDTH_PX = LEVEL_WIDTH_TILES * TILE_SIZE;
export const LEVEL_HEIGHT_PX = LEVEL_HEIGHT_TILES * TILE_SIZE;

export interface BackgroundElement {
  type: 'cloud' | 'hill' | 'bush';
  x: number;
  y: number;
  variant: 1 | 2 | 3;
}

export interface LevelData {
  tiles: Block[][];
  enemies: Enemy[];
  initialPickups: Pickup[];
  bgElements: BackgroundElement[];
  flagpole: {
    x: number;
    topY: number;
    bottomY: number;
    flagY: number;
  };
  castle: {
    x: number;
    y: number;
    w: number;
    h: number;
    doorX: number;
    doorY: number;
  };
}

export function createLevel1(): LevelData {
  // Initialize grid: tiles[y][x]
  const tiles: Block[][] = [];
  for (let y = 0; y < LEVEL_HEIGHT_TILES; y++) {
    tiles[y] = [];
    for (let x = 0; x < LEVEL_WIDTH_TILES; x++) {
      tiles[y][x] = {
        type: 'empty',
        bumpOffset: 0,
        bumpVy: 0,
      };
    }
  }

  // Pits where ground is missing
  const pits = [
    { start: 69, end: 71 },
    { start: 86, end: 89 },
    { start: 153, end: 155 },
  ];

  function isPit(col: number): boolean {
    return pits.some((p) => col >= p.start && col <= p.end);
  }

  // Lay ground tiles (rows 13 and 14)
  for (let x = 0; x < LEVEL_WIDTH_TILES; x++) {
    if (!isPit(x)) {
      tiles[13][x] = { type: 'ground', bumpOffset: 0, bumpVy: 0 };
      tiles[14][x] = { type: 'ground', bumpOffset: 0, bumpVy: 0 };
    }
  }

  // Helper to place a pipe
  function placePipe(x: number, heightInTiles: number, withPiranha: boolean = true) {
    const topRow = 13 - heightInTiles;
    // Pipe top
    tiles[topRow][x] = { type: 'pipe_top_left', bumpOffset: 0, bumpVy: 0 };
    tiles[topRow][x + 1] = { type: 'pipe_top_right', bumpOffset: 0, bumpVy: 0 };

    // Pipe body
    for (let r = topRow + 1; r < 13; r++) {
      tiles[r][x] = { type: 'pipe_body_left', bumpOffset: 0, bumpVy: 0 };
      tiles[r][x + 1] = { type: 'pipe_body_right', bumpOffset: 0, bumpVy: 0 };
    }

    if (withPiranha) {
      enemies.push({
        id: enemyIdCounter++,
        type: 'piranha',
        x: x * TILE_SIZE + 4,
        y: topRow * TILE_SIZE,
        vx: 0,
        vy: 0,
        w: 16,
        h: 24,
        direction: 'left',
        state: 'walking',
        stateTimer: 0,
        pipeBaseY: topRow * TILE_SIZE,
        animTimer: 0,
      });
    }
  }

  // Helper to place stairs
  function placeStair(startX: number, height: number, facingRight: boolean) {
    for (let step = 0; step < height; step++) {
      const col = facingRight ? startX + step : startX + (height - 1 - step);
      const stepH = step + 1;
      for (let r = 13 - stepH; r < 13; r++) {
        tiles[r][col] = { type: 'stair_block', bumpOffset: 0, bumpVy: 0 };
      }
    }
  }

  const enemies: Enemy[] = [];
  let enemyIdCounter = 1;

  // Question blocks & Bricks in Section 1
  tiles[9][16] = { type: 'question_coin', bumpOffset: 0, bumpVy: 0 };
  tiles[9][20] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };
  tiles[9][21] = { type: 'question_mushroom', bumpOffset: 0, bumpVy: 0 };
  tiles[9][22] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };
  tiles[9][23] = { type: 'question_coin', bumpOffset: 0, bumpVy: 0 };
  tiles[9][24] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };
  tiles[5][22] = { type: 'question_coin', bumpOffset: 0, bumpVy: 0 };

  // Pipes Section
  placePipe(28, 2, false);
  placePipe(38, 3, true);
  placePipe(46, 4, true);
  placePipe(57, 4, true);

  // Hidden 1UP Block
  tiles[9][64] = { type: 'question_mushroom', bumpOffset: 0, bumpVy: 0 };

  // Brick & Question block islands over pit 1
  tiles[9][77] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };
  tiles[9][78] = { type: 'question_fireflower', bumpOffset: 0, bumpVy: 0 };
  tiles[9][79] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };

  // High brick row with coins
  for (let c = 80; c <= 86; c++) {
    tiles[5][c] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };
  }
  tiles[5][83] = { type: 'question_coin', bumpOffset: 0, bumpVy: 0 };

  // High brick platform after pit 2
  for (let c = 91; c <= 94; c++) {
    tiles[9][c] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };
  }
  tiles[9][94] = { type: 'brick', bumpOffset: 0, bumpVy: 0, coinsLeft: 5 }; // multi-coin brick

  tiles[9][100] = { type: 'question_star', bumpOffset: 0, bumpVy: 0 };
  tiles[9][106] = { type: 'question_coin', bumpOffset: 0, bumpVy: 0 };
  tiles[9][109] = { type: 'question_mushroom', bumpOffset: 0, bumpVy: 0 };
  tiles[9][112] = { type: 'question_coin', bumpOffset: 0, bumpVy: 0 };

  // Two pyramid stairs
  placeStair(134, 4, true);
  placeStair(138, 4, false);

  placeStair(148, 4, true);
  placeStair(155, 4, false);

  // High row of bricks with mystery block
  for (let c = 168; c <= 172; c++) {
    tiles[9][c] = { type: 'brick', bumpOffset: 0, bumpVy: 0 };
  }
  tiles[9][170] = { type: 'question_coin', bumpOffset: 0, bumpVy: 0 };

  // Final mega staircase up to flagpole
  placeStair(181, 8, true);

  // Single tall pillar right next to flagpole
  for (let r = 5; r < 13; r++) {
    tiles[r][189] = { type: 'stair_block', bumpOffset: 0, bumpVy: 0 };
  }

  // Flagpole at tile column 198
  for (let r = 3; r < 13; r++) {
    tiles[r][198] = {
      type: r === 3 ? 'flagpole_finial' : 'flagpole_pole',
      bumpOffset: 0,
      bumpVy: 0,
    };
  }

  // Castle blocks at column 202 to 207
  for (let c = 202; c <= 207; c++) {
    for (let r = 8; r < 13; r++) {
      if (r >= 10 && (c === 204 || c === 205)) {
        tiles[r][c] = { type: 'castle_door', bumpOffset: 0, bumpVy: 0 };
      } else {
        tiles[r][c] = { type: 'castle_block', bumpOffset: 0, bumpVy: 0 };
      }
    }
    // Battlements on roof
    if (c % 2 === 0) {
      tiles[7][c] = { type: 'castle_battlement', bumpOffset: 0, bumpVy: 0 };
    }
  }

  // Floating mid-air coins to collect
  const initialPickups: Pickup[] = [
    { id: 1001, type: 'coin', x: 20 * TILE_SIZE, y: 7 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1002, type: 'coin', x: 24 * TILE_SIZE, y: 7 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1003, type: 'coin', x: 50 * TILE_SIZE, y: 8 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1004, type: 'coin', x: 52 * TILE_SIZE, y: 7 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1005, type: 'coin', x: 54 * TILE_SIZE, y: 8 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1006, type: 'coin', x: 81 * TILE_SIZE, y: 3 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1007, type: 'coin', x: 83 * TILE_SIZE, y: 3 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1008, type: 'coin', x: 85 * TILE_SIZE, y: 3 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1009, type: 'coin', x: 141 * TILE_SIZE, y: 8 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
    { id: 1010, type: 'coin', x: 143 * TILE_SIZE, y: 8 * TILE_SIZE, vx: 0, vy: 0, w: 10, h: 14, emerging: false, emergeTargetY: 0, grounded: true, animTimer: 0 },
  ];

  // Enemies: Goombas and Koopa Troopas
  enemies.push(
    { id: enemyIdCounter++, type: 'goomba', x: 22 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 41 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 43 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 52 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 54 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'koopa', x: 97 * TILE_SIZE, y: 11 * TILE_SIZE, vx: -40, vy: 0, w: 16, h: 24, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 107 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 110 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'koopa', x: 125 * TILE_SIZE, y: 11 * TILE_SIZE, vx: -40, vy: 0, w: 16, h: 24, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 172 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 },
    { id: enemyIdCounter++, type: 'goomba', x: 174 * TILE_SIZE, y: 12 * TILE_SIZE, vx: -35, vy: 0, w: 16, h: 16, direction: 'left', state: 'walking', stateTimer: 0, animTimer: 0 }
  );

  // Background elements: decorative clouds, hills, bushes
  const bgElements: BackgroundElement[] = [
    // Clouds
    { type: 'cloud', x: 8 * TILE_SIZE, y: 3 * TILE_SIZE, variant: 1 },
    { type: 'cloud', x: 19 * TILE_SIZE, y: 2 * TILE_SIZE, variant: 2 },
    { type: 'cloud', x: 36 * TILE_SIZE, y: 3 * TILE_SIZE, variant: 3 },
    { type: 'cloud', x: 56 * TILE_SIZE, y: 2 * TILE_SIZE, variant: 1 },
    { type: 'cloud', x: 74 * TILE_SIZE, y: 3 * TILE_SIZE, variant: 2 },
    { type: 'cloud', x: 96 * TILE_SIZE, y: 2 * TILE_SIZE, variant: 3 },
    { type: 'cloud', x: 120 * TILE_SIZE, y: 3 * TILE_SIZE, variant: 1 },
    { type: 'cloud', x: 144 * TILE_SIZE, y: 2 * TILE_SIZE, variant: 2 },
    { type: 'cloud', x: 168 * TILE_SIZE, y: 3 * TILE_SIZE, variant: 3 },
    { type: 'cloud', x: 192 * TILE_SIZE, y: 2 * TILE_SIZE, variant: 1 },

    // Hills
    { type: 'hill', x: 0 * TILE_SIZE, y: 11 * TILE_SIZE, variant: 2 },
    { type: 'hill', x: 16 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 1 },
    { type: 'hill', x: 48 * TILE_SIZE, y: 11 * TILE_SIZE, variant: 3 },
    { type: 'hill', x: 96 * TILE_SIZE, y: 11 * TILE_SIZE, variant: 2 },
    { type: 'hill', x: 144 * TILE_SIZE, y: 11 * TILE_SIZE, variant: 3 },
    { type: 'hill', x: 190 * TILE_SIZE, y: 11 * TILE_SIZE, variant: 2 },

    // Bushes
    { type: 'bush', x: 11 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 3 },
    { type: 'bush', x: 23 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 1 },
    { type: 'bush', x: 41 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 2 },
    { type: 'bush', x: 62 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 3 },
    { type: 'bush', x: 90 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 1 },
    { type: 'bush', x: 130 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 2 },
    { type: 'bush', x: 165 * TILE_SIZE, y: 12 * TILE_SIZE, variant: 3 },
  ];

  return {
    tiles,
    enemies,
    initialPickups,
    bgElements,
    flagpole: {
      x: 198 * TILE_SIZE,
      topY: 3 * TILE_SIZE,
      bottomY: 13 * TILE_SIZE,
      flagY: 3 * TILE_SIZE,
    },
    castle: {
      x: 202 * TILE_SIZE,
      y: 7 * TILE_SIZE,
      w: 6 * TILE_SIZE,
      h: 6 * TILE_SIZE,
      doorX: 204 * TILE_SIZE + 4,
      doorY: 10 * TILE_SIZE,
    },
  };
}
