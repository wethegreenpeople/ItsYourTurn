import { createSignal, createEffect } from "solid-js";
import { gameState } from "./gameStore";

const [viewingPlayerId, setViewingPlayerId] = createSignal(gameState.localPlayerId);

// Auto-follow the current turn player (same behaviour that was previously in App.tsx)
createEffect(() => setViewingPlayerId(gameState.currentTurnPlayerId));

export { viewingPlayerId, setViewingPlayerId };
