import { createSignal } from "solid-js";
import { gameState, setGameState } from "./gameStore";
import type { Arrow } from "./gameStore";
import { broadcastGameState } from "../utils/socket";

// pendingSource is local UI state — only the current client cares which card
// they're in the process of targeting from.
const [pendingSource, setPendingSource] = createSignal<string | null>(null);

export { pendingSource };

// Arrows are read directly from gameState.arrows
export { type Arrow };
export const arrows = () => gameState.arrows;

export function startTargeting(cardId: string) {
  setPendingSource(cardId);
}

export function completeTarget(targetCardId: string) {
  const sourceId = pendingSource();
  if (!sourceId) return;
  setPendingSource(null);
  if (sourceId === targetCardId) return;
  const arrow: Arrow = { id: `${Date.now()}-${Math.random()}`, sourceId, targetId: targetCardId };
  setGameState("arrows", (prev) => [...prev, arrow]);
  broadcastGameState();
}

export function cancelTargeting() {
  setPendingSource(null);
}

export function stopTargeting(cardId: string) {
  setGameState("arrows", (prev) => prev.filter((a) => a.sourceId !== cardId));
  broadcastGameState();
}

export function removeArrow(id: string) {
  setGameState("arrows", (prev) => prev.filter((a) => a.id !== id));
  broadcastGameState();
}

export function clearArrows() {
  setGameState("arrows", []);
  broadcastGameState();
}

export function isTargeting(cardId: string) {
  return gameState.arrows.some((a) => a.sourceId === cardId);
}
