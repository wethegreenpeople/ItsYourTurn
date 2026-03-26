import { createSignal } from "solid-js";
import { TbOutlineX, TbOutlineSwords } from "solid-icons/tb";
import type { LobbyEntry } from "../utils/lobby";

interface LobbyJoinModalProps {
  game: LobbyEntry;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const inputStyle =
  "background:rgba(18,18,19,.85);border:1px solid rgba(82,82,91,.7);color:#e8eddf;caret-color:#f5cb5c;box-sizing:border-box";

export function LobbyJoinModal(props: LobbyJoinModalProps) {
  const inputFocus = (e: FocusEvent) => {
    const el = e.currentTarget as HTMLInputElement;
    el.style.cssText += ";border-color:rgba(245,203,92,.6);background:rgba(245,203,92,.05);box-shadow:0 0 0 3px rgba(245,203,92,.12)";
  };
  const inputBlur = (e: FocusEvent) => {
    const el = e.currentTarget as HTMLInputElement;
    el.style.borderColor = "rgba(82,82,91,.7)";
    el.style.background = "rgba(18,18,19,.85)";
    el.style.boxShadow = "";
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background:rgba(0,0,0,.75);backdrop-filter:blur(6px);animation:lp-emerge-up .2s ease-out both"
      onClick={props.onClose}
    >
      <div
        class="modal-top-accent relative w-full max-w-[400px] rounded-[18px] p-9 animate-[lp-panel-in_.28s_cubic-bezier(.175,.885,.32,1.275)_both]"
        style="background:rgba(27,27,30,.98);border:1px solid rgba(82,82,91,.9);box-shadow:0 32px 80px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.04)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={props.onClose}
          class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all duration-150"
          style="color:rgba(207,219,213,.4);border:1px solid rgba(82,82,91,.7);background:transparent"
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,203,92,.45)"; e.currentTarget.style.color = "#f5cb5c"; e.currentTarget.style.background = "rgba(245,203,92,.07)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(82,82,91,.7)"; e.currentTarget.style.color = "rgba(207,219,213,.4)"; e.currentTarget.style.background = "transparent"; }}
        ><TbOutlineX size={12} /></button>

        {/* Header */}
        <div class="mb-6">
          <h2 class="font-cinzel font-semibold text-[1.45rem] m-0 mb-1 leading-tight text-text">Join Game</h2>
          <p class="text-[.82rem] m-0" style="color:rgba(207,219,213,.4)">
            Hosted by <span style="color:rgba(207,219,213,.7)">{props.game.hostName}</span>
          </p>
        </div>

        {/* Game info pill */}
        <div class="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-7"
             style="background:rgba(245,203,92,.05);border:1px solid rgba(245,203,92,.15)">
          <div class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base
                      bg-white/4 border border-rim/50 text-text-muted/50"><TbOutlineSwords size={18} /></div>
          <div class="flex flex-col gap-0.5 flex-1 min-w-0">
            <span class="font-cinzel font-semibold text-[.82rem] text-text tracking-wide">{props.game.gameType}</span>
            <span class="text-[.68rem]" style="color:rgba(207,219,213,.35)">
              {props.game.currentPlayers}/{props.game.maxPlayers} players
            </span>
          </div>
          <span class="font-cinzel font-bold tracking-wider text-[.82rem]" style="color:rgba(245,203,92,.6)">{props.game.roomCode}</span>
        </div>

        {/* Player name */}
        <div class="mb-7">
          <p class="text-[.68rem] font-semibold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(245,203,92,.7)">Your Name</p>
          <input
            type="text" placeholder="Enter your name" maxLength={24}
            value={props.playerName}
            onInput={(e) => props.onPlayerNameChange(e.currentTarget.value)}
            class="w-full rounded-[9px] px-4 py-3 text-base outline-none transition-all duration-150"
            style={inputStyle}
            onFocus={inputFocus as any} onBlur={inputBlur as any}
            autofocus
          />
        </div>

        {/* CTA */}
        <button
          disabled={!props.playerName.trim()}
          onClick={() => { props.onConfirm(); props.onClose(); }}
          class="w-full py-4 rounded-xl font-cinzel font-bold text-[.92rem] tracking-[.12em] uppercase transition-all duration-200 border-none disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          style="background:linear-gradient(135deg,#f5cb5c 0%,#c9a034 100%);box-shadow:0 4px 24px rgba(245,203,92,.25),inset 0 1px 0 rgba(255,255,255,.15);color:#1a1c19"
        >Join Game</button>
      </div>
    </div>
  );
}
