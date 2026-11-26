export const GRID_SIZE = 20;

export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPoint(x: number, y: number, gridSize = GRID_SIZE): [number, number] {
  return [snapToGrid(x, gridSize), snapToGrid(y, gridSize)];
}
