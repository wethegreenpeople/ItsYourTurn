export class GameState {
  constructor(
    public players: Player[]
  ) { }
}
export interface Player {
  id: string;
  name: string;
  score: number;
}
