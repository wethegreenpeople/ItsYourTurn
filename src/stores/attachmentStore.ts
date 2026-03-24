import { createSignal } from "solid-js";
import { gameState, setGameState } from "./gameStore";
import type { Attachment } from "./gameStore";
import { broadcastGameState } from "../utils/socket";

export type { Attachment };

// Local UI state — only the current client cares which card they're attaching from
const [pendingAttachSource, setPendingAttachSource] = createSignal<string | null>(null);

export { pendingAttachSource };

/** Returns card IDs that are attached to the given parent card. */
export function getAttachments(parentId: string): string[] {
  return gameState.attachments
    .filter(a => a.parentId === parentId)
    .map(a => a.childId);
}

/** Returns the parent card ID that this card is attached to, or undefined. */
export function getParent(cardId: string): string | undefined {
  return gameState.attachments.find(a => a.childId === cardId)?.parentId;
}

export function startAttaching(cardId: string) {
  setPendingAttachSource(cardId);
}

export function completeAttach(targetCardId: string) {
  const sourceId = pendingAttachSource();
  if (!sourceId) return;
  setPendingAttachSource(null);
  if (sourceId === targetCardId) return;
  // Prevent circular: don't attach a parent to its own child
  if (getParent(targetCardId) === sourceId) return;
  // Remove any pre-existing attachment for this child (re-attaching)
  const attachment: Attachment = { childId: sourceId, parentId: targetCardId };
  setGameState("attachments", prev => [
    ...prev.filter(a => a.childId !== sourceId),
    attachment,
  ]);
  broadcastGameState();
}

export function cancelAttaching() {
  setPendingAttachSource(null);
}

/** Detach a child card from its parent. */
export function detachCard(cardId: string) {
  setGameState("attachments", prev => prev.filter(a => a.childId !== cardId));
  broadcastGameState();
}

/** Detach all cards attached to the given parent. */
export function detachAll(parentId: string) {
  setGameState("attachments", prev => prev.filter(a => a.parentId !== parentId));
  broadcastGameState();
}
