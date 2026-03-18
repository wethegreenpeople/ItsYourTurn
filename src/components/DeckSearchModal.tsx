import { createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { deckSearchId, deckSearchLabel, closeDeckSearch } from "../stores/deckContextMenuStore";
import { cardsInDeck, moveCard } from "../stores/deckStore";
import { CardVisual } from "./card";
import { isHorizontal } from "../stores/cardStateStore";

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
        <div class="modal-backdrop" onClick={closeDeckSearch}>
          <div
            class="modal deck-search-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="deck-search-header">
              <h2 class="modal-title">
                {deckSearchLabel() ?? "Search Deck"}
                <span class="deck-search-count">
                  {" "}({cardsInDeck(deckId()!).length} cards)
                </span>
              </h2>
              <input
                class="deck-search-input"
                type="text"
                placeholder="Filter by name…"
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                autofocus
              />
            </div>

            <div class="deck-search-results">
              <For
                each={filteredCards()}
                fallback={
                  <div class="deck-search-empty">No cards match.</div>
                }
              >
                {(card) => (
                  <button
                    class="deck-search-card"
                    onClick={() => takeToHand(card.id)}
                    title={`Take "${card.name}" to hand`}
                  >
                    <CardVisual card={card} horizontal={isHorizontal(card.id)} />
                    <span class="deck-search-card-name">{card.name}</span>
                  </button>
                )}
              </For>
            </div>

            <div class="modal-actions">
              <button class="modal-cancel-btn" onClick={closeDeckSearch}>
                Close
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
