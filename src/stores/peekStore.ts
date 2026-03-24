import { createSignal } from "solid-js";

export interface PeekState {
  deckId: string;
  count: number;
}

const [peekState, setPeekState] = createSignal<PeekState | null>(null);

export { peekState };
export const openPeek = (deckId: string, count: number) => setPeekState({ deckId, count });
export const closePeek = () => setPeekState(null);
