import { createSignal, onCleanup, Show } from "solid-js";
import { gameState } from "../stores/gameStore";
import { clearDeck, getDeck } from "../stores/deckStore";
import { loadDeckFromList } from "../../plugins/riftbound/deckParser";

// Maps deck-list section names to zone id suffixes
const SECTION_ZONE: Record<string, string> = {
  Runes: "UnplayedRunes",
};

function zoneForSection(section: string): string {
  return SECTION_ZONE[section] ?? "mainDeck";
}

export const LoadDeckModal = () => {
  const [open, setOpen] = createSignal(false);
  const [text, setText] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [errors, setErrors] = createSignal<string[]>([]);

  function openModal() {
    setText("");
    setErrors([]);
    setOpen(true);
  }

  function closeModal() {
    if (!loading()) setOpen(false);
  }

  // Escape key closes the modal
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") closeModal();
  }

  // Register/unregister Escape listener when modal is open
  const cleanup = () => document.removeEventListener("keydown", onKeyDown);
  onCleanup(cleanup);

  async function handleLoad() {
    const raw = text().trim();
    if (!raw) return;

    setLoading(true);
    setErrors([]);
    document.addEventListener("keydown", onKeyDown);

    try {
      const { sections, errors: errs } = await loadDeckFromList(raw);
      const pid = gameState.localPlayerId;

      // Clear the zones we're about to populate
      clearDeck(`${pid}:mainDeck`);
      clearDeck(`${pid}:UnplayedRunes`);

      for (const { section, cards } of sections) {
        const deck = getDeck(`${pid}:${zoneForSection(section)}`);
        if (!deck) continue;
        for (const card of cards) deck.addCard(card);
      }

      if (errs.length > 0) {
        setErrors(errs);
      } else {
        setOpen(false);
      }
    } catch (e) {
      setErrors([String(e)]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button class="load-deck-btn" onClick={openModal}>
        <span class="load-deck-icon">⊕</span>
        <span class="load-deck-label">Load Deck</span>
      </button>

      <Show when={open()}>
        <div class="modal-backdrop" onClick={closeModal}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <h2 class="modal-title">Load Deck</h2>
            <p class="modal-hint">
              Paste a deck list — supports labelled sections, Riftbound IDs, or
              numbered names with IDs.
            </p>
            <textarea
              class="modal-textarea"
              placeholder="Paste your deck list here…"
              value={text()}
              onInput={(e) => setText(e.currentTarget.value)}
              rows={14}
              disabled={loading()}
              autofocus
            />
            <Show when={errors().length > 0}>
              <ul class="modal-errors">
                {errors().map((err) => (
                  <li class="modal-error-item">{err}</li>
                ))}
              </ul>
            </Show>
            <div class="modal-actions">
              <button
                class="modal-cancel-btn"
                onClick={closeModal}
                disabled={loading()}
              >
                Cancel
              </button>
              <button
                class="modal-load-btn"
                onClick={handleLoad}
                disabled={loading() || !text().trim()}
              >
                {loading() ? "Loading…" : "Load"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};
