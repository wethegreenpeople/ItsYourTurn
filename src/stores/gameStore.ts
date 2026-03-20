import { createStore, reconcile } from "solid-js/store";
import { getActivePlugin } from "./pluginStore";
import { broadcastGameState } from "../utils/socket";
import { createSignal } from "solid-js";
import { uuid4 } from "../utils/uuid";

export interface GameState {
  players: Player[];
  currentTurnPlayerId: string;
  scoreLabel: string;
  playerStartingScore: number;
  showMessaging: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export const myUserId: string = uuid4();
const [currentPlayer, setCurrentPlayer] = createSignal<Player | null>(null);
const [gameState, setGameState] = createStore<GameState>({
  players: [] as Player[],
  currentTurnPlayerId: "",
  scoreLabel: "HP",
  showMessaging: false,
  playerStartingScore: 20,
});

export { gameState, setGameState, currentPlayer, setCurrentPlayer };

/** Add a player to the local state and broadcast. */
export function addPlayer(playerId: string, playerName: string) {
  // Don't add duplicates
  if (gameState.players.some((p) => p.id === playerId)) return;
  const player: Player = { id: playerId, name: playerName, score: gameState.playerStartingScore };
  setGameState("players", gameState.players.length, player);
  broadcastGameState();
}

/** Configure game settings and reset all player scores. */
export function initGame(startingScore: number, scoreLabel: string = "HP") {
  setGameState("scoreLabel", scoreLabel);
  setGameState("playerStartingScore", startingScore ?? 20);
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

/**
 * Apply incoming network state. Uses reconcile so SolidJS can
 * diff the incoming data against the existing store instead of
 * blowing away all reactive nodes.
 */
export function applyRemoteState(remote: GameState) {
  setGameState(reconcile(remote));

  // Ensure our local currentPlayer stays in sync
  const me = remote.players.find((p) => p.id === myUserId);
  if (me) setCurrentPlayer(me);
}
