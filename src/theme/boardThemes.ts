export type BoardThemeId = 'midnight' | 'hex' | 'ocean';

export const BOARD_THEME_IDS: BoardThemeId[] = ['midnight', 'hex', 'ocean'];

export function isBoardThemeId(value: unknown): value is BoardThemeId {
  return typeof value === 'string' && BOARD_THEME_IDS.includes(value as BoardThemeId);
}

export type BoardTheme = {
  id: BoardThemeId;
  frame: string;
  frameInner: string;
  well: string;
  cellEven: string;
  cellOdd: string;
  cellBorder: string;
  accentColumnIndices: number[];
  accentColumnTint: string;
};

export const boardThemes: Record<BoardThemeId, BoardTheme> = {
  midnight: {
    id: 'midnight',
    frame: '#415a77',
    frameInner: 'rgba(76, 201, 240, 0.22)',
    well: '#0c1224',
    cellEven: '#1a2438',
    cellOdd: '#24324a',
    cellBorder: 'rgba(51, 65, 85, 0.85)',
    accentColumnIndices: [],
    accentColumnTint: 'transparent',
  },
  hex: {
    id: 'hex',
    frame: '#5c4d7a',
    frameInner: 'rgba(255, 209, 102, 0.28)',
    well: '#12101f',
    cellEven: '#1f1a32',
    cellOdd: '#2a2340',
    cellBorder: 'rgba(92, 77, 122, 0.55)',
    accentColumnIndices: [2, 3],
    accentColumnTint: 'rgba(255, 209, 102, 0.09)',
  },
  ocean: {
    id: 'ocean',
    frame: '#2a6f8f',
    frameInner: 'rgba(76, 201, 240, 0.35)',
    well: '#071822',
    cellEven: '#0f2838',
    cellOdd: '#153445',
    cellBorder: 'rgba(42, 111, 143, 0.5)',
    accentColumnIndices: [],
    accentColumnTint: 'transparent',
  },
};

export function cellFill(theme: BoardTheme, row: number, col: number): string {
  return (row + col) % 2 === 0 ? theme.cellEven : theme.cellOdd;
}
