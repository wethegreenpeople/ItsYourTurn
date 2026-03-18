import { createStore } from "solid-js/store";
import { createSignal } from "solid-js";

interface DeckContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  deckId: string;
}

const [deckContextMenu, setDeckContextMenu] = createStore<DeckContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  deckId: "",
});

export { deckContextMenu };

export function showDeckContextMenu(x: number, y: number, deckId: string) {
  setDeckContextMenu({ visible: true, x, y, deckId });
}

export function hideDeckContextMenu() {
  setDeckContextMenu("visible", false);
}

// Deck search modal state — shared so DeckContextMenu can open it
const [deckSearchId, setDeckSearchId] = createSignal<string | null>(null);
const [deckSearchLabel, setDeckSearchLabel] = createSignal<string | null>(null);
export { deckSearchId, deckSearchLabel };
export const openDeckSearch = (deckId: string, label?: string) => {
  setDeckSearchId(deckId);
  setDeckSearchLabel(label ?? null);
};
export const closeDeckSearch = () => { setDeckSearchId(null); setDeckSearchLabel(null); };
