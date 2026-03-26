import { createSignal, Show } from "solid-js";
import { TbOutlineArrowBackUp, TbOutlineX, TbOutlineArrowBack } from "solid-icons/tb";

interface LeaveSectionProps {
  onReturnToMenu?: () => void;
  onQuitGame?: () => void;
}

const btn  = "flex items-center gap-2 w-full px-3 py-2 rounded bg-surface/85 border border-raised text-text-muted cursor-pointer transition-colors duration-150";
const icon = "text-sm leading-none flex-shrink-0 w-[1.1rem] text-center";
const lbl  = "flex-1 text-center text-[clamp(9px,.8vw,12px)] font-bold tracking-widest uppercase";

export function LeaveSection(props: LeaveSectionProps) {
  const [showMenu, setShowMenu] = createSignal(false);

  return (
    <div class="mt-auto pt-2 border-t border-rim/40">
      <Show
        when={showMenu()}
        fallback={
          <button
            class={`${btn} hover:border-gold/35 hover:text-gold`}
            onClick={() => setShowMenu(true)}
            title="Leave game options"
          >
            <span class={icon}><TbOutlineArrowBackUp size={14} /></span>
            <span class={lbl}>Leave</span>
          </button>
        }
      >
        <div class="flex flex-col gap-1">
          <Show when={props.onReturnToMenu}>
            <button
              class={`${btn} hover:border-gold/35 hover:text-gold`}
              onClick={() => { setShowMenu(false); props.onReturnToMenu!(); }}
              title="Return to menu (you stay in the game)"
            >
              <span class={icon}><TbOutlineArrowBackUp size={14} /></span>
              <span class={lbl}>Menu</span>
            </button>
          </Show>
          <Show when={props.onQuitGame}>
            <button
              class={`${btn} hover:border-danger/50 hover:text-danger`}
              onClick={() => { setShowMenu(false); props.onQuitGame!(); }}
              title="Quit game (removes you from the game)"
            >
              <span class={icon}><TbOutlineX size={14} /></span>
              <span class={lbl}>Quit</span>
            </button>
          </Show>
          <button
            class={`${btn} text-text-muted/45 hover:border-raised hover:text-text-muted/75`}
            onClick={() => setShowMenu(false)}
          >
            <span class={icon}><TbOutlineArrowBack size={14} /></span>
            <span class={lbl}>Back</span>
          </button>
        </div>
      </Show>
    </div>
  );
}
