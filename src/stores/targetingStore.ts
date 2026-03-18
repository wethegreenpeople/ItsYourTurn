import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

export type Arrow = { id: string; sourceId: string; targetId: string };

const [pendingSource, setPendingSource] = createSignal<string | null>(null);
const [arrows, setArrows] = createStore<Arrow[]>([]);

export function startTargeting(cardId: string) {
  setPendingSource(cardId);
}

export function completeTarget(targetCardId: string) {
  const sourceId = pendingSource();
  if (!sourceId) return;
  setPendingSource(null);
  if (sourceId === targetCardId) return; // targeting self = cancel
  setArrows(prev => [
    ...prev,
    { id: `${Date.now()}-${Math.random()}`, sourceId, targetId: targetCardId },
  ]);
}

export function cancelTargeting() {
  setPendingSource(null);
}

export function stopTargeting(cardId: string) {
  const matchingArrows: Arrow[] | null = arrows.filter(s => s.sourceId === cardId) ?? null;
  if (matchingArrows === null) return;
  for (let item of matchingArrows) {
    removeArrow(item.id);
  }
}

export function removeArrow(id: string) {
  setArrows(a => a.filter(arrow => arrow.id !== id));
}

export function clearArrows() {
  setArrows([]);
}

export function isTargeting(cardId: string) {
  const arrow: Arrow | null = arrows.find(s => s.sourceId === cardId) ?? null;
  return arrow === null ? false : true;
}

export { pendingSource, arrows };
