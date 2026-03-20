import { createSignal, onCleanup, Show } from "solid-js";
import { myUserId } from "../stores/gameStore";
import { getActivePlugin } from "../stores/pluginStore";

export const LoadDeckModal = (props: { onClose?: () => void } = {}) => {
  const [open, setOpen] = createSignal(false);
  const [text, setText] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [errors, setErrors] = createSignal<string[]>([]);

  function openModal() {
    setText("");
    setErrors([]);
    setOpen(true);
    props.onClose?.(); // close the hamburger menu when the modal opens
  }

  function closeModal() {
    if (!loading()) setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") closeModal();
  }

  onCleanup(() => document.removeEventListener("keydown", onKeyDown));

  async function handleLoad() {
    const raw = text().trim();
    if (!raw) return;

    const plugin = getActivePlugin();
    if (!plugin?.loadDeck) {
      setErrors(["Active plugin does not support deck loading."]);
      return;
    }

    setLoading(true);
    setErrors([]);
    document.addEventListener("keydown", onKeyDown);

    try {
      const { errors: errs } = await plugin.loadDeck(raw, myUserId);
      if (errs.length > 0) {
        setErrors(errs);
      } else {
        setOpen(false);
      }
    } catch (e) {
      setErrors([String(e)]);
    } finally {
      setLoading(false);
      document.removeEventListener("keydown", onKeyDown);
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
