import { Show, For, createSignal, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import {
  deckContextMenu,
  hideDeckContextMenu,
  openDeckSearch,
} from "../stores/deckContextMenuStore";
import { shuffleDeck, moveTopCard } from "../stores/deckStore";
import { openPeek } from "../stores/peekStore";

const menuItemClass = "flex items-center w-full py-[7px] px-2.5 bg-transparent border-none rounded text-text font-body text-[clamp(11px,0.9vw,13px)] font-medium tracking-[0.04em] text-left cursor-pointer transition-[background,color] duration-100 whitespace-nowrap hover:bg-gold/12 hover:text-gold active:bg-gold/20";

const PEEK_COUNTS = [1, 2, 3, 5, 7];

export const DeckContextMenu = () => {
  const [peekExpanded, setPeekExpanded] = createSignal(false);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") hideDeckContextMenu();
  };
  onMount(() => document.addEventListener("keydown", onKeyDown));
  onCleanup(() => document.removeEventListener("keydown", onKeyDown));

  const menuX = () => Math.min(deckContextMenu.x, window.innerWidth - 180);
  const menuY = () => Math.min(deckContextMenu.y, window.innerHeight - 5 * 36 - 16);

  return (
    <Show when={deckContextMenu.visible}>
      <Portal>
        <div
          class="fixed inset-0 z-[9998]"
          onClick={hideDeckContextMenu}
          onContextMenu={(e) => { e.preventDefault(); hideDeckContextMenu(); }}
        />
        <div
          class="fixed z-[9999] min-w-[172px] border border-raised rounded-md p-1 flex flex-col gap-px overflow-hidden"
          style={{
            left: `${menuX()}px`,
            top: `${menuY()}px`,
            background: "linear-gradient(180deg, #2b2d2a 0%, #1a1c19 100%)",
            "box-shadow": "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,203,92,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
            animation: "context-menu-in 0.1s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            class={menuItemClass}
            onClick={() => { shuffleDeck(deckContextMenu.deckId); hideDeckContextMenu(); }}
          >Shuffle</button>
          <button
            class={menuItemClass}
            onClick={() => {
              const [pid] = deckContextMenu.deckId.split(":");
              moveTopCard(deckContextMenu.deckId, `${pid}:hand`);
              hideDeckContextMenu();
            }}
          >Draw</button>
          <button
            class={menuItemClass}
            onClick={() => { openDeckSearch(deckContextMenu.deckId); hideDeckContextMenu(); }}
          >Search Deck</button>
          <button
            class={menuItemClass}
            onClick={() => setPeekExpanded(v => !v)}
          >
            Peek{peekExpanded() ? " ▾" : " ▸"}
          </button>
          <Show when={peekExpanded()}>
            <div class="flex gap-1 pl-3 pb-1 flex-wrap">
              <For each={PEEK_COUNTS}>
                {(n) => (
                  <button
                    class="px-2 py-1 rounded text-[11px] font-bold text-gold bg-gold/12 border border-gold/25 cursor-pointer hover:bg-gold/20 transition-colors duration-100"
                    onClick={() => {
                      openPeek(deckContextMenu.deckId, n);
                      hideDeckContextMenu();
                    }}
                  >{n}</button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Portal>
    </Show>
  );
};
