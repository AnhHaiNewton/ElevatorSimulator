import type { Direction, Heading } from '@elevator/shared';

export function step(dir: Direction): 1 | -1 {
  return dir === 'up' ? 1 : -1;
}

export function opposite(dir: Direction): Direction {
  return dir === 'up' ? 'down' : 'up';
}

export function symbol(heading: Heading): '▲' | '▼' | '•' {
  if (heading === 'up') return '▲';
  if (heading === 'down') return '▼';
  return '•';
}
