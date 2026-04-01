export type GameCatalogEntry = {
  id: string
  titleKey: string
}

export const GAME_CATALOG: GameCatalogEntry[] = [
  { id: 'math-addition', titleKey: 'math-addition' },
  { id: 'math-subtraction', titleKey: 'math-subtraction' },
  { id: 'placeholder-game', titleKey: 'placeholder-game' },
]
