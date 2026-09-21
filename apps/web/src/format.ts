import type { Heading } from '@elevator/shared';

export function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

export function formatSimTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function headingSymbol(heading: Heading): '▲' | '▼' | '•' {
  if (heading === 'up') return '▲';
  if (heading === 'down') return '▼';
  return '•';
}
