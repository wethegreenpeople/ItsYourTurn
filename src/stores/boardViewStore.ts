import { createSignal, createEffect } from "solid-js";
import { gameState, myUserId } from "./gameStore";

const [viewingPlayerId, setViewingPlayerId] = createSignal(myUserId);

// Auto-follow the current turn player (same behaviour that was previously in App.tsx)
createEffect(() => setViewingPlayerId(gameState.currentTurnPlayerId));

export { viewingPlayerId, setViewingPlayerId };
