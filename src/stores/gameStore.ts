import { createStore } from "solid-js/store";
import { getActivePlugin } from "./pluginStore";
import { broadcastGameState } from "../utils/socket";

export class GameState {
  constructor(
    public players: Player[],
    public currentTurnPlayerId: string,
    public localPlayerId: string,
    public scoreLabel: string,
    public showMessaging: boolean,
  ) { }
}
export interface Player {
  id: string;
  name: string;
  score: number;
}

const [gameState, setGameState] = createStore<GameState>({
  players: [
    { id: "p1", name: "Player 1", score: 20 },
  ] as Player[],
  currentTurnPlayerId: "p1",
  localPlayerId: "p1",
  scoreLabel: "HP",
  showMessaging: false,
});

export { gameState };

export function initGame(startingScore: number, scoreLabel: string = "HP") {
  setGameState("scoreLabel", scoreLabel);
  gameState.players.forEach((_, idx) => {
    setGameState("players", idx, "score", startingScore);
  });
  broadcastGameState();
}

export function adjustScore(playerId: string, delta: number) {
  const idx = gameState.players.findIndex((p) => p.id === playerId);
  if (idx !== -1) {
    setGameState("players", idx, "score", (s) => s + delta);
  }
  broadcastGameState();
}

export function endTurn() {
  const ids = gameState.players.map((p) => p.id);
  const currentIdx = ids.indexOf(gameState.currentTurnPlayerId);
  const nextIdx = (currentIdx + 1) % ids.length;
  getActivePlugin()?.onTurnEnd?.(gameState.currentTurnPlayerId);
  setGameState("currentTurnPlayerId", ids[nextIdx]);
  getActivePlugin()?.onTurnStart?.(ids[nextIdx]);
  broadcastGameState();
}

export function toggleMessaging() {
  setGameState("showMessaging", (v) => !v);
}

export function addPlayer(player: Player) {
  setGameState("players", [...gameState.players, player]);
  setGameState("localPlayerId", player.id);
  broadcastGameState();
}

export function setGameStateFromPlayer(gameState: GameState, playerId: string) {
  setGameState(gameState);
  setGameState("localPlayerId", playerId);
}
