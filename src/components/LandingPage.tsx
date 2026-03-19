import { createMemo, createSignal, For, Show } from "solid-js";
import { uuid4 } from "../utils/uuid";

// Load all plugin info.json files at build time
const pluginModules = import.meta.glob("../../plugins/**/info.json", { eager: true });

interface PluginInfo {
  id: string;
  name: string;
  maxPlayers: number;
}

const plugins: PluginInfo[] = Object.entries(pluginModules).map(([path, mod]: [string, any]) => {
  const data = mod.default ?? mod;
  return { id: data.name, name: data.name ?? "Unknown", maxPlayers: data.maxPlayers ?? 4 };
});

function generateCode(): string {
  return Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
}

interface LandingPageProps {
  onHostGame: (roomCode: string) => void;
  onJoinGame: (roomCode: string) => void;
}

export function LandingPage(props: LandingPageProps) {
  const [showHost, setShowHost] = createSignal(false);
  const [showJoin, setShowJoin] = createSignal(false);
  const [selectedPlugin, setSelectedPlugin] = createSignal(plugins[0]?.id ?? "");
  const [playerCount, setPlayerCount] = createSignal(2);
  const [roomCode] = createSignal(generateCode());
  const [joinChars, setJoinChars] = createSignal(["", "", "", ""]);

  const currentPlugin = createMemo(() => plugins.find((p) => p.id === selectedPlugin()) ?? plugins[0]);
  const playerId = createMemo(() => uuid4());
  const joinCode = () => joinChars().join("");

  const handleJoinInput = (index: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    const updated = joinChars().map((c, i) => (i === index ? char : c));
    setJoinChars(updated);
    if (char && index < 3) {
      (document.getElementById(`jc-${index + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleJoinKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (joinChars()[index]) {
        setJoinChars(joinChars().map((c, i) => (i === index ? "" : c)));
      } else if (index > 0) {
        (document.getElementById(`jc-${index - 1}`) as HTMLInputElement)?.focus();
      }
    }
  };

  const openHost = () => setShowHost(true);
  const openJoin = () => { setJoinChars(["", "", "", ""]); setShowJoin(true); };

  return (
    <div class="fixed inset-0 bg-obsidian flex items-center justify-center overflow-hidden font-rajdhani">
      {/* Keyframe definitions */}
      <style>{`
        @keyframes grid-drift { from { transform: translate(0,0); } to { transform: translate(64px,64px); } }
        @keyframes glow-breathe {
          0%,100% { opacity:.55; transform:translate(-50%,-50%) scale(.95); }
          50%      { opacity:1;   transform:translate(-50%,-50%) scale(1.05); }
        }
        @keyframes emerge-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes rule-expand { from { width:0; } to { width:100px; } }
        @keyframes panel-in {
          from { opacity:0; transform:scale(.91) translateY(16px); }
          to   { opacity:1; transform:scale(1)    translateY(0); }
        }
        @keyframes char-summon {
          from { opacity:0; transform:scale(.6) translateY(8px); filter:blur(4px); }
          to   { opacity:1; transform:scale(1)  translateY(0);   filter:blur(0); }
        }
        .lp-grid-bg {
          position:absolute; inset:-10%;
          background-image:
            linear-gradient(rgba(201,168,76,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,.04) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 70% 70% at center, black 20%, transparent 75%);
          animation: grid-drift 22s linear infinite;
        }
        .lp-glow {
          position:absolute; border-radius:50%;
          top:50%; left:50%;
          transform:translate(-50%,-50%);
          pointer-events:none;
        }
        .lp-emerge { animation: emerge-up .9s cubic-bezier(.22,1,.36,1) both; }
        .lp-emerge-delay { animation: emerge-up .9s cubic-bezier(.22,1,.36,1) .2s both; }
        .lp-panel { animation: panel-in .32s cubic-bezier(.175,.885,.32,1.275) both; }
        .lp-rule { animation: rule-expand 1s ease-out .5s both; }
        .lp-char-summon { animation: char-summon .45s cubic-bezier(.175,.885,.32,1.275) both; }
        .lp-action:hover .lp-chevron { opacity:1; transform:translateX(0); }
        .lp-action:hover .lp-action-icon {
          background: rgba(201,168,76,.14);
          border-color: rgba(201,168,76,.45);
          filter: drop-shadow(0 0 12px rgba(201,168,76,.4));
        }
        .modal-top-accent::before {
          content:''; position:absolute; top:-1px; left:20%; right:20%; height:1px;
          background: linear-gradient(90deg, transparent, #c9a84c 40%, #c9a84c 60%, transparent);
        }
        .join-char:not([value=""]) {
          border-color: rgba(201,168,76,.5);
          text-shadow: 0 0 20px rgba(201,168,76,.5);
        }
      `}</style>

      {/* — Background — */}
      <div class="absolute inset-0 pointer-events-none">
        <div class="lp-grid-bg" />
        <div class="lp-glow" style="width:700px;height:700px;background:radial-gradient(circle,rgba(201,168,76,.11) 0%,transparent 65%);animation:glow-breathe 5s ease-in-out infinite;" />
        <div class="lp-glow" style="width:1000px;height:1000px;background:radial-gradient(circle,rgba(90,60,180,.07) 0%,transparent 65%);animation:glow-breathe 7s ease-in-out infinite reverse;animation-delay:-3s;" />
        <div class="absolute inset-0" style="background:radial-gradient(ellipse 80% 80% at center, transparent 40%, rgba(11,14,26,.85) 100%)" />
      </div>

      {/* — Main content — */}
      <div class="relative z-10 flex flex-col items-center gap-14 px-6 w-full max-w-[540px]">

        {/* Title */}
        <div class="text-center lp-emerge">
          <p class="text-gold text-[.72rem] font-bold tracking-[.5em] uppercase opacity-75 mb-2">TCG Online</p>
          <h1 class="font-cinzel font-bold text-arcane leading-none tracking-[.06em] m-0"
              style="font-size:clamp(3.5rem,10vw,6rem);text-shadow:0 0 80px rgba(201,168,76,.25),0 0 20px rgba(201,168,76,.15),0 3px 6px rgba(0,0,0,.9)">
            THE ARENA
          </h1>
          <div class="lp-rule mx-auto my-4" style="height:1px;background:linear-gradient(90deg,transparent,#c9a84c 40%,#c9a84c 60%,transparent)" />
          <p class="text-arcane-dim text-[.88rem] tracking-[.3em] uppercase opacity-50 m-0">Choose your destiny</p>
        </div>

        {/* Action buttons */}
        <div class="flex flex-col w-full lp-emerge-delay">

          {/* Host */}
          <button
            onClick={openHost}
            class="lp-action group flex items-center gap-5 px-7 py-[1.4rem] text-left w-full cursor-pointer transition-all duration-200
                   bg-[rgba(22,26,44,.7)] border border-rim/80 backdrop-blur-md
                   rounded-t-xl border-b-rim/40
                   hover:border-gold/45 hover:bg-[rgba(28,33,55,.95)] hover:translate-x-1"
          >
            <div class="lp-action-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200
                        bg-[rgba(201,168,76,.08)] border border-gold/20"
                 style="filter:drop-shadow(0 0 6px rgba(201,168,76,.2))">
              ⚔
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <span class="font-cinzel font-semibold text-arcane text-[1.15rem] leading-none">Host a Room</span>
              <span class="text-arcane-dim text-[.82rem] opacity-55 tracking-[.04em]">Create and invite others</span>
            </div>
            <span class="lp-chevron text-gold text-base opacity-0 -translate-x-2 transition-all duration-200">›</span>
          </button>

          {/* Divider */}
          <div class="flex items-center h-8 px-7 gap-3
                      bg-[rgba(14,17,30,.95)] border-x border-rim/60
                      text-arcane-dim/35 text-[.7rem] tracking-[.25em] uppercase">
            <span class="flex-1 h-px bg-rim/50" />
            or
            <span class="flex-1 h-px bg-rim/50" />
          </div>

          {/* Join */}
          <button
            onClick={openJoin}
            class="lp-action group flex items-center gap-5 px-7 py-[1.4rem] text-left w-full cursor-pointer transition-all duration-200
                   bg-[rgba(22,26,44,.7)] border border-rim/80 backdrop-blur-md
                   rounded-b-xl border-t-0
                   hover:border-gold/45 hover:bg-[rgba(28,33,55,.95)] hover:translate-x-1"
          >
            <div class="lp-action-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200
                        bg-[rgba(201,168,76,.08)] border border-gold/20"
                 style="filter:drop-shadow(0 0 6px rgba(201,168,76,.2))">
              🔮
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <span class="font-cinzel font-semibold text-arcane text-[1.15rem] leading-none">Join a Room</span>
              <span class="text-arcane-dim text-[.82rem] opacity-55 tracking-[.04em]">Enter a room code</span>
            </div>
            <span class="lp-chevron text-gold text-base opacity-0 -translate-x-2 transition-all duration-200">›</span>
          </button>

        </div>
      </div>

      {/* ══════════════ HOST MODAL ══════════════ */}
      <Show when={showHost()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(7,9,18,.88)]"
             style="backdrop-filter:blur(8px);animation:emerge-up .2s ease-out both"
             onClick={() => setShowHost(false)}>
          <div class="modal-top-accent relative w-full max-w-[440px] rounded-[18px] p-9 lp-panel"
               style="background:rgba(17,20,35,.98);border:1px solid rgba(58,61,84,.9);box-shadow:0 30px 90px rgba(0,0,0,.75),0 0 0 1px rgba(201,168,76,.08),inset 0 1px 0 rgba(255,255,255,.04)"
               onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button onClick={() => setShowHost(false)}
                    class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all duration-150
                           text-arcane-dim/50 border border-rim/80 bg-transparent
                           hover:border-gold/50 hover:text-gold hover:bg-[rgba(201,168,76,.08)]">
              ✕
            </button>

            {/* Header */}
            <div class="mb-7">
              <h2 class="font-cinzel font-semibold text-arcane text-[1.6rem] m-0 mb-1 leading-tight">Host a Room</h2>
              <p class="text-arcane-dim/50 text-[.85rem] m-0 tracking-[.06em]">Configure your game</p>
            </div>

            {/* Room code */}
            <div class="rounded-xl p-5 mb-6 text-center"
                 style="background:rgba(8,10,20,.8);border:1px solid rgba(201,168,76,.18)">
              <p class="text-gold text-[.68rem] font-bold tracking-[.4em] uppercase opacity-70 mb-3 m-0">Room Code</p>
              <div class="flex gap-2 justify-center mb-3">
                <For each={roomCode().split("")}>
                  {(char, i) => (
                    <span class="lp-char-summon font-cinzel font-bold text-gold flex items-center justify-center rounded-[9px]"
                          style={`
                            font-size:2.25rem; width:58px; height:68px;
                            background:rgba(201,168,76,.07); border:1px solid rgba(201,168,76,.25);
                            text-shadow:0 0 24px rgba(201,168,76,.55);
                            animation-delay:${i() * 0.08}s
                          `}>
                      {char}
                    </span>
                  )}
                </For>
              </div>
              <p class="text-arcane-dim/40 text-[.76rem] m-0 tracking-[.04em]">Share this code with other players</p>
            </div>

            {/* Game type */}
            <div class="mb-5">
              <p class="text-gold/75 text-[.72rem] font-bold tracking-[.3em] uppercase mb-2 m-0">Game Type</p>
              <div class="flex flex-col gap-1">
                <For each={plugins}>
                  {(plugin) => (
                    <button
                      onClick={() => { setSelectedPlugin(plugin.id); setPlayerCount(Math.min(playerCount(), plugin.maxPlayers)); }}
                      class="flex items-center justify-between px-4 py-3 rounded-[9px] text-left cursor-pointer font-rajdhani text-base font-medium transition-all duration-150 border"
                      classList={{
                        "border-gold bg-[rgba(201,168,76,.1)] text-gold": selectedPlugin() === plugin.id,
                        "border-rim/70 bg-[rgba(24,28,48,.6)] text-arcane-dim hover:border-gold/35 hover:text-arcane hover:bg-[rgba(30,34,54,.8)]": selectedPlugin() !== plugin.id,
                      }}
                    >
                      <span>{plugin.name}</span>
                      <span class="text-[.72rem] opacity-50 tracking-[.05em]">max {plugin.maxPlayers}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Player count */}
            <div class="mb-1">
              <div class="flex items-baseline gap-2 mb-3">
                <p class="text-gold/75 text-[.72rem] font-bold tracking-[.3em] uppercase m-0">Players</p>
                <span class="font-cinzel font-semibold text-arcane text-base ml-auto">{playerCount()}</span>
              </div>
              <div class="flex items-center gap-3">
                <button
                  disabled={playerCount() <= 1}
                  onClick={() => setPlayerCount(Math.max(1, playerCount() - 1))}
                  class="w-[38px] h-[38px] rounded-lg flex items-center justify-center flex-shrink-0 text-xl cursor-pointer transition-all duration-150 leading-none border border-rim/80 bg-[rgba(24,28,48,.6)] text-arcane-dim hover:enabled:border-gold hover:enabled:text-gold hover:enabled:bg-[rgba(201,168,76,.1)] disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <div class="flex gap-[6px] flex-1">
                  <For each={Array.from({ length: currentPlugin()?.maxPlayers ?? 4 }, (_, i) => i + 1)}>
                    {(n) => (
                      <button
                        onClick={() => setPlayerCount(n)}
                        class="flex-1 h-[7px] rounded p-0 cursor-pointer border-none transition-all duration-150"
                        classList={{
                          "bg-gold": n <= playerCount(),
                          "bg-rim/80 hover:bg-[rgba(201,168,76,.35)]": n > playerCount(),
                        }}
                        style={n <= playerCount() ? "box-shadow:0 0 8px rgba(201,168,76,.4)" : ""}
                      />
                    )}
                  </For>
                </div>
                <button
                  disabled={playerCount() >= (currentPlugin()?.maxPlayers ?? 4)}
                  onClick={() => setPlayerCount(Math.min(currentPlugin()?.maxPlayers ?? 4, playerCount() + 1))}
                  class="w-[38px] h-[38px] rounded-lg flex items-center justify-center flex-shrink-0 text-xl cursor-pointer transition-all duration-150 leading-none border border-rim/80 bg-[rgba(24,28,48,.6)] text-arcane-dim hover:enabled:border-gold hover:enabled:text-gold hover:enabled:bg-[rgba(201,168,76,.1)] disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => { props.onHostGame(roomCode()); setShowHost(false); }}
              class="w-full mt-6 py-4 rounded-xl font-cinzel font-bold text-[.95rem] tracking-[.12em] uppercase cursor-pointer transition-all duration-200 text-obsidian border-none"
              style="background:linear-gradient(135deg,#c9a84c 0%,#a8873d 100%);box-shadow:0 4px 24px rgba(201,168,76,.28),inset 0 1px 0 rgba(255,255,255,.15)"
            >
              Create Room
            </button>
          </div>
        </div>
      </Show>

      {/* ══════════════ JOIN MODAL ══════════════ */}
      <Show when={showJoin()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(7,9,18,.88)]"
             style="backdrop-filter:blur(8px);animation:emerge-up .2s ease-out both"
             onClick={() => setShowJoin(false)}>
          <div class="modal-top-accent relative w-full max-w-[440px] rounded-[18px] p-9 lp-panel"
               style="background:rgba(17,20,35,.98);border:1px solid rgba(58,61,84,.9);box-shadow:0 30px 90px rgba(0,0,0,.75),0 0 0 1px rgba(201,168,76,.08),inset 0 1px 0 rgba(255,255,255,.04)"
               onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button onClick={() => setShowJoin(false)}
                    class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all duration-150
                           text-arcane-dim/50 border border-rim/80 bg-transparent
                           hover:border-gold/50 hover:text-gold hover:bg-[rgba(201,168,76,.08)]">
              ✕
            </button>

            {/* Header */}
            <div class="mb-2">
              <h2 class="font-cinzel font-semibold text-arcane text-[1.6rem] m-0 mb-1 leading-tight">Join a Room</h2>
              <p class="text-arcane-dim/50 text-[.85rem] m-0 tracking-[.06em]">Enter the four-letter code</p>
            </div>

            {/* Code inputs */}
            <div class="flex gap-3 justify-center my-8">
              <For each={[0, 1, 2, 3]}>
                {(i) => (
                  <input
                    id={`jc-${i}`}
                    class="join-char font-cinzel font-bold text-gold text-center text-[2.25rem] rounded-[11px] outline-none transition-all duration-150"
                    style="width:72px;height:84px;background:rgba(8,10,20,.85);border:2px solid rgba(58,61,84,.8);caret-color:transparent;animation:char-summon .4s cubic-bezier(.175,.885,.32,1.275) both"
                    style:animation-delay={`${i * 0.06}s`}
                    type="text"
                    maxLength={1}
                    value={joinChars()[i]}
                    onInput={(e) => handleJoinInput(i, e.currentTarget.value)}
                    onKeyDown={(e) => handleJoinKeyDown(i, e)}
                    onFocus={(e) => (e.currentTarget.style.cssText += ";border-color:#c9a84c;background:rgba(201,168,76,.07);box-shadow:0 0 0 3px rgba(201,168,76,.14),0 0 24px rgba(201,168,76,.1)")}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "";
                      e.currentTarget.style.borderColor = joinChars()[i] ? "rgba(201,168,76,.5)" : "rgba(58,61,84,.8)";
                      e.currentTarget.style.background = joinChars()[i] ? "rgba(201,168,76,.07)" : "rgba(8,10,20,.85)";
                    }}
                    autocomplete="off"
                  />
                )}
              </For>
            </div>

            {/* CTA */}
            <button
              disabled={joinCode().length < 4}
              onClick={() => { props.onJoinGame(joinCode()); setShowJoin(false); }}
              class="w-full py-4 rounded-xl font-cinzel font-bold text-[.95rem] tracking-[.12em] uppercase transition-all duration-200 text-obsidian border-none disabled:opacity-30 disabled:cursor-not-allowed"
              style="background:linear-gradient(135deg,#c9a84c 0%,#a8873d 100%);box-shadow:0 4px 24px rgba(201,168,76,.28),inset 0 1px 0 rgba(255,255,255,.15);cursor:pointer"
            >
              Enter Room
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
