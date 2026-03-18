import { Show, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import {
  deckContextMenu,
  hideDeckContextMenu,
  openDeckSearch,
} from "../stores/deckContextMenuStore";
import { shuffleDeck, moveTopCard } from "../stores/deckStore";

export const DeckContextMenu = () => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") hideDeckContextMenu();
  };
  onMount(() => document.addEventListener("keydown", onKeyDown));
  onCleanup(() => document.removeEventListener("keydown", onKeyDown));

  const menuX = () => Math.min(deckContextMenu.x, window.innerWidth - 180);
  const menuY = () => Math.min(deckContextMenu.y, window.innerHeight - 3 * 36 - 16);

  return (
    <Show when={deckContextMenu.visible}>
      <Portal>
        <div
          class="context-menu-backdrop"
          onClick={hideDeckContextMenu}
          onContextMenu={(e) => { e.preventDefault(); hideDeckContextMenu(); }}
        />
        <div
          class="context-menu"
          style={{ left: `${menuX()}px`, top: `${menuY()}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            class="context-menu-item"
            onClick={() => {
              shuffleDeck(deckContextMenu.deckId);
              hideDeckContextMenu();
            }}
          >
            Shuffle
          </button>
          <button
            class="context-menu-item"
            onClick={() => {
              const [pid] = deckContextMenu.deckId.split(":");
              moveTopCard(deckContextMenu.deckId, `${pid}:hand`);
              hideDeckContextMenu();
            }}
          >
            Draw
          </button>
          <button
            class="context-menu-item"
            onClick={() => {
              openDeckSearch(deckContextMenu.deckId);
              hideDeckContextMenu();
            }}
          >
            Search Deck
          </button>
        </div>
      </Portal>
    </Show>
  );
};
