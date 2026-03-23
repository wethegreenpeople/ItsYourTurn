import { createSignal, Show } from "solid-js";

interface LeaveSectionProps {
  onReturnToMenu?: () => void;
  onQuitGame?: () => void;
}

export function LeaveSection(props: LeaveSectionProps) {
  const [showMenu, setShowMenu] = createSignal(false);

  return (
    <div class="mt-auto pt-2 border-t border-rim/40">
      <Show
        when={showMenu()}
        fallback={
          <button
            class="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-rim/60 bg-transparent
                   text-text-muted/55 text-[.85rem] font-medium cursor-pointer
                   transition-colors duration-150 hover:border-gold/35 hover:text-gold/75 hover:bg-gold/6"
            onClick={() => setShowMenu(true)}
            title="Leave game options"
          >
            <span class="text-base">⤺</span>
            <span class="flex-1 text-left">Leave</span>
          </button>
        }
      >
        <div class="flex flex-col gap-1">
          <Show when={props.onReturnToMenu}>
            <button
              class="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-info/25 bg-info/8
                     text-info/85 text-[.82rem] font-semibold cursor-pointer text-left
                     transition-colors duration-150 hover:bg-info/16 hover:border-info/50 hover:text-info"
              onClick={() => { setShowMenu(false); props.onReturnToMenu!(); }}
              title="Return to menu (you stay in the game)"
            >
              <span class="text-[.9rem] flex-shrink-0">⊞</span>
              <span class="flex-1">Menu</span>
            </button>
          </Show>
          <Show when={props.onQuitGame}>
            <button
              class="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-danger/25 bg-danger/8
                     text-danger/85 text-[.82rem] font-semibold cursor-pointer text-left
                     transition-colors duration-150 hover:bg-danger/16 hover:border-danger/50 hover:text-danger"
              onClick={() => { setShowMenu(false); props.onQuitGame!(); }}
              title="Quit game (removes you from the game)"
            >
              <span class="text-[.9rem] flex-shrink-0">✕</span>
              <span class="flex-1">Quit</span>
            </button>
          </Show>
          <button
            class="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-rim/50 bg-transparent
                   text-text-muted/45 text-[.82rem] font-semibold cursor-pointer text-left
                   transition-colors duration-150 hover:border-rim hover:text-text-muted/75"
            onClick={() => setShowMenu(false)}
          >
            <span class="text-[.9rem] flex-shrink-0">↩</span>
            <span class="flex-1">Back</span>
          </button>
        </div>
      </Show>
    </div>
  );
}
