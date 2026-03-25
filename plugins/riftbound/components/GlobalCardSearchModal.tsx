import { createSignal, createEffect, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { isGlobalSearchOpen, closeGlobalSearch } from "../utils/globalCardSearchStore";
import type { ApiCard } from "../utils/deckParser";
import { createCard } from "../../../src/models/Card";
import { addCardToDeck } from "../../../src/stores/deckStore";
import { currentPlayer } from "../../../src/stores/gameStore";
import { putCached } from "../../../src/lib/cardCache";
import { Button } from "../../../src/components/ui";

const API_BASE = import.meta.env.DEV
  ? "/riftcodex-api"
  : "https://api.riftcodex.com";

export const GlobalCardSearchModal = () => {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<ApiCard[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [addedName, setAddedName] = createSignal<string | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const doSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/cards/name?fuzzy=${encodeURIComponent(trimmed)}&size=20`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.items ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  createEffect(() => {
    const q = query();
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => doSearch(q), 300);
  });

  function addToHand(card: ApiCard) {
    const pid = currentPlayer()?.id;
    if (!pid) return;
    putCached({
      riftbound_id: card.riftbound_id,
      name: card.name,
      image_url: card.media.image_url,
    });
    const newCard = createCard(card.name, card.media.image_url);
    addCardToDeck(`${pid}:hand`, newCard);
    setAddedName(card.name);
    setTimeout(() => setAddedName(null), 2000);
  }

  return (
    <Show when={isGlobalSearchOpen()}>
      <Portal>
        <div
          class="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[modal-fade-in_.15s_ease]"
          onClick={closeGlobalSearch}
        >
          <div
            class="w-full max-w-[700px] rounded-xl border border-rim/70 p-5 flex flex-col gap-3 shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-[modal-slide-in_.18s_cubic-bezier(0.34,1.3,0.64,1)]"
            style="background:linear-gradient(180deg,#27272a 0%,#18181b 100%)"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="font-cinzel text-gold text-base font-bold tracking-wide m-0 flex-shrink-0">
                Card Search
              </h2>
              <input
                class="flex-1 min-w-[140px] rounded-md border border-rim bg-base/90 text-text text-sm px-2.5 py-1.5 transition-colors duration-150 focus:outline-none focus:border-gold/50"
                type="text"
                placeholder="Search any card by name…"
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                autofocus
              />
            </div>

            {/* Added confirmation */}
            <Show when={addedName()}>
              <div class="text-[12px] text-gold bg-gold/12 border border-gold/25 rounded px-3 py-1.5 animate-[modal-fade-in_.15s_ease]">
                Added "{addedName()}" to hand ✓
              </div>
            </Show>

            {/* Results grid */}
            <div class="grid grid-cols-[repeat(auto-fill,88px)] justify-start gap-x-2 gap-y-2.5 max-h-[54vh] min-h-[120px] overflow-y-auto px-1 pt-0.5 pb-1">
              <Show when={loading()}>
                <div class="col-span-full text-center py-10 text-text-muted/45 text-sm">Searching…</div>
              </Show>
              <Show when={!loading() && !query().trim()}>
                <div class="col-span-full text-center py-10 text-text-muted/45 text-sm">
                  Type a card name to search the full card catalog
                </div>
              </Show>
              <Show when={!loading() && !!query().trim() && results().length === 0}>
                <div class="col-span-full text-center py-10 text-text-muted/45 text-sm">
                  No cards found for "{query()}"
                </div>
              </Show>
              <For each={results()}>
                {(card) => (
                  <button
                    class="deck-search-card flex flex-col items-center gap-[5px] w-[88px] bg-transparent border border-transparent rounded-md px-1 pt-[5px] pb-1.5 cursor-pointer transition-[border-color,background] duration-150 text-center hover:border-gold/40 hover:bg-gold/6"
                    style={{ font: "inherit", color: "inherit" }}
                    onClick={() => addToHand(card)}
                    title={`Add "${card.name}" to hand`}
                  >
                    <img
                      src={card.media.image_url}
                      alt={card.name}
                      class="w-[72px] rounded object-cover"
                      draggable="false"
                    />
                    <span
                      class="font-body text-[10px] font-semibold tracking-[0.03em] w-full overflow-hidden text-ellipsis whitespace-nowrap leading-[1.2]"
                      style={{ "font-family": "var(--plugin-font-body, 'Rajdhani', system-ui, sans-serif)", color: "var(--plugin-text-muted, #cfdbd5)" }}
                    >
                      {card.name}
                    </span>
                  </button>
                )}
              </For>
            </div>

            <div class="flex justify-end">
              <Button variant="ghost" onClick={closeGlobalSearch}>Close</Button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
