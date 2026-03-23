import { createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { deckSearchId, deckSearchLabel, closeDeckSearch } from "../stores/deckContextMenuStore";
import { cardsInDeck, moveCard } from "../stores/deckStore";
import { CardVisual } from "./card";
import { isHorizontal } from "../stores/cardStateStore";
import { Button } from "./ui";

export const DeckSearchModal = () => {
  const [query, setQuery] = createSignal("");

  const deckId = () => deckSearchId();

  const filteredCards = () => {
    const q = query().toLowerCase().trim();
    const all = deckId() ? cardsInDeck(deckId()!) : [];
    return q ? all.filter((c) => c.name.toLowerCase().includes(q)) : all;
  };

  function takeToHand(cardId: string) {
    const id = deckId();
    if (!id) return;
    const [pid] = id.split(":");
    moveCard(cardId, `${pid}:hand`);
  }

  return (
    <Show when={deckId()}>
      <Portal>
        <div
          class="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[modal-fade-in_.15s_ease]"
          onClick={closeDeckSearch}
        >
          <div
            class="w-full max-w-[700px] rounded-xl border border-rim/70 p-5 flex flex-col gap-3
                   shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-[modal-slide-in_.18s_cubic-bezier(0.34,1.3,0.64,1)]"
            style="background:linear-gradient(180deg,#27272a 0%,#18181b 100%)"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="font-cinzel text-gold text-base font-bold tracking-wide m-0 flex-shrink-0">
                {deckSearchLabel() ?? "Search Deck"}
                <span class="text-[.75em] font-normal text-text-muted ml-1">
                  ({cardsInDeck(deckId()!).length} cards)
                </span>
              </h2>
              <input
                class="flex-1 min-w-[140px] rounded-md border border-rim bg-base/90 text-text text-sm
                       px-2.5 py-1.5 transition-colors duration-150
                       focus:outline-none focus:border-gold/50"
                type="text"
                placeholder="Filter by name…"
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                autofocus
              />
            </div>

            {/* Card grid */}
            <div class="deck-search-results grid grid-cols-[repeat(auto-fill,88px)] justify-start gap-x-2 gap-y-2.5 max-h-[54vh] min-h-[120px] overflow-y-auto px-1 pt-0.5 pb-1">
              <For
                each={filteredCards()}
                fallback={
                  <div class="col-span-full text-center py-10 text-text-muted/45 text-sm">
                    No cards match.
                  </div>
                }
              >
                {(card) => (
                  <button
                    class="deck-search-card flex flex-col items-center gap-[5px] w-[88px] bg-transparent border border-transparent rounded-md px-1 pt-[5px] pb-1.5 cursor-pointer transition-[border-color,background] duration-150 text-center hover:border-gold/40 hover:bg-gold/6"
                    style={{ font: "inherit", color: "inherit" }}
                    onClick={() => takeToHand(card.id)}
                    title={`Take "${card.name}" to hand`}
                  >
                    <CardVisual card={card} horizontal={isHorizontal(card.id)} />
                    <span
                      class="font-body text-[10px] font-semibold tracking-[0.03em] w-full overflow-hidden text-ellipsis whitespace-nowrap leading-[1.2]"
                      style={{ "font-family": "var(--plugin-font-body, 'Inter', system-ui, sans-serif)", color: "var(--plugin-text-muted, #cfdbd5)" }}
                    >
                      {card.name}
                    </span>
                  </button>
                )}
              </For>
            </div>

            <div class="flex justify-end">
              <Button variant="ghost" onClick={closeDeckSearch}>Close</Button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
