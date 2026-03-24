import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { type LobbyEntry } from "../../utils/lobby";
import { savedGames, loadSavedGames, removeSavedGame } from "../../stores/savedGamesStore";
import { PlayerSettings } from "../../components/PlayerSettings";
import { HostModal } from "../../components/HostModal";
import { JoinModal } from "../../components/JoinModal";
import { LobbyHeader } from "./components/LobbyHeader";
import { SavedGamesList } from "./components/SavedGames";
import { LobbyList } from "./components/LobbyList";
import { supabase } from "../../utils/supabase";


const pluginModules = import.meta.glob("/plugins/**/info.json", { eager: true });

interface PluginInfo { id: string; name: string; maxPlayers: number; }

const plugins: PluginInfo[] = Object.entries(pluginModules).map(([, mod]: [string, any]) => {
  const data = mod.default ?? mod;
  return { id: data.name, name: data.name ?? "Unknown", maxPlayers: data.maxPlayers ?? 4 };
});

interface LandingPageProps {
  onHostGame: (roomCode: string, playerName: string, isPublic: boolean, gameType: string, maxPlayers: number) => void;
  onJoinGame: (roomCode: string, playerName: string) => void;
  isConnecting?: boolean;
  connectingMessage?: string;
  connectingCode?: string;
}

function submitName(name: string): string {
  const trimmed = name.trim();
  if (trimmed) localStorage.setItem("tcg-player-name", trimmed);
  return trimmed || "Player";
}

