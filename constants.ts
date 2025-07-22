import type { Shape } from './types';

export const LOGICAL_GRID_WIDTH = 12;
export const LOGICAL_GRID_HEIGHT = 20;
export const PARTICLE_SCALE = 4; // Each block cell will break into a 4x4 particle grid

export const GRID_WIDTH = LOGICAL_GRID_WIDTH * PARTICLE_SCALE;
export const GRID_HEIGHT = LOGICAL_GRID_HEIGHT * PARTICLE_SCALE;

export const DANGER_ZONE_LOGICAL_HEIGHT = 2; // The top N logical rows are the danger zone

export const BOMB_PARTICLE = -1;
export const BOMB_RADIUS = 2; // In logical block units
export const SPECIAL_BLOCK_CHANCE = 0.15; // 15% chance to get a special block

export const COLORS = [
  '#00FFFF', // 0: Cyan
  '#FFFF00', // 1: Yellow
  '#800080', // 2: Purple
  '#00FF00', // 3: Lime
  '#FF0000', // 4: Red
  '#FFA500', // 5: Orange
  '#0000FF', // 6: Blue
];

export const TAILWIND_COLORS: { [key: string]: string } = {
  '#00FFFF': 'bg-cyan-500 text-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)]',
  '#FFFF00': 'bg-yellow-400 text-yellow-300 shadow-[0_0_8px_theme(colors.yellow.300)]',
  '#800080': 'bg-purple-500 text-purple-400 shadow-[0_0_8px_theme(colors.purple.400)]',
  '#00FF00': 'bg-lime-500 text-lime-400 shadow-[0_0_8px_theme(colors.lime.400)]',
  '#FF0000': 'bg-red-500 text-red-400 shadow-[0_0_8px_theme(colors.red.400)]',
  '#FFA500': 'bg-orange-500 text-orange-400 shadow-[0_0_8px_theme(colors.orange.400)]',
  '#0000FF': 'bg-blue-500 text-blue-400 shadow-[0_0_8px_theme(colors.blue.400)]',
  [BOMB_PARTICLE.toString()]: 'bg-slate-600 animate-pulse shadow-[0_0_8px_theme(colors.slate.400)] text-slate-400',
};


export const SHAPES: Shape[] = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 0, 1], [1, 1, 1]], // L
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
];

export const LEVEL_UP_LINES = 10;

export const COMBO_MULTIPLIERS: { [key: number]: number } = {
    1: 1,    // Single
    2: 1.5,  // Double
    3: 2.5,  // Triple
    4: 4,    // Quad+
};

export const CHAIN_REACTION_MULTIPLIER_BONUS = 0.5; // e.g., chain 1 = x1, chain 2 = x1.5, chain 3 = x2...