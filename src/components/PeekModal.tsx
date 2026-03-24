import { Show, For } from "solid-js";
import { Portal } from "solid-js/web";
import { peekState, closePeek } from "../stores/peekStore";
import { cardsInDeck } from "../stores/deckStore";
import { CardVisual } from "./card";
import { isHorizontal } from "../stores/cardStateStore";
import { Button } from "./ui";

export const PeekModal = () => {
  const cards = () => {
    const state = peekState();
    if (!state) return [];
    return cardsInDeck(state.deckId).slice(0, state.count);
  };

  return (
    <Show when={peekState()}>
      <Portal>
        <div
          class="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[modal-fade-in_.15s_ease]"
          onClick={closePeek}
        >
          <div
            class="w-full max-w-[700px] rounded-xl border border-rim/70 p-5 flex flex-col gap-3 shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-[modal-slide-in_.18s_cubic-bezier(0.34,1.3,0.64,1)]"
            style="background:linear-gradient(180deg,#27272a 0%,#18181b 100%)"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="font-cinzel text-gold text-base font-bold tracking-wide m-0 flex-shrink-0">
                Peek — Top {peekState()!.count} card{peekState()!.count !== 1 ? "s" : ""}
              </h2>
              <span class="text-[.75em] font-normal text-text-muted ml-auto">
                visible only to you
              </span>
            </div>

            <div class="grid grid-cols-[repeat(auto-fill,88px)] justify-start gap-x-2 gap-y-2.5 max-h-[54vh] min-h-[80px] overflow-y-auto px-1 pt-0.5 pb-1">
              <For
                each={cards()}
                fallback={
                  <div class="col-span-full text-center py-10 text-text-muted/45 text-sm">
                    Deck is empty.
                  </div>
                }
              >
                {(card, i) => (
                  <div class="flex flex-col items-center gap-[5px] w-[88px] px-1 pt-[5px] pb-1.5 text-center">
                    <div class="relative">
                      <span class="absolute -top-1.5 -left-1.5 bg-gold/90 text-[#1a1100] text-[8px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center z-10 leading-none shadow-md">
                        {i() + 1}
                      </span>
                      <CardVisual card={card} horizontal={isHorizontal(card.id)} />
                    </div>
                    <span
                      class="font-body text-[10px] font-semibold tracking-[0.03em] w-full overflow-hidden text-ellipsis whitespace-nowrap leading-[1.2]"
                      style={{ "font-family": "var(--plugin-font-body, 'Inter', system-ui, sans-serif)", color: "var(--plugin-text-muted, #cfdbd5)" }}
                    >
                      {card.name}
                    </span>
                  </div>
                )}
              </For>
            </div>

            <div class="flex justify-end">
              <Button variant="ghost" onClick={closePeek}>Close</Button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
