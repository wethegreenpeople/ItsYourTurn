import { createSignal, For } from "solid-js";

interface JoinModalProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onConfirm: (roomCode: string) => void;
  onClose: () => void;
}

const inputStyle =
  "background:rgba(18,18,19,.85);border:1px solid rgba(82,82,91,.7);color:#e8eddf;caret-color:#f5cb5c;box-sizing:border-box";

export function JoinModal(props: JoinModalProps) {
  const [joinChars, setJoinChars] = createSignal(["", "", "", ""]);
  const joinCode = () => joinChars().join("");

  const handleInput = (index: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setJoinChars(joinChars().map((c, i) => (i === index ? char : c)));
    if (char && index < 3) {
      (document.getElementById(`jc-${index + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (joinChars()[index]) {
        setJoinChars(joinChars().map((c, i) => (i === index ? "" : c)));
      } else if (index > 0) {
        (document.getElementById(`jc-${index - 1}`) as HTMLInputElement)?.focus();
      }
    }
  };

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
        class="modal-top-accent relative w-full max-w-[420px] rounded-[18px] p-9 animate-[lp-panel-in_.28s_cubic-bezier(.175,.885,.32,1.275)_both]"
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
        >✕</button>

        {/* Header */}
        <div class="mb-2">
          <h2 class="font-cinzel font-semibold text-[1.55rem] m-0 mb-1 leading-tight text-text">Join a Room</h2>
          <p class="text-[.82rem] m-0" style="color:rgba(207,219,213,.4)">Enter the four-letter code</p>
        </div>

        {/* Player name */}
        <div class="mt-6 mb-2">
          <p class="text-[.68rem] font-semibold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(245,203,92,.7)">Your Name</p>
          <input
            type="text" placeholder="Enter your name" maxLength={24}
            value={props.playerName}
            onInput={(e) => props.onPlayerNameChange(e.currentTarget.value)}
            class="w-full rounded-[9px] px-4 py-3 text-base outline-none transition-all duration-150"
            style={inputStyle}
            onFocus={inputFocus as any} onBlur={inputBlur as any}
          />
        </div>

        {/* Code boxes */}
        <div class="flex gap-3 justify-center my-8">
          <For each={[0, 1, 2, 3]}>
            {(i) => (
              <input
                id={`jc-${i}`}
                class="join-char font-cinzel font-bold text-center text-[2.25rem] rounded-[11px] outline-none transition-all duration-150"
                style={`width:68px;height:80px;background:rgba(18,18,19,.85);border:2px solid rgba(82,82,91,.7);caret-color:transparent;color:#f5cb5c;animation:lp-char-summon .38s cubic-bezier(.175,.885,.32,1.275) both;animation-delay:${i * 0.06}s`}
                type="text" maxLength={1} value={joinChars()[i]}
                onInput={(e) => handleInput(i, e.currentTarget.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => (e.currentTarget.style.cssText += ";border-color:rgba(245,203,92,.6);background:rgba(245,203,92,.06);box-shadow:0 0 0 3px rgba(245,203,92,.12)")}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "";
                  e.currentTarget.style.borderColor = joinChars()[i] ? "rgba(245,203,92,.45)" : "rgba(82,82,91,.7)";
                  e.currentTarget.style.background = joinChars()[i] ? "rgba(245,203,92,.06)" : "rgba(18,18,19,.85)";
                }}
                autocomplete="off"
              />
            )}
          </For>
        </div>

        {/* CTA */}
        <button
          disabled={joinCode().length < 4 || !props.playerName.trim()}
          onClick={() => { props.onConfirm(joinCode()); props.onClose(); }}
          class="w-full py-4 rounded-xl font-cinzel font-bold text-[.92rem] tracking-[.12em] uppercase transition-all duration-200 border-none disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          style="background:linear-gradient(135deg,#f5cb5c 0%,#c9a034 100%);box-shadow:0 4px 24px rgba(245,203,92,.25),inset 0 1px 0 rgba(255,255,255,.15);color:#1a1c19"
        >Enter Room</button>
      </div>
    </div>
  );
}
