import { createSignal, For } from "solid-js";

interface PluginInfo {
  id: string;
  name: string;
  maxPlayers: number;
}

interface HostModalProps {
  plugins: PluginInfo[];
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onConfirm: (roomCode: string, isPublic: boolean, pluginId: string, playerCount: number) => void;
  onClose: () => void;
}

function generateCode(): string {
  return Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");
}

const inputStyle =
  "background:rgba(18,18,19,.85);border:1px solid rgba(82,82,91,.7);color:#e8eddf;caret-color:#f5cb5c;box-sizing:border-box";

export function HostModal(props: HostModalProps) {
  const [roomCode] = createSignal(generateCode());
  const [isPublic, setIsPublic] = createSignal(false);
  const [selectedPlugin, setSelectedPlugin] = createSignal(props.plugins[0]?.id ?? "");
  const [playerCount, setPlayerCount] = createSignal(2);

  const currentPlugin = () => props.plugins.find(p => p.id === selectedPlugin()) ?? props.plugins[0];

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
        class="modal-top-accent relative w-full max-w-[460px] rounded-[18px] p-8 animate-[lp-panel-in_.28s_cubic-bezier(.175,.885,.32,1.275)_both] overflow-y-auto"
        style="background:rgba(27,27,30,.98);border:1px solid rgba(82,82,91,.9);box-shadow:0 32px 80px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.04);max-height:90vh"
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
        <div class="mb-6">
          <h2 class="font-cinzel font-semibold text-[1.55rem] m-0 mb-1 leading-tight text-text">Host a Room</h2>
          <p class="text-[.82rem] m-0" style="color:rgba(207,219,213,.4)">Configure your game</p>
        </div>

        {/* Player name */}
        <div class="mb-5">
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

        {/* Visibility */}
        <div class="mb-5">
          <p class="text-[.68rem] font-semibold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(245,203,92,.7)">Visibility</p>
          <div class="flex gap-1 bg-base/90 rounded-[10px] p-1 border border-rim/70">
            <button
              class="flex-1 py-2 px-3 rounded-[7px] border-none cursor-pointer font-semibold text-[.85rem] tracking-wide transition-all duration-200"
              classList={{
                "bg-text-muted/12 text-text-muted shadow-[0_0_0_1px_rgba(207,219,213,.3)]": !isPublic(),
                "bg-transparent text-text-muted/30 hover:text-text-muted/55": isPublic(),
              }}
              onClick={() => setIsPublic(false)}
            >🔒 Private</button>
            <button
              class="flex-1 py-2 px-3 rounded-[7px] border-none cursor-pointer font-semibold text-[.85rem] tracking-wide transition-all duration-200"
              classList={{
                "bg-gold/14 text-gold shadow-[0_0_0_1px_rgba(245,203,92,.35)]": isPublic(),
                "bg-transparent text-text-muted/30 hover:text-text-muted/55": !isPublic(),
              }}
              onClick={() => setIsPublic(true)}
            >🌐 Public</button>
          </div>
          <p class="text-[.72rem] mt-2 m-0" style="color:rgba(207,219,213,.3)">
            {isPublic() ? "Visible in the lobby — anyone can join" : "Only joinable with the room code below"}
          </p>
        </div>

        {/* Room code */}
        <div class="rounded-xl p-4 mb-5 text-center" style="background:rgba(18,18,19,.8);border:1px solid rgba(245,203,92,.15)">
          <p class="text-[.65rem] font-semibold tracking-[.4em] uppercase opacity-60 mb-3 m-0" style="color:#f5cb5c">Room Code</p>
          <div class="flex gap-2 justify-center mb-2">
            <For each={roomCode().split("")}>
              {(char, i) => (
                <span
                  class="animate-[lp-char-summon_.4s_cubic-bezier(.175,.885,.32,1.275)_both] font-cinzel font-bold flex items-center justify-center rounded-[9px]"
                  style={`font-size:2rem;width:52px;height:60px;color:#f5cb5c;background:rgba(245,203,92,.06);border:1px solid rgba(245,203,92,.22);text-shadow:0 0 20px rgba(245,203,92,.45);animation-delay:${i() * 0.08}s`}
                >{char}</span>
              )}
            </For>
          </div>
          <p class="text-[.72rem] m-0" style="color:rgba(207,219,213,.3)">Share this code with friends</p>
        </div>

        {/* Game type */}
        <div class="mb-5">
          <p class="text-[.68rem] font-semibold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(245,203,92,.7)">Game Type</p>
          <select
            class="w-full rounded-[9px] px-4 py-3 text-base outline-none transition-all duration-150 cursor-pointer appearance-none"
            style={`${inputStyle};background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(245,203,92,.5)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:38px`}
            value={selectedPlugin()}
            onChange={(e) => {
              setSelectedPlugin(e.currentTarget.value);
              const p = props.plugins.find(p => p.id === e.currentTarget.value);
              if (p) setPlayerCount(Math.min(playerCount(), p.maxPlayers));
            }}
            onFocus={inputFocus as any}
            onBlur={inputBlur as any}
          >
            <For each={props.plugins}>
              {(plugin) => (
                <option value={plugin.id} style="background:#1b1b1e;color:#e8eddf">
                  {plugin.name} — max {plugin.maxPlayers}
                </option>
              )}
            </For>
          </select>
        </div>

        {/* Player count */}
        <div class="mb-1">
          <div class="flex items-baseline gap-2 mb-3">
            <p class="text-[.68rem] font-semibold tracking-[.3em] uppercase m-0" style="color:rgba(245,203,92,.7)">Players</p>
            <span class="font-cinzel font-semibold text-base ml-auto text-text">{playerCount()}</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              disabled={playerCount() <= 1}
              onClick={() => setPlayerCount(Math.max(1, playerCount() - 1))}
              class="w-[36px] h-[36px] rounded-lg flex items-center justify-center flex-shrink-0 text-xl cursor-pointer transition-all duration-150 leading-none border disabled:opacity-20 disabled:cursor-not-allowed"
              style="border-color:rgba(82,82,91,.7);background:rgba(18,18,19,.5);color:rgba(207,219,213,.6)"
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = "rgba(245,203,92,.5)"; e.currentTarget.style.color = "#f5cb5c"; e.currentTarget.style.background = "rgba(245,203,92,.08)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(82,82,91,.7)"; e.currentTarget.style.color = "rgba(207,219,213,.6)"; e.currentTarget.style.background = "rgba(18,18,19,.5)"; }}
            >−</button>
            <div class="flex gap-[6px] flex-1">
              <For each={Array.from({ length: currentPlugin()?.maxPlayers ?? 4 }, (_, i) => i + 1)}>
                {(n) => (
                  <button
                    onClick={() => setPlayerCount(n)}
                    class="flex-1 h-[6px] rounded p-0 cursor-pointer border-none transition-all duration-150"
                    style={n <= playerCount()
                      ? "background:#f5cb5c;box-shadow:0 0 7px rgba(245,203,92,.35)"
                      : "background:rgba(82,82,91,.5)"}
                  />
                )}
              </For>
            </div>
            <button
              disabled={playerCount() >= (currentPlugin()?.maxPlayers ?? 4)}
              onClick={() => setPlayerCount(Math.min(currentPlugin()?.maxPlayers ?? 4, playerCount() + 1))}
              class="w-[36px] h-[36px] rounded-lg flex items-center justify-center flex-shrink-0 text-xl cursor-pointer transition-all duration-150 leading-none border disabled:opacity-20 disabled:cursor-not-allowed"
              style="border-color:rgba(82,82,91,.7);background:rgba(18,18,19,.5);color:rgba(207,219,213,.6)"
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = "rgba(245,203,92,.5)"; e.currentTarget.style.color = "#f5cb5c"; e.currentTarget.style.background = "rgba(245,203,92,.08)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(82,82,91,.7)"; e.currentTarget.style.color = "rgba(207,219,213,.6)"; e.currentTarget.style.background = "rgba(18,18,19,.5)"; }}
            >+</button>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => { props.onConfirm(roomCode(), isPublic(), selectedPlugin(), playerCount()); props.onClose(); }}
          class="w-full mt-6 py-4 rounded-xl font-cinzel font-bold text-[.92rem] tracking-[.12em] uppercase cursor-pointer transition-all duration-200 border-none"
          style="background:linear-gradient(135deg,#f5cb5c 0%,#c9a034 100%);box-shadow:0 4px 24px rgba(245,203,92,.25),inset 0 1px 0 rgba(255,255,255,.15);color:#1a1c19"
        >Create Room</button>
      </div>
    </div>
  );
}
