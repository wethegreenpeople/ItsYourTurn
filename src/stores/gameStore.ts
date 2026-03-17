import { createStore } from "solid-js/store";

export interface Player {
  id: string;
  name: string;
  score: number;
}

const [gameState, setGameState] = createStore({
  players: [
    { id: "p1", name: "Player 1", score: 20 },
    { id: "p2", name: "Player 2", score: 20 },
  ] as Player[],
  currentTurnPlayerId: "p1",
  localPlayerId: "p1",
  showMessaging: false,
});

export { gameState };

export function adjustScore(playerId: string, delta: number) {
  const idx = gameState.players.findIndex((p) => p.id === playerId);
  if (idx !== -1) {
    setGameState("players", idx, "score", (s) => s + delta);
  }
}

export function endTurn() {
  const ids = gameState.players.map((p) => p.id);
  const currentIdx = ids.indexOf(gameState.currentTurnPlayerId);
  const nextIdx = (currentIdx + 1) % ids.length;
  setGameState("currentTurnPlayerId", ids[nextIdx]);
}

export function toggleMessaging() {
  setGameState("showMessaging", (v) => !v);
}
