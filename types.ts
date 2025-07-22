
export type Shape = number[][];
export type Grid = (number | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface Block {
  shape: Shape;
  colorIndex: number;
  position: Position;
}
