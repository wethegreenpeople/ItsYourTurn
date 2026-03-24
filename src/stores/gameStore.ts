import { createStore, reconcile } from "solid-js/store";
import { getActivePlugin } from "./pluginStore";
import { broadcastGameState } from "../utils/socket";
import { createSignal } from "solid-js";
import { uuid4 } from "../utils/uuid";
import { logEvent } from "./chatStore";
import { Card } from "../models/Card.tsx";

export interface DeckData {
  id: string;
  cards: Card[];
}

export interface CardState {
  faceDown?: boolean;
  horizontal?: boolean;
  tapped?: boolean;
}

export interface Arrow {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Attachment {
  childId: string;
  parentId: string;
}

export interface CardPosition {
  x: number;
  y: number;
}

export interface GameState {
  players: Player[];
  decks: DeckData[];
  cardStates: Record<string, CardState>;
  arrows: Arrow[];
  cardPositions: Record<string, CardPosition>;
  attachments: Attachment[];
  cardCounters: Record<string, number>;
  cardBuffs: Record<string, string[]>;
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
  players: [],
  decks: [],
  cardStates: {},
  arrows: [],
  cardPositions: {},
  attachments: [],
  cardCounters: {},
  cardBuffs: {},
  currentTurnPlayerId: "",
  scoreLabel: "HP",
  showMessaging: false,
  playerStartingScore: 20,
});

export { gameState, setGameState, currentPlayer, setCurrentPlayer };

/** Add a player to the local state and broadcast. */
export function addPlayer(playerId: string, playerName: string) {
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
    const p = gameState.players[idx];
    logEvent(`${p.name} ${gameState.scoreLabel} → ${p.score}`, playerId);
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
  const nextPlayer = gameState.players[nextIdx];
  logEvent(`${nextPlayer?.name ?? "?"}'s turn begins`, ids[nextIdx]);
  broadcastGameState();
}

export function toggleMessaging() {
  setGameState("showMessaging", (v) => !v);
}

/** Remove a player from the game and broadcast the updated state. */
export function removePlayer(playerId: string) {
  const remaining = gameState.players.filter((p) => p.id !== playerId);
  setGameState("players", remaining);
  broadcastGameState();
}

/** Reset all game state (used when fully leaving a room). */
export function resetGameState() {
  setGameState(reconcile({
    players: [],
    decks: [],
    cardStates: {},
    arrows: [],
    cardPositions: {},
    attachments: [],
    cardCounters: {},
    cardBuffs: {},
    currentTurnPlayerId: "",
    scoreLabel: "HP",
    showMessaging: false,
    playerStartingScore: 20,
  }));
}

/**
 * Apply incoming network state. Uses reconcile so SolidJS can
 * diff the incoming data against the existing store instead of
 * blowing away all reactive nodes.
 */
export function applyRemoteState(remote: GameState) {
  setGameState(reconcile(remote));

  const me = remote.players.find((p) => p.id === myUserId);
  if (me) setCurrentPlayer(me);
}
