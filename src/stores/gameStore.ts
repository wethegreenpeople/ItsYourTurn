import { createStore } from "solid-js/store";
import { getActivePlugin } from "./pluginStore";
import { Player } from "../models/GameState";

const [gameState, setGameState] = createStore({
  players: [
    { id: "p1", name: "Player 1", score: 20 },
    { id: "p2", name: "Player 2", score: 20 },
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
}

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
  getActivePlugin()?.onTurnEnd?.(gameState.currentTurnPlayerId);
  setGameState("currentTurnPlayerId", ids[nextIdx]);
  getActivePlugin()?.onTurnStart?.(ids[nextIdx]);
}

export function toggleMessaging() {
  setGameState("showMessaging", (v) => !v);
}
