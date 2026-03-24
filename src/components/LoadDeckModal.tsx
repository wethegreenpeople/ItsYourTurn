import { createSignal, onCleanup, Show } from "solid-js";
import { myUserId } from "../stores/gameStore";
import { getActivePlugin } from "../stores/pluginStore";
import { Button } from "./ui";

export const LoadDeckModal = (props: { onClose?: () => void } = {}) => {
  const [open, setOpen] = createSignal(false);
  const [text, setText] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [errors, setErrors] = createSignal<string[]>([]);

  function openModal() {
    setText("");
    setErrors([]);
    setOpen(true);
    props.onClose?.();
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
      <button
        class="flex items-center gap-2 w-full px-3 py-2 rounded bg-surface/85 border border-raised text-text-muted cursor-pointer transition-colors duration-150 hover:border-gold/35 hover:text-gold"
        onClick={openModal}
      >
        <span class="text-sm leading-none flex-shrink-0 w-[1.1rem] text-center">⊕</span>
        <span class="flex-1 text-center text-[clamp(9px,.8vw,12px)] font-bold tracking-widest uppercase">Load Deck</span>
      </button>

      <Show when={open()}>
        <div
          class="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[modal-fade-in_.15s_ease]"
          onClick={closeModal}
        >
          <div
            class="w-full max-w-[540px] rounded-xl border border-rim/70 p-5 flex flex-col gap-3
                   shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-[modal-slide-in_.18s_cubic-bezier(0.34,1.3,0.64,1)]"
            style="background:linear-gradient(180deg,#27272a 0%,#18181b 100%)"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 class="font-cinzel text-gold text-base font-bold tracking-wide m-0">Load Deck</h2>
            <p class="text-text-muted text-xs m-0 leading-relaxed">
              Paste a deck list — supports labelled sections, Riftbound IDs, or numbered names with IDs.
            </p>
            <textarea
              class="w-full rounded-md border border-rim bg-base/90 text-text font-mono text-xs leading-relaxed
                     p-3 resize-y transition-colors duration-150
                     focus:outline-none focus:border-gold/50
                     disabled:opacity-50 disabled:cursor-not-allowed"
              style="field-sizing:content;min-height:160px;max-height:60vh"
              placeholder="Paste your deck list here…"
              value={text()}
              onInput={(e) => setText(e.currentTarget.value)}
              rows={14}
              disabled={loading()}
              autofocus
            />
            <Show when={errors().length > 0}>
              <ul class="m-0 px-3.5 py-2.5 rounded-md list-none flex flex-col gap-1 bg-danger/12 border border-danger/35">
                {errors().map((err) => (
                  <li class="text-xs" style="color:#f08080">{err}</li>
                ))}
              </ul>
            </Show>
            <div class="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal} disabled={loading()}>Cancel</Button>
              <Button variant="primary" onClick={handleLoad} disabled={loading() || !text().trim()}>
                {loading() ? "Loading…" : "Load"}
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};