export function LandingPage(props: LandingPageProps) {
  const [showHost, setShowHost] = createSignal(false);
  const [showJoin, setShowJoin] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [playerName, setPlayerName] = createSignal(localStorage.getItem("tcg-player-name") ?? "");

  const [lobbyOpen, setLobbyOpen] = createSignal(false);
  const [lobbyGames, setLobbyGames] = createSignal<LobbyEntry[]>([]);
  const [lobbyLoading, setLobbyLoading] = createSignal(false);

  const openLobby = () => {
    setLobbyOpen(true);
    setLobbyLoading(true);
  };
  const closeLobby = () => {
    setLobbyOpen(false);
    setLobbyGames([]);
  };

  const myGames = createMemo(() => savedGames());
  const myGameCodes = createMemo(() => new Set(savedGames().map(g => g.roomCode)));
  const availableGames = () => lobbyGames().filter(g => g.currentPlayers < g.maxPlayers && !myGameCodes().has(g.roomCode));

  onMount(async () => {
    // Load saved games from local storage, then validate against DB and prune inactive rooms.
    await loadSavedGames();
    const codes = savedGames().map(g => g.roomCode);
    if (codes.length > 0) {
      const { data: activeRooms, error } = await supabase.from("room").select("join_code").in("join_code", codes).eq("active", true);
      if (!error && activeRooms) {
        const activeCodes = new Set(activeRooms.map(r => r.join_code));
        for (const code of codes) {
          if (!activeCodes.has(code)) await removeSavedGame(code);
        }
      }
    }

    await supabase.from("room").select("*").eq("public", true).eq("active", true).then(({ data }) => {
      setLobbyGames((data ?? []).map(r => ({
        userId: r.id,
        roomCode: r.join_code,
        gameType: r.plugin,
        hostName: r.host_name ?? "",
        currentPlayers: r.active_players,
        maxPlayers: r.allowed_players,
        createdAt: new Date(r.created_at).getTime(),
      })));
      setLobbyLoading(false);
    });
  });

  return (
    <div class="fixed inset-0 overflow-hidden bg-base font-body">

      {/* Animated grid background */}
      <div class="absolute inset-0 pointer-events-none">
        <div class="lp-grid-bg" />
      </div>

      {/* ── Mobile: full-screen lobby overlay ── */}
      <Show when={lobbyOpen()}>
        <div class="lg:hidden fixed inset-0 z-20 flex flex-col bg-base animate-[lp-slide-right_.32s_cubic-bezier(.22,1,.36,1)_both]"
             style="padding-top:env(safe-area-inset-top,0);padding-bottom:env(safe-area-inset-bottom,0)">
          <div class="flex items-center gap-3 px-6 pt-5 pb-1 flex-shrink-0">
            <button
              class="flex items-center gap-1.5 text-text-muted/50 hover:text-text-muted transition-colors duration-150 cursor-pointer bg-transparent border-none p-0 text-[.8rem]"
              onClick={closeLobby}
            >
              ← Back
            </button>
          </div>
          <LobbyHeader />
          <div class="flex-1 overflow-y-auto px-6 py-5" style="scrollbar-width:thin;scrollbar-color:rgba(82,82,91,.5) transparent">
            <LobbyList availableGames={availableGames()} closeLobby={closeLobby} joinGame={props.onJoinGame} playerName={playerName()} />
            <Show when={myGames().length > 0}>
              <div class="mt-6">
                <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-3 m-0 text-text-muted/40">My Games</p>
                <SavedGamesList savedGames={myGames()} onJoinGame={props.onJoinGame} removeSavedGame={removeSavedGame} />
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* ── Two-column layout ── */}
      <div class="relative z-10 flex w-full h-full">

        {/* Left panel */}
        <div class="flex flex-col items-center justify-center gap-9 px-6 py-10 w-full flex-shrink-0 lg:w-[420px] lg:border-r border-rim/35">

          {/* Title */}
          <div class="text-center animate-[lp-emerge-up_.8s_cubic-bezier(.22,1,.36,1)_both]">
            <h1 class="font-cinzel font-bold leading-none m-0">
              <span class="block tracking-[.18em] text-text/60"
                    style="font-size:clamp(1.1rem,3.2vw,1.7rem)">IT'S YOUR</span>
              <span class="block tracking-[.04em]"
                    style="font-size:clamp(3.5rem,10vw,6.5rem);background:linear-gradient(135deg,#f5cb5c 0%,#d4922a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">TURN</span>
            </h1>
            <div class="mx-auto my-3.5 animate-[lp-rule-expand_.9s_ease-out_.4s_both]"
                 style="height:1px;background:linear-gradient(90deg,transparent,rgba(245,203,92,.45) 40%,rgba(245,203,92,.45) 60%,transparent)" />
            <p class="text-[.72rem] tracking-[.3em] uppercase m-0 text-text-muted/30">itsyourturn.gg</p>
          </div>

          {/* Saved games — mobile only */}
          <Show when={myGames().length > 0}>
            <div class="w-full lg:hidden animate-[lp-emerge-up_.8s_cubic-bezier(.22,1,.36,1)_.1s_both]">
              <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-2.5 m-0 text-text-muted/40">My Games</p>
              <SavedGamesList savedGames={myGames()} onJoinGame={props.onJoinGame} removeSavedGame={removeSavedGame} />
            </div>
          </Show>

          {/* Action list */}
          <div class="flex flex-col w-full animate-[lp-emerge-up_.8s_cubic-bezier(.22,1,.36,1)_.2s_both]">

            <button onClick={() => setShowHost(true)}
              class="lp-action group flex items-center gap-5 px-6 py-5 text-left w-full cursor-pointer rounded-t-xl border-b-0
                     bg-surface/90 border border-rim/60">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 bg-white/4 border border-rim/50">⚔</div>
              <div class="flex flex-col gap-0.5 flex-1">
                <span class="font-cinzel font-semibold text-[1.05rem] leading-snug text-text">Host a Room</span>
                <span class="text-[.8rem] text-text-muted/40">Create and invite others</span>
              </div>
              <span class="lp-chevron text-lg opacity-0 -translate-x-2 transition-all duration-200 text-text-muted/50">›</span>
            </button>

            <div class="flex items-center h-7 px-6 gap-3 text-[.65rem] tracking-[.2em] uppercase font-semibold
                        bg-base/80 border-x border-rim/50 text-gold/40">
              <span class="flex-1 h-px bg-gold/15" />or<span class="flex-1 h-px bg-gold/15" />
            </div>

            <button onClick={() => setShowJoin(true)}
              class="lp-action group flex items-center gap-5 px-6 py-5 text-left w-full cursor-pointer border-t-0 border-b-0
                     bg-surface/90 border border-rim/60">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 bg-white/4 border border-rim/50">🔮</div>
              <div class="flex flex-col gap-0.5 flex-1">
                <span class="font-cinzel font-semibold text-[1.05rem] leading-snug text-text">Join with Code</span>
                <span class="text-[.8rem] text-text-muted/40">Enter a private room code</span>
              </div>
              <span class="lp-chevron text-lg opacity-0 -translate-x-2 transition-all duration-200 text-text-muted/50">›</span>
            </button>

            <div class="rounded-b-xl border border-rim/60">
            </div>

            <div class="lg:hidden flex items-center h-7 px-6 gap-3 text-[.65rem] tracking-[.2em] uppercase font-semibold
                        bg-base/80 border-x border-rim/50 text-gold/40">
              <span class="flex-1 h-px bg-gold/15" />or<span class="flex-1 h-px bg-gold/15" />
            </div>

            <button onClick={openLobby}
              class="lg:hidden lp-action group flex items-center gap-5 px-6 py-5 text-left w-full cursor-pointer border-t-0 rounded-b-xl
                     bg-surface/90 border border-rim/60">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 bg-white/4 border border-rim/50">🌐</div>
              <div class="flex flex-col gap-0.5 flex-1">
                <span class="font-cinzel font-semibold text-[1.05rem] leading-snug text-text">Browse Lobby</span>
                <span class="text-[.8rem] text-text-muted/40">Find public open games</span>
              </div>
              <span class="lp-chevron text-lg opacity-0 -translate-x-2 transition-all duration-200 text-text-muted/50">›</span>
            </button>

          </div>

          <button onClick={() => setShowSettings(true)}
            class="lp-action group flex items-center gap-5 px-6 py-5 text-left w-full cursor-pointer rounded-t-xl rounded-b-xl border-b-0
                   bg-surface/90 border border-rim/60">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 bg-white/4 border border-rim/50">⚙</div>
            <div class="flex flex-col gap-0.5 flex-1">
              <span class="font-cinzel font-semibold text-[1.05rem] leading-snug text-text">Settings</span>
            </div>
          </button>
        </div>

        {/* Right panel — desktop only */}
        <div class="hidden lg:flex flex-col flex-1 overflow-hidden">
          <div class="flex flex-col h-full animate-[lp-slide-right_.32s_cubic-bezier(.22,1,.36,1)_both]">
            <LobbyHeader />
            <div class="flex-1 overflow-y-auto px-8 py-6" style="scrollbar-width:thin;scrollbar-color:rgba(82,82,91,.4) transparent">
              <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-3 m-0 text-text-muted/40">Available Games</p>
              <LobbyList availableGames={availableGames()} closeLobby={closeLobby} joinGame={props.onJoinGame} playerName={playerName()} />
              <Show when={myGames().length > 0}>
                <div class="mt-8">
                  <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-3 m-0 text-text-muted/40">My Games</p>
                  <SavedGamesList savedGames={myGames()} onJoinGame={props.onJoinGame} removeSavedGame={removeSavedGame} />
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Show when={showHost()}>
        <HostModal
          plugins={plugins}
          playerName={playerName()}
          onPlayerNameChange={(n) => { setPlayerName(n); submitName(n); }}
          onConfirm={(code, isPublic, pluginId, count) => {
            props.onHostGame(code, submitName(playerName()), isPublic, pluginId, count);
          }}
          onClose={() => setShowHost(false)}
        />
      </Show>

      <Show when={showJoin()}>
        <JoinModal
          playerName={playerName()}
          onPlayerNameChange={(n) => { setPlayerName(n); submitName(n); }}
          onConfirm={(code) => props.onJoinGame(code, submitName(playerName()))}
          onClose={() => setShowJoin(false)}
        />
      </Show>

      <Show when={showSettings()}>
        <PlayerSettings onClose={() => setShowSettings(false)} />
      </Show>

      {/* Connecting overlay */}
      <Show when={props.isConnecting}>
        <div class="fixed inset-0 z-50 flex flex-col items-center justify-center" style="background:rgba(24,24,27,.92);backdrop-filter:blur(10px);animation:lp-overlay-fade .25s ease both">
          <p class="font-cinzel text-[.75rem] tracking-[.3em] uppercase mt-7 mb-0 text-text/50 m-0">{props.connectingMessage ?? "Connecting"}</p>
          <Show when={props.connectingCode}>
            <p class="font-cinzel font-bold tracking-[.35em] mt-2 mb-0 m-0" style="font-size:2rem;background:linear-gradient(135deg,#f5cb5c 0%,#d4922a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">{props.connectingCode}</p>
          </Show>
          <div class="flex gap-2 mt-6">
            <For each={[0, 1, 2]}>{(i) => (
              <div class="w-1.5 h-1.5 rounded-full bg-gold/50" style={`animation:lp-pulse-dot .9s ease-in-out ${i * 0.22}s infinite`} />
            )}</For>
          </div>
        </div>
      </Show>
    </div>
  );
}
