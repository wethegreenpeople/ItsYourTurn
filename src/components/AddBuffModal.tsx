import { Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { buffCardId, closeAddBuff } from "../stores/addBuffStore";
import { addBuff } from "../stores/counterStore";
import { Button } from "./ui";

export const AddBuffModal = () => {
  const [text, setText] = createSignal("");

  function submit() {
    const id = buffCardId();
    const label = text().trim();
    if (!id || !label) return;
    addBuff(id, label);
    setText("");
    closeAddBuff();
  }

  return (
    <Show when={buffCardId()}>
      <Portal>
        <div
          class="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[modal-fade-in_.15s_ease]"
          onClick={closeAddBuff}
        >
          <div
            class="w-full max-w-[360px] rounded-xl border border-rim/70 p-5 flex flex-col gap-4 shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-[modal-slide-in_.18s_cubic-bezier(0.34,1.3,0.64,1)]"
            style="background:linear-gradient(180deg,#27272a 0%,#18181b 100%)"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 class="font-cinzel text-gold text-base font-bold tracking-wide m-0">Add Buff</h2>
            <input
              class="rounded-md border border-rim bg-base/90 text-text text-sm px-2.5 py-2 transition-colors duration-150 focus:outline-none focus:border-gold/50"
              type="text"
              placeholder="e.g. Haste, Ward, Silenced…"
              value={text()}
              onInput={(e) => setText(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") closeAddBuff(); }}
              autofocus
            />
            <div class="flex gap-2 justify-end">
              <Button variant="ghost" onClick={closeAddBuff}>Cancel</Button>
              <Button variant="primary" onClick={submit} disabled={!text().trim()}>Add</Button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
