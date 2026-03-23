import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { subscribeLobby, unsubscribeLobby, type LobbyEntry } from "../utils/lobby";
import { savedGames, loadSavedGames, removeSavedGame } from "../stores/savedGamesStore";

// Load all plugin info.json files at build time
const pluginModules = import.meta.glob("../../plugins/**/info.json", { eager: true });

interface PluginInfo {
  id: string;
  name: string;
  maxPlayers: number;
}

const plugins: PluginInfo[] = Object.entries(pluginModules).map(([, mod]: [string, any]) => {
  const data = mod.default ?? mod;
  return { id: data.name, name: data.name ?? "Unknown", maxPlayers: data.maxPlayers ?? 4 };
});

function generateCode(): string {
  return Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
}

interface LandingPageProps {
  onHostGame: (roomCode: string, playerName: string, isPublic: boolean, gameType: string, maxPlayers: number) => void;
  onJoinGame: (roomCode: string, playerName: string) => void;
}

type Screen = "main" | "lobby";

export function LandingPage(props: LandingPageProps) {
  // Screen navigation
  const [screen, setScreen] = createSignal<Screen>("main");

  // Modal visibility
  const [showHost, setShowHost] = createSignal(false);
  const [showJoin, setShowJoin] = createSignal(false);

  // Host form state
  const [selectedPlugin, setSelectedPlugin] = createSignal(plugins[0]?.id ?? "");
  const [playerCount, setPlayerCount] = createSignal(2);
  const [isPublicGame, setIsPublicGame] = createSignal(false);
  const [roomCode] = createSignal(generateCode());

  // Join form state
  const [joinChars, setJoinChars] = createSignal(["", "", "", ""]);

  // Shared
  const [playerName, setPlayerName] = createSignal(localStorage.getItem("tcg-player-name") ?? "");

  // Lobby
  const [lobbyGames, setLobbyGames] = createSignal<LobbyEntry[]>([]);
  const [lobbyLoading, setLobbyLoading] = createSignal(false);

  const submitName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem("tcg-player-name", trimmed);
    return trimmed || "Player";
  };

  const currentPlugin = createMemo(() => plugins.find((p) => p.id === selectedPlugin()) ?? plugins[0]);
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

  const openLobby = () => {
    setScreen("lobby");
    setLobbyLoading(true);
    subscribeLobby((games) => {
      setLobbyGames(games);
      setLobbyLoading(false);
    });
  };

  const closeLobby = () => {
    setScreen("main");
    unsubscribeLobby();
    setLobbyGames([]);
  };

  // Load saved games on mount
  loadSavedGames();

  onCleanup(() => {
    unsubscribeLobby();
  });

  const myGames = createMemo(() => savedGames());

  return (
    <div class="fixed inset-0 flex items-center justify-center overflow-hidden font-rajdhani"
         style="background:#0b0e1a">
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
        @keyframes slide-in-right {
          from { opacity:0; transform:translateX(40px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity:0; transform:translateX(-40px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.6; transform:scale(0.85); }
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }

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
        .lp-slide-right { animation: slide-in-right .35s cubic-bezier(.22,1,.36,1) both; }
        .lp-slide-left { animation: slide-in-left .35s cubic-bezier(.22,1,.36,1) both; }
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
          border-color: rgba(201,168,76,.5) !important;
          text-shadow: 0 0 20px rgba(201,168,76,.5);
        }

        /* Privacy toggle */
        .privacy-toggle { display:flex; gap:4px; background:rgba(8,10,20,.8); border-radius:10px; padding:4px; border:1px solid rgba(58,61,84,.8); }
        .privacy-opt {
          flex:1; padding:8px 12px; border-radius:7px; border:none; cursor:pointer;
          font-family:'Rajdhani',sans-serif; font-size:.85rem; font-weight:600;
          letter-spacing:.04em; transition:all .2s ease;
        }
        .privacy-opt--active-private {
          background:rgba(90,60,180,.25); color:#a89fe0;
          box-shadow:0 0 0 1px rgba(90,60,180,.4),0 2px 8px rgba(90,60,180,.15);
        }
        .privacy-opt--active-public {
          background:rgba(201,168,76,.18); color:#c9a84c;
          box-shadow:0 0 0 1px rgba(201,168,76,.4),0 2px 8px rgba(201,168,76,.12);
        }
        .privacy-opt--inactive { background:transparent; color:rgba(197,195,216,.35); }
        .privacy-opt--inactive:hover { color:rgba(197,195,216,.65); background:rgba(255,255,255,.04); }

        /* Lobby game cards */
        .lobby-card {
          display:flex; align-items:center; gap:14px;
          padding:14px 16px; border-radius:12px;
          background:rgba(17,20,35,.8); border:1px solid rgba(58,61,84,.7);
          transition:all .2s ease;
        }
        .lobby-card:hover { border-color:rgba(201,168,76,.3); background:rgba(22,26,44,.9); }
        .lobby-card-icon {
          width:44px; height:44px; border-radius:10px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center; font-size:1.3rem;
          background:rgba(201,168,76,.07); border:1px solid rgba(201,168,76,.18);
        }
        .lobby-slots { display:flex; gap:5px; align-items:center; flex-shrink:0; }
        .lobby-slot {
          width:9px; height:9px; border-radius:50%; transition:all .2s ease;
        }
        .lobby-slot--filled {
          background:#c9a84c;
          box-shadow:0 0 6px rgba(201,168,76,.6);
        }
        .lobby-slot--empty {
          background:rgba(58,61,84,.9);
          border:1px solid rgba(58,61,84,1);
        }
        .lobby-join-btn {
          padding:7px 16px; border-radius:8px; border:1px solid rgba(201,168,76,.35);
          background:rgba(201,168,76,.1); color:#c9a84c;
          font-family:'Cinzel',serif; font-size:.72rem; font-weight:600;
          letter-spacing:.1em; cursor:pointer; white-space:nowrap;
          transition:all .15s ease; flex-shrink:0;
        }
        .lobby-join-btn:hover {
          background:rgba(201,168,76,.2); border-color:rgba(201,168,76,.6);
          box-shadow:0 0 12px rgba(201,168,76,.15);
        }

        /* Saved game items */
        .saved-game-item {
          display:flex; align-items:center; gap:10px; padding:10px 14px;
          border-radius:10px; background:rgba(14,17,30,.7); border:1px solid rgba(58,61,84,.5);
          transition:all .15s ease;
        }
        .saved-game-item:hover { border-color:rgba(90,120,200,.3); }
        .rejoin-btn {
          padding:5px 13px; border-radius:7px;
          border:1px solid rgba(90,120,200,.3); background:rgba(90,120,200,.1);
          color:rgba(140,160,220,.9); font-family:'Rajdhani',sans-serif;
          font-size:.78rem; font-weight:700; letter-spacing:.06em;
          cursor:pointer; white-space:nowrap; transition:all .15s ease; flex-shrink:0;
        }
        .rejoin-btn:hover { background:rgba(90,120,200,.2); border-color:rgba(90,120,200,.55); }
        .dismiss-btn {
          width:22px; height:22px; border-radius:5px; display:flex; align-items:center;
          justify-content:center; border:none; background:transparent;
          color:rgba(197,195,216,.25); cursor:pointer; font-size:.65rem;
          transition:all .15s ease; flex-shrink:0;
        }
        .dismiss-btn:hover { color:rgba(200,60,60,.7); background:rgba(200,60,60,.08); }

        /* Lobby live dot */
        .live-dot {
          width:7px; height:7px; border-radius:50%; background:#4ade80;
          animation:pulse-dot 2s ease-in-out infinite;
          box-shadow:0 0 6px rgba(74,222,128,.6);
          flex-shrink:0;
        }
        .loading-ring {
          width:18px; height:18px; border-radius:50%;
          border:2px solid rgba(201,168,76,.15);
          border-top-color:rgba(201,168,76,.6);
          animation:spin-slow .8s linear infinite;
        }
      `}</style>

      {/* — Background — */}
      <div class="absolute inset-0 pointer-events-none">
        <div class="lp-grid-bg" />
        <div class="lp-glow" style="width:700px;height:700px;background:radial-gradient(circle,rgba(201,168,76,.11) 0%,transparent 65%);animation:glow-breathe 5s ease-in-out infinite;" />
        <div class="lp-glow" style="width:1000px;height:1000px;background:radial-gradient(circle,rgba(90,60,180,.07) 0%,transparent 65%);animation:glow-breathe 7s ease-in-out infinite reverse;animation-delay:-3s;" />
        <div class="absolute inset-0" style="background:radial-gradient(ellipse 80% 80% at center, transparent 40%, rgba(11,14,26,.85) 100%)" />
      </div>

      {/* ══════════════ MAIN SCREEN ══════════════ */}
      <Show when={screen() === "main"}>
        <div class="relative z-10 flex flex-col items-center gap-10 px-6 w-full max-w-[540px] lp-slide-left">

          {/* Title */}
          <div class="text-center lp-emerge">
            <p class="text-gold text-[.72rem] font-bold tracking-[.5em] uppercase opacity-75 mb-2"
               style="color:#c9a84c">TCG Online</p>
            <h1 class="font-cinzel font-bold leading-none tracking-[.06em] m-0"
                style="font-size:clamp(3.5rem,10vw,6rem);color:#e2d9c7;text-shadow:0 0 80px rgba(201,168,76,.25),0 0 20px rgba(201,168,76,.15),0 3px 6px rgba(0,0,0,.9)">
              THE ARENA
            </h1>
            <div class="lp-rule mx-auto my-4" style="height:1px;background:linear-gradient(90deg,transparent,#c9a84c 40%,#c9a84c 60%,transparent)" />
            <p class="text-[.88rem] tracking-[.3em] uppercase opacity-50 m-0"
               style="color:#c5c3d8">Choose your destiny</p>
          </div>

          {/* My Games (saved) */}
          <Show when={myGames().length > 0}>
            <div class="w-full lp-emerge-delay">
              <p class="text-[.68rem] font-bold tracking-[.35em] uppercase mb-3 m-0"
                 style="color:rgba(201,168,76,.6)">My Games</p>
              <div class="flex flex-col gap-2">
                <For each={myGames().slice(0, 4)}>
                  {(game) => (
                    <div class="saved-game-item">
                      <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span class="font-cinzel font-semibold text-sm truncate"
                              style="color:#e2d9c7;letter-spacing:.05em">{game.roomCode}</span>
                        <span class="text-[.73rem] truncate"
                              style="color:rgba(197,195,216,.45)">{game.gameType} · {game.myPlayerName}</span>
                      </div>
                      <span class="text-[.7rem]" style="color:rgba(197,195,216,.3)">
                        {new Date(game.savedAt).toLocaleDateString()}
                      </span>
                      <button
                        class="rejoin-btn"
                        onClick={() => props.onJoinGame(game.roomCode, game.myPlayerName)}
                      >
                        Rejoin
                      </button>
                      <button
                        class="dismiss-btn"
                        onClick={() => removeSavedGame(game.roomCode)}
                        title="Remove from list"
                      >✕</button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Action buttons */}
          <div class="flex flex-col w-full lp-emerge-delay">

            {/* Host */}
            <button
              onClick={openHost}
              class="lp-action group flex items-center gap-5 px-7 py-[1.4rem] text-left w-full cursor-pointer transition-all duration-200
                     rounded-t-xl border-b-0"
              style="background:rgba(22,26,44,.7);border:1px solid rgba(58,61,84,.8);backdrop-filter:blur(8px)"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,.45)"; e.currentTarget.style.background = "rgba(28,33,55,.95)"; e.currentTarget.style.transform = "translateX(4px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.background = "rgba(22,26,44,.7)"; e.currentTarget.style.transform = ""; }}
            >
              <div class="lp-action-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200"
                   style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);filter:drop-shadow(0 0 6px rgba(201,168,76,.2))">
                ⚔
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <span class="font-cinzel font-semibold text-[1.15rem] leading-none"
                      style="color:#e2d9c7">Host a Room</span>
                <span class="text-[.82rem] opacity-55 tracking-[.04em]"
                      style="color:#c5c3d8">Create and invite others</span>
              </div>
              <span class="lp-chevron text-base opacity-0 -translate-x-2 transition-all duration-200"
                    style="color:#c9a84c">›</span>
            </button>

            {/* Divider */}
            <div class="flex items-center h-8 px-7 gap-3 text-[.7rem] tracking-[.25em] uppercase"
                 style="background:rgba(14,17,30,.95);border-left:1px solid rgba(58,61,84,.6);border-right:1px solid rgba(58,61,84,.6);color:rgba(197,195,216,.35)">
              <span class="flex-1 h-px" style="background:rgba(58,61,84,.5)" />
              or
              <span class="flex-1 h-px" style="background:rgba(58,61,84,.5)" />
            </div>

            {/* Join with code */}
            <button
              onClick={openJoin}
              class="lp-action group flex items-center gap-5 px-7 py-[1.4rem] text-left w-full cursor-pointer transition-all duration-200 border-t-0 border-b-0"
              style="background:rgba(22,26,44,.7);border:1px solid rgba(58,61,84,.8);backdrop-filter:blur(8px)"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,.45)"; e.currentTarget.style.background = "rgba(28,33,55,.95)"; e.currentTarget.style.transform = "translateX(4px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.background = "rgba(22,26,44,.7)"; e.currentTarget.style.transform = ""; }}
            >
              <div class="lp-action-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200"
                   style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);filter:drop-shadow(0 0 6px rgba(201,168,76,.2))">
                🔮
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <span class="font-cinzel font-semibold text-[1.15rem] leading-none"
                      style="color:#e2d9c7">Join with Code</span>
                <span class="text-[.82rem] opacity-55 tracking-[.04em]"
                      style="color:#c5c3d8">Enter a private room code</span>
              </div>
              <span class="lp-chevron text-base opacity-0 -translate-x-2 transition-all duration-200"
                    style="color:#c9a84c">›</span>
            </button>

            {/* Divider */}
            <div class="flex items-center h-8 px-7 gap-3 text-[.7rem] tracking-[.25em] uppercase"
                 style="background:rgba(14,17,30,.95);border-left:1px solid rgba(58,61,84,.6);border-right:1px solid rgba(58,61,84,.6);color:rgba(197,195,216,.35)">
              <span class="flex-1 h-px" style="background:rgba(58,61,84,.5)" />
              or
              <span class="flex-1 h-px" style="background:rgba(58,61,84,.5)" />
            </div>

            {/* Browse Lobby */}
            <button
              onClick={openLobby}
              class="lp-action group flex items-center gap-5 px-7 py-[1.4rem] text-left w-full cursor-pointer transition-all duration-200 border-t-0 rounded-b-xl"
              style="background:rgba(22,26,44,.7);border:1px solid rgba(58,61,84,.8);backdrop-filter:blur(8px)"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(90,120,200,.45)"; e.currentTarget.style.background = "rgba(22,26,60,.95)"; e.currentTarget.style.transform = "translateX(4px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.background = "rgba(22,26,44,.7)"; e.currentTarget.style.transform = ""; }}
            >
              <div class="lp-action-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200"
                   style="background:rgba(90,120,200,.08);border:1px solid rgba(90,120,200,.2);filter:drop-shadow(0 0 6px rgba(90,120,200,.2))">
                🌐
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <span class="font-cinzel font-semibold text-[1.15rem] leading-none"
                      style="color:#e2d9c7">Browse Lobby</span>
                <span class="text-[.82rem] opacity-55 tracking-[.04em]"
                      style="color:#c5c3d8">Find public open games</span>
              </div>
              <span class="lp-chevron text-base opacity-0 -translate-x-2 transition-all duration-200"
                    style="color:#c9a84c">›</span>
            </button>

          </div>
        </div>
      </Show>

      {/* ══════════════ LOBBY SCREEN ══════════════ */}
      <Show when={screen() === "lobby"}>
        <div class="relative z-10 flex flex-col gap-0 px-6 w-full max-w-[600px] lp-slide-right"
             style="height:100vh;max-height:100vh;padding-top:env(safe-area-inset-top,0);padding-bottom:env(safe-area-inset-bottom,0)">

          {/* Lobby header */}
          <div class="flex items-center gap-4 py-6 flex-shrink-0">
            <button
              onClick={closeLobby}
              class="w-9 h-9 rounded-xl flex items-center justify-center text-sm cursor-pointer transition-all duration-150 font-cinzel"
              style="background:rgba(14,17,30,.8);border:1px solid rgba(58,61,84,.8);color:rgba(197,195,216,.5)"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; e.currentTarget.style.color = "#c9a84c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.color = "rgba(197,195,216,.5)"; }}
            >
              ‹
            </button>
            <div class="flex-1">
              <h2 class="font-cinzel font-bold text-[1.4rem] m-0 leading-none tracking-[.06em]"
                  style="color:#e2d9c7">LOBBY</h2>
              <p class="text-[.72rem] tracking-[.2em] uppercase m-0 mt-0.5"
                 style="color:rgba(197,195,216,.4)">Open public games</p>
            </div>
            <Show when={lobbyLoading()}>
              <div class="loading-ring" />
            </Show>
            <Show when={!lobbyLoading()}>
              <div class="flex items-center gap-2">
                <div class="live-dot" />
                <span class="text-[.7rem] tracking-[.15em] uppercase font-semibold"
                      style="color:rgba(74,222,128,.7)">Live</span>
              </div>
            </Show>
          </div>

          {/* Scrollable content */}
          <div class="flex-1 overflow-y-auto pb-6" style="scrollbar-width:thin;scrollbar-color:rgba(58,61,84,.8) transparent">

            {/* Available games */}
            <div class="mb-6">
              <p class="text-[.68rem] font-bold tracking-[.35em] uppercase mb-3 m-0"
                 style="color:rgba(201,168,76,.6)">Available Games</p>

              <Show
                when={lobbyGames().filter(g => g.currentPlayers < g.maxPlayers).length > 0}
                fallback={
                  <div class="flex flex-col items-center gap-3 py-10 rounded-xl"
                       style="background:rgba(14,17,30,.5);border:1px dashed rgba(58,61,84,.5)">
                    <span style="font-size:2.5rem;opacity:.3">🏟</span>
                    <p class="text-[.85rem] m-0" style="color:rgba(197,195,216,.35)">
                      No public games right now
                    </p>
                    <p class="text-[.75rem] m-0" style="color:rgba(197,195,216,.25)">
                      Host one to get started!
                    </p>
                  </div>
                }
              >
                <div class="flex flex-col gap-3">
                  <For each={lobbyGames().filter(g => g.currentPlayers < g.maxPlayers)}>
                    {(game) => (
                      <div class="lobby-card">
                        <div class="lobby-card-icon">⚔</div>
                        <div class="flex flex-col gap-1 flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="font-cinzel font-semibold text-sm"
                                  style="color:#e2d9c7;letter-spacing:.04em">{game.gameType}</span>
                          </div>
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[.72rem]" style="color:rgba(197,195,216,.45)">
                              Hosted by <span style="color:rgba(197,195,216,.7)">{game.hostName}</span>
                            </span>
                            <span style="color:rgba(58,61,84,.8);font-size:.6rem">•</span>
                            <span class="text-[.7rem] font-cinzel font-bold tracking-[.08em]"
                                  style="color:rgba(201,168,76,.55)">{game.roomCode}</span>
                          </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                          <div class="lobby-slots">
                            <For each={Array.from({ length: game.maxPlayers }, (_, i) => i)}>
                              {(i) => (
                                <div class={`lobby-slot ${i < game.currentPlayers ? "lobby-slot--filled" : "lobby-slot--empty"}`} />
                              )}
                            </For>
                          </div>
                          <span class="text-[.68rem]" style="color:rgba(197,195,216,.35)">
                            {game.currentPlayers}/{game.maxPlayers}
                          </span>
                        </div>
                        <button
                          class="lobby-join-btn"
                          onClick={() => {
                            closeLobby();
                            const name = playerName().trim() || "Player";
                            props.onJoinGame(game.roomCode, name);
                          }}
                        >
                          Join
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* My Saved Games */}
            <Show when={myGames().length > 0}>
              <div>
                <p class="text-[.68rem] font-bold tracking-[.35em] uppercase mb-3 m-0"
                   style="color:rgba(90,120,200,.6)">My Games</p>
                <div class="flex flex-col gap-2">
                  <For each={myGames()}>
                    {(game) => (
                      <div class="saved-game-item">
                        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="font-cinzel font-semibold text-sm tracking-[.06em]"
                                  style="color:#e2d9c7">{game.roomCode}</span>
                            <span class="text-[.68rem] px-1.5 py-0.5 rounded-md"
                                  style="background:rgba(90,120,200,.12);color:rgba(140,160,220,.7);border:1px solid rgba(90,120,200,.2)">
                              {game.gameType}
                            </span>
                          </div>
                          <span class="text-[.72rem]" style="color:rgba(197,195,216,.4)">
                            {game.myPlayerName} · {new Date(game.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          class="rejoin-btn"
                          onClick={() => {
                            closeLobby();
                            props.onJoinGame(game.roomCode, game.myPlayerName);
                          }}
                        >
                          Rejoin
                        </button>
                        <button
                          class="dismiss-btn"
                          onClick={() => removeSavedGame(game.roomCode)}
                          title="Remove"
                        >✕</button>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>

          {/* Bottom: player name + host quick-launch */}
          <div class="flex-shrink-0 pt-4 pb-6 border-t"
               style="border-color:rgba(58,61,84,.4)">
            <div class="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Your name"
                maxLength={24}
                value={playerName()}
                onInput={(e) => setPlayerName(e.currentTarget.value)}
                class="flex-1 rounded-[9px] px-3 py-2.5 font-rajdhani text-sm outline-none transition-all duration-150"
                style="background:rgba(8,10,20,.8);border:1px solid rgba(58,61,84,.8);color:#e2d9c7;caret-color:#c9a84c"
                onFocus={(e) => (e.currentTarget.style.cssText += ";border-color:#c9a84c;background:rgba(201,168,76,.07)")}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.background = "rgba(8,10,20,.8)"; }}
              />
              <button
                onClick={openHost}
                class="px-5 py-2.5 rounded-[9px] font-cinzel font-bold text-[.78rem] tracking-[.1em] uppercase cursor-pointer text-obsidian border-none flex-shrink-0"
                style="background:linear-gradient(135deg,#c9a84c 0%,#a8873d 100%);box-shadow:0 2px 12px rgba(201,168,76,.25),inset 0 1px 0 rgba(255,255,255,.15);color:#0b0e1a"
              >
                Host Game
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* ══════════════ HOST MODAL ══════════════ */}
      <Show when={showHost()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(7,9,18,.88);backdrop-filter:blur(8px);animation:emerge-up .2s ease-out both"
             onClick={() => setShowHost(false)}>
          <div class="modal-top-accent relative w-full max-w-[460px] rounded-[18px] p-8 lp-panel overflow-y-auto"
               style="background:rgba(17,20,35,.98);border:1px solid rgba(58,61,84,.9);box-shadow:0 30px 90px rgba(0,0,0,.75),0 0 0 1px rgba(201,168,76,.08),inset 0 1px 0 rgba(255,255,255,.04);max-height:90vh"
               onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button onClick={() => setShowHost(false)}
                    class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all duration-150"
                    style="color:rgba(197,195,216,.5);border:1px solid rgba(58,61,84,.8);background:transparent"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,.5)"; e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.background = "rgba(201,168,76,.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.color = "rgba(197,195,216,.5)"; e.currentTarget.style.background = "transparent"; }}>
              ✕
            </button>

            {/* Header */}
            <div class="mb-6">
              <h2 class="font-cinzel font-semibold text-[1.6rem] m-0 mb-1 leading-tight"
                  style="color:#e2d9c7">Host a Room</h2>
              <p class="text-[.85rem] m-0 tracking-[.06em]" style="color:rgba(197,195,216,.5)">Configure your game</p>
            </div>

            {/* Player name */}
            <div class="mb-5">
              <p class="text-[.72rem] font-bold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(201,168,76,.75)">Your Name</p>
              <input
                type="text"
                placeholder="Enter your name"
                maxLength={24}
                value={playerName()}
                onInput={(e) => setPlayerName(e.currentTarget.value)}
                class="w-full rounded-[9px] px-4 py-3 font-rajdhani text-base outline-none transition-all duration-150"
                style="background:rgba(8,10,20,.8);border:1px solid rgba(58,61,84,.8);color:#e2d9c7;caret-color:#c9a84c;box-sizing:border-box"
                onFocus={(e) => (e.currentTarget.style.cssText += ";border-color:#c9a84c;background:rgba(201,168,76,.07);box-shadow:0 0 0 3px rgba(201,168,76,.14)")}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.background = "rgba(8,10,20,.8)"; e.currentTarget.style.boxShadow = ""; }}
              />
            </div>

            {/* Privacy toggle */}
            <div class="mb-5">
              <p class="text-[.72rem] font-bold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(201,168,76,.75)">Visibility</p>
              <div class="privacy-toggle">
                <button
                  class={`privacy-opt ${!isPublicGame() ? "privacy-opt--active-private" : "privacy-opt--inactive"}`}
                  onClick={() => setIsPublicGame(false)}
                >
                  🔒 Private
                </button>
                <button
                  class={`privacy-opt ${isPublicGame() ? "privacy-opt--active-public" : "privacy-opt--inactive"}`}
                  onClick={() => setIsPublicGame(true)}
                >
                  🌐 Public
                </button>
              </div>
              <p class="text-[.73rem] mt-2 m-0" style="color:rgba(197,195,216,.35)">
                {isPublicGame()
                  ? "Visible in the lobby — anyone can join"
                  : "Only joinable with the room code below"}
              </p>
            </div>

            {/* Room code */}
            <div class="rounded-xl p-4 mb-5 text-center"
                 style="background:rgba(8,10,20,.8);border:1px solid rgba(201,168,76,.18)">
              <p class="text-[.68rem] font-bold tracking-[.4em] uppercase opacity-70 mb-3 m-0"
                 style="color:#c9a84c">Room Code</p>
              <div class="flex gap-2 justify-center mb-2">
                <For each={roomCode().split("")}>
                  {(char, i) => (
                    <span class="lp-char-summon font-cinzel font-bold flex items-center justify-center rounded-[9px]"
                          style={`
                            font-size:2rem; width:52px; height:60px; color:#c9a84c;
                            background:rgba(201,168,76,.07); border:1px solid rgba(201,168,76,.25);
                            text-shadow:0 0 24px rgba(201,168,76,.55);
                            animation-delay:${i() * 0.08}s
                          `}>
                      {char}
                    </span>
                  )}
                </For>
              </div>
              <p class="text-[.73rem] m-0" style="color:rgba(197,195,216,.35)">Share this code with friends</p>
            </div>

            {/* Game type */}
            <div class="mb-5">
              <p class="text-[.72rem] font-bold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(201,168,76,.75)">Game Type</p>
              <div class="flex flex-col gap-1">
                <For each={plugins}>
                  {(plugin) => (
                    <button
                      onClick={() => { setSelectedPlugin(plugin.id); setPlayerCount(Math.min(playerCount(), plugin.maxPlayers)); }}
                      class="flex items-center justify-between px-4 py-3 rounded-[9px] text-left cursor-pointer font-rajdhani text-base font-medium transition-all duration-150 border"
                      style={selectedPlugin() === plugin.id
                        ? "border-color:#c9a84c;background:rgba(201,168,76,.1);color:#c9a84c"
                        : "border-color:rgba(58,61,84,.7);background:rgba(24,28,48,.6);color:rgba(197,195,216,.7)"}
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
                <p class="text-[.72rem] font-bold tracking-[.3em] uppercase m-0" style="color:rgba(201,168,76,.75)">Players</p>
                <span class="font-cinzel font-semibold text-base ml-auto" style="color:#e2d9c7">{playerCount()}</span>
              </div>
              <div class="flex items-center gap-3">
                <button
                  disabled={playerCount() <= 1}
                  onClick={() => setPlayerCount(Math.max(1, playerCount() - 1))}
                  class="w-[38px] h-[38px] rounded-lg flex items-center justify-center flex-shrink-0 text-xl cursor-pointer transition-all duration-150 leading-none border disabled:opacity-25 disabled:cursor-not-allowed"
                  style="border-color:rgba(58,61,84,.8);background:rgba(24,28,48,.6);color:rgba(197,195,216,.7)"
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.background = "rgba(201,168,76,.1)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.color = "rgba(197,195,216,.7)"; e.currentTarget.style.background = "rgba(24,28,48,.6)"; }}
                >
                  −
                </button>
                <div class="flex gap-[6px] flex-1">
                  <For each={Array.from({ length: currentPlugin()?.maxPlayers ?? 4 }, (_, i) => i + 1)}>
                    {(n) => (
                      <button
                        onClick={() => setPlayerCount(n)}
                        class="flex-1 h-[7px] rounded p-0 cursor-pointer border-none transition-all duration-150"
                        style={n <= playerCount()
                          ? "background:#c9a84c;box-shadow:0 0 8px rgba(201,168,76,.4)"
                          : "background:rgba(58,61,84,.8)"}
                      />
                    )}
                  </For>
                </div>
                <button
                  disabled={playerCount() >= (currentPlugin()?.maxPlayers ?? 4)}
                  onClick={() => setPlayerCount(Math.min(currentPlugin()?.maxPlayers ?? 4, playerCount() + 1))}
                  class="w-[38px] h-[38px] rounded-lg flex items-center justify-center flex-shrink-0 text-xl cursor-pointer transition-all duration-150 leading-none border disabled:opacity-25 disabled:cursor-not-allowed"
                  style="border-color:rgba(58,61,84,.8);background:rgba(24,28,48,.6);color:rgba(197,195,216,.7)"
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.background = "rgba(201,168,76,.1)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.color = "rgba(197,195,216,.7)"; e.currentTarget.style.background = "rgba(24,28,48,.6)"; }}
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                props.onHostGame(roomCode(), submitName(playerName()), isPublicGame(), selectedPlugin(), playerCount());
                setShowHost(false);
              }}
              class="w-full mt-6 py-4 rounded-xl font-cinzel font-bold text-[.95rem] tracking-[.12em] uppercase cursor-pointer transition-all duration-200 border-none"
              style="background:linear-gradient(135deg,#c9a84c 0%,#a8873d 100%);box-shadow:0 4px 24px rgba(201,168,76,.28),inset 0 1px 0 rgba(255,255,255,.15);color:#0b0e1a"
            >
              Create Room
            </button>
          </div>
        </div>
      </Show>

      {/* ══════════════ JOIN MODAL ══════════════ */}
      <Show when={showJoin()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(7,9,18,.88);backdrop-filter:blur(8px);animation:emerge-up .2s ease-out both"
             onClick={() => setShowJoin(false)}>
          <div class="modal-top-accent relative w-full max-w-[440px] rounded-[18px] p-9 lp-panel"
               style="background:rgba(17,20,35,.98);border:1px solid rgba(58,61,84,.9);box-shadow:0 30px 90px rgba(0,0,0,.75),0 0 0 1px rgba(201,168,76,.08),inset 0 1px 0 rgba(255,255,255,.04)"
               onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button onClick={() => setShowJoin(false)}
                    class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all duration-150"
                    style="color:rgba(197,195,216,.5);border:1px solid rgba(58,61,84,.8);background:transparent"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,.5)"; e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.background = "rgba(201,168,76,.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.color = "rgba(197,195,216,.5)"; e.currentTarget.style.background = "transparent"; }}>
              ✕
            </button>

            {/* Header */}
            <div class="mb-2">
              <h2 class="font-cinzel font-semibold text-[1.6rem] m-0 mb-1 leading-tight"
                  style="color:#e2d9c7">Join a Room</h2>
              <p class="text-[.85rem] m-0 tracking-[.06em]" style="color:rgba(197,195,216,.5)">Enter the four-letter code</p>
            </div>

            {/* Player name */}
            <div class="mt-6 mb-2">
              <p class="text-[.72rem] font-bold tracking-[.3em] uppercase mb-2 m-0" style="color:rgba(201,168,76,.75)">Your Name</p>
              <input
                type="text"
                placeholder="Enter your name"
                maxLength={24}
                value={playerName()}
                onInput={(e) => setPlayerName(e.currentTarget.value)}
                class="w-full rounded-[9px] px-4 py-3 font-rajdhani text-base outline-none transition-all duration-150"
                style="background:rgba(8,10,20,.8);border:1px solid rgba(58,61,84,.8);color:#e2d9c7;caret-color:#c9a84c;box-sizing:border-box"
                onFocus={(e) => (e.currentTarget.style.cssText += ";border-color:#c9a84c;background:rgba(201,168,76,.07);box-shadow:0 0 0 3px rgba(201,168,76,.14)")}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,84,.8)"; e.currentTarget.style.background = "rgba(8,10,20,.8)"; e.currentTarget.style.boxShadow = ""; }}
              />
            </div>

            {/* Code inputs */}
            <div class="flex gap-3 justify-center my-8">
              <For each={[0, 1, 2, 3]}>
                {(i) => (
                  <input
                    id={`jc-${i}`}
                    class="join-char font-cinzel font-bold text-center text-[2.25rem] rounded-[11px] outline-none transition-all duration-150"
                    style={`width:72px;height:84px;background:rgba(8,10,20,.85);border:2px solid rgba(58,61,84,.8);caret-color:transparent;color:#c9a84c;animation:char-summon .4s cubic-bezier(.175,.885,.32,1.275) both;animation-delay:${i * 0.06}s`}
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
              disabled={joinCode().length < 4 || !playerName().trim()}
              onClick={() => { props.onJoinGame(joinCode(), submitName(playerName())); setShowJoin(false); }}
              class="w-full py-4 rounded-xl font-cinzel font-bold text-[.95rem] tracking-[.12em] uppercase transition-all duration-200 border-none disabled:opacity-30 disabled:cursor-not-allowed"
              style="background:linear-gradient(135deg,#c9a84c 0%,#a8873d 100%);box-shadow:0 4px 24px rgba(201,168,76,.28),inset 0 1px 0 rgba(255,255,255,.15);cursor:pointer;color:#0b0e1a"
            >
              Enter Room
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
