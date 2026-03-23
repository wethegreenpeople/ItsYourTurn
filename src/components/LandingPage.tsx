import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { subscribeLobby, unsubscribeLobby, type LobbyEntry } from "../utils/lobby";
import { savedGames, loadSavedGames, removeSavedGame } from "../stores/savedGamesStore";
import { PlayerSettings } from "./PlayerSettings";
import { HostModal } from "./HostModal";
import { JoinModal } from "./JoinModal";

const pluginModules = import.meta.glob("../../plugins/**/info.json", { eager: true });

interface PluginInfo { id: string; name: string; maxPlayers: number; }

const plugins: PluginInfo[] = Object.entries(pluginModules).map(([, mod]: [string, any]) => {
  const data = mod.default ?? mod;
  return { id: data.name, name: data.name ?? "Unknown", maxPlayers: data.maxPlayers ?? 4 };
});

interface LandingPageProps {
  onHostGame: (roomCode: string, playerName: string, isPublic: boolean, gameType: string, maxPlayers: number) => void;
  onJoinGame: (roomCode: string, playerName: string) => void;
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
    subscribeLobby((games) => { setLobbyGames(games); setLobbyLoading(false); });
  };
  const closeLobby = () => {
    setLobbyOpen(false);
    unsubscribeLobby();
    setLobbyGames([]);
  };

  loadSavedGames();
  onCleanup(() => unsubscribeLobby());

  const myGames = createMemo(() => savedGames());
  const availableGames = () => lobbyGames().filter(g => g.currentPlayers < g.maxPlayers);

  const nameInputStyle = "background:rgba(18,18,19,.85);border:1px solid rgba(82,82,91,.7);color:#e8eddf;caret-color:#f5cb5c";
  const onFocus = (e: FocusEvent) => {
    const el = e.currentTarget as HTMLInputElement;
    el.style.cssText += ";border-color:rgba(245,203,92,.6);background:rgba(245,203,92,.05);box-shadow:0 0 0 3px rgba(245,203,92,.12)";
  };
  const onBlur = (e: FocusEvent) => {
    const el = e.currentTarget as HTMLInputElement;
    el.style.borderColor = "rgba(82,82,91,.7)";
    el.style.background = "rgba(18,18,19,.85)";
    el.style.boxShadow = "";
  };

  // ── Shared sub-components ──

  const SavedGamesList = () => (
    <div class="flex flex-col gap-1.5">
      <For each={myGames()}>
        {(game) => (
          <div class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[9px] bg-surface/80 border border-rim/50
                      transition-[border-color] duration-150 hover:border-text-muted/30">
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-cinzel font-semibold text-sm tracking-[.06em] text-text">{game.roomCode}</span>
                <span class="text-[.65rem] px-1.5 py-0.5 rounded bg-rim/35 text-text-muted/60">{game.gameType}</span>
              </div>
              <span class="text-[.7rem] text-text-muted/35">{game.myPlayerName} · {new Date(game.savedAt).toLocaleDateString()}</span>
            </div>
            <button
              class="px-3 py-1 rounded-md border border-text-muted/25 bg-text-muted/7 text-text-muted/80
                     text-[.78rem] font-semibold tracking-wide cursor-pointer whitespace-nowrap flex-shrink-0
                     transition-colors duration-150 hover:bg-text-muted/14 hover:border-text-muted/45 hover:text-text"
              onClick={() => props.onJoinGame(game.roomCode, game.myPlayerName)}
            >Rejoin</button>
            <button
              class="w-[22px] h-[22px] rounded flex items-center justify-center border-none bg-transparent
                     text-text-muted/20 cursor-pointer text-[.65rem] flex-shrink-0
                     transition-colors duration-150 hover:text-danger/65 hover:bg-danger/8"
              onClick={() => removeSavedGame(game.roomCode)} title="Remove"
            >✕</button>
          </div>
        )}
      </For>
    </div>
  );

  const LobbyList = () => (
    <div class="flex flex-col gap-2.5">
      <Show
        when={availableGames().length > 0}
        fallback={
          <div class="flex flex-col items-center gap-3 py-10 rounded-xl bg-surface/70 border border-dashed border-rim/50">
            <span class="text-[2rem] opacity-20">🏟</span>
            <p class="text-[.82rem] m-0 text-text-muted/30">No public games right now</p>
            <p class="text-[.72rem] m-0 text-text-muted/20">Host one to get started!</p>
          </div>
        }
      >
        <For each={availableGames()}>
          {(game) => (
            <div class="flex items-center gap-3.5 px-4 py-3.5 rounded-[10px] bg-surface/90 border border-rim/60
                        transition-[border-color] duration-150 hover:border-text-muted/30">
              <div class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-[1.1rem]
                          bg-white/4 border border-rim/50">⚔</div>
              <div class="flex flex-col gap-1 flex-1 min-w-0">
                <span class="font-cinzel font-semibold text-sm text-text tracking-wide">{game.gameType}</span>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[.72rem] text-text-muted/40">
                    Hosted by <span class="text-text-muted/65">{game.hostName}</span>
                  </span>
                  <span class="text-rim/80 text-[.55rem]">•</span>
                  <span class="text-[.7rem] font-cinzel font-bold tracking-wider text-gold/60">{game.roomCode}</span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2">
                <div class="flex gap-1 items-center flex-shrink-0">
                  <For each={Array.from({ length: game.maxPlayers }, (_, i) => i)}>
                    {(i) => (
                      <div
                        class="w-2 h-2 rounded-full transition-[background,box-shadow] duration-200"
                        classList={{
                          "bg-gold shadow-[0_0_5px_rgba(245,203,92,.4)]": i < game.currentPlayers,
                          "bg-rim/70": i >= game.currentPlayers,
                        }}
                      />
                    )}
                  </For>
                </div>
                <span class="text-[.65rem] text-text-muted/30">{game.currentPlayers}/{game.maxPlayers}</span>
              </div>
              <button
                class="px-3.5 py-1.5 rounded-[7px] border border-gold/40 bg-gold/10 text-gold
                       font-cinzel text-[.72rem] font-semibold tracking-wider cursor-pointer whitespace-nowrap flex-shrink-0
                       transition-colors duration-150 hover:bg-gold/18 hover:border-gold/65 hover:shadow-[0_2px_12px_rgba(245,203,92,.12)]"
                onClick={() => { closeLobby(); props.onJoinGame(game.roomCode, playerName().trim() || "Player"); }}
              >Join</button>
            </div>
          )}
        </For>
      </Show>
    </div>
  );

  const LiveIndicator = () => (
    <>
      <Show when={lobbyLoading()}>
        <div class="w-4 h-4 rounded-full border-2 border-rim/40 border-t-text-muted/50 animate-[lp-spin_.75s_linear_infinite]" />
      </Show>
      <Show when={!lobbyLoading()}>
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-[#4ade80] shadow-[0_0_5px_rgba(74,222,128,.5)] flex-shrink-0
                      animate-[lp-pulse-dot_2s_ease-in-out_infinite]" />
          <span class="text-[.68rem] tracking-[.15em] uppercase font-semibold text-[rgba(74,222,128,.65)]">Live</span>
        </div>
      </Show>
    </>
  );

  const BackButton = (p: { onClick: () => void }) => (
    <button onClick={p.onClick}
      class="w-9 h-9 rounded-lg flex items-center justify-center text-sm cursor-pointer font-cinzel
             bg-surface/90 border border-rim/60 text-text-muted/50
             transition-colors duration-150 hover:border-text-muted/40 hover:text-text">‹</button>
  );

  const GoldCta = (p: { onClick: () => void; children: any }) => (
    <button onClick={p.onClick}
      class="px-5 py-2.5 rounded-[9px] font-cinzel font-bold text-[.78rem] tracking-[.1em] uppercase cursor-pointer border-none flex-shrink-0"
      style="background:linear-gradient(135deg,#f5cb5c 0%,#c9a034 100%);box-shadow:0 2px 14px rgba(245,203,92,.2),inset 0 1px 0 rgba(255,255,255,.15);color:#1a1c19">
      {p.children}
    </button>
  );

  const LobbyHeader = () => (
    <div class="flex items-center gap-4 px-6 lg:px-8 py-5 border-b border-rim/40 flex-shrink-0">
      <BackButton onClick={closeLobby} />
      <div class="flex-1">
        <h2 class="font-cinzel font-bold text-[1.3rem] m-0 leading-none tracking-[.06em] text-text">LOBBY</h2>
        <p class="text-[.7rem] tracking-[.18em] uppercase m-0 mt-0.5 text-text-muted/35">Open public games</p>
      </div>
      <LiveIndicator />
    </div>
  );

  const LobbyFooter = () => (
    <div class="flex-shrink-0 px-6 lg:px-8 pt-4 pb-6 border-t border-rim/40">
      <div class="flex gap-3 items-center">
        <input type="text" placeholder="Your name" maxLength={24}
          value={playerName()} onInput={(e) => setPlayerName(e.currentTarget.value)}
          class="flex-1 rounded-[9px] px-3 py-2.5 text-sm outline-none transition-all duration-150"
          style={nameInputStyle} onFocus={onFocus as any} onBlur={onBlur as any}
        />
        <GoldCta onClick={() => setShowHost(true)}>Host Game</GoldCta>
      </div>
    </div>
  );

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
          <LobbyHeader />
          <div class="flex-1 overflow-y-auto px-6 py-5" style="scrollbar-width:thin;scrollbar-color:rgba(82,82,91,.5) transparent">
            <LobbyList />
            <Show when={myGames().length > 0}>
              <div class="mt-6">
                <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-3 m-0 text-text-muted/40">My Games</p>
                <SavedGamesList />
              </div>
            </Show>
          </div>
          <LobbyFooter />
        </div>
      </Show>

      {/* ── Two-column layout ── */}
      <div class="relative z-10 flex w-full h-full">

        {/* Left panel */}
        <div class="flex flex-col items-center justify-center gap-9 px-6 py-10 w-full flex-shrink-0 lg:w-[420px] lg:border-r border-rim/35">

          {/* Title */}
          <div class="text-center animate-[lp-emerge-up_.8s_cubic-bezier(.22,1,.36,1)_both]">
            <p class="text-[.68rem] font-semibold tracking-[.5em] uppercase m-0 mb-2 text-text-muted/40">TCG Online</p>
            <h1 class="font-cinzel font-bold leading-none tracking-[.05em] m-0 text-text"
                style="font-size:clamp(3rem,9vw,5.5rem)">THE ARENA</h1>
            <div class="mx-auto my-3.5 animate-[lp-rule-expand_.9s_ease-out_.4s_both]"
                 style="height:1px;background:linear-gradient(90deg,transparent,rgba(245,203,92,.45) 40%,rgba(245,203,92,.45) 60%,transparent)" />
            <p class="text-[.82rem] tracking-[.25em] uppercase m-0 text-text-muted/30">Choose your destiny</p>
          </div>

          {/* Saved games — mobile only */}
          <Show when={myGames().length > 0}>
            <div class="w-full lg:hidden animate-[lp-emerge-up_.8s_cubic-bezier(.22,1,.36,1)_.1s_both]">
              <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-2.5 m-0 text-text-muted/40">My Games</p>
              <SavedGamesList />
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

            <div class="flex items-center h-7 px-6 gap-3 text-[.65rem] tracking-[.2em] uppercase font-semibold
                        bg-base/80 border-x border-rim/50 text-gold/40">
              <span class="flex-1 h-px bg-gold/15" />or<span class="flex-1 h-px bg-gold/15" />
            </div>

            <button onClick={openLobby}
              class="lp-action group flex items-center gap-5 px-6 py-5 text-left w-full cursor-pointer border-t-0 rounded-b-xl
                     bg-surface/90 border border-rim/60">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 bg-white/4 border border-rim/50">🌐</div>
              <div class="flex flex-col gap-0.5 flex-1">
                <span class="font-cinzel font-semibold text-[1.05rem] leading-snug text-text">Browse Lobby</span>
                <span class="text-[.8rem] text-text-muted/40">Find public open games</span>
              </div>
              <span class="lp-chevron text-lg opacity-0 -translate-x-2 transition-all duration-200 text-text-muted/50">›</span>
            </button>

          </div>
        </div>

        {/* Right panel — desktop only */}
        <div class="hidden lg:flex flex-col flex-1 overflow-hidden">

          <Show when={!lobbyOpen()}>
            <div class="flex flex-col h-full px-10 py-10 overflow-y-auto" style="scrollbar-width:thin;scrollbar-color:rgba(82,82,91,.4) transparent">
              <Show
                when={myGames().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                    <span class="font-cinzel text-[3rem] text-text-muted/30">⚔</span>
                    <p class="font-cinzel text-[.85rem] tracking-[.2em] uppercase m-0 text-text-muted/50">No saved games yet</p>
                    <p class="text-[.78rem] m-0 text-center text-text-muted/35">Host or join a game to get started</p>
                  </div>
                }
              >
                <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-4 m-0 text-text-muted/40">My Games</p>
                <SavedGamesList />
              </Show>
            </div>
          </Show>

          <Show when={lobbyOpen()}>
            <div class="flex flex-col h-full animate-[lp-slide-right_.32s_cubic-bezier(.22,1,.36,1)_both]">
              <LobbyHeader />
              <div class="flex-1 overflow-y-auto px-8 py-6" style="scrollbar-width:thin;scrollbar-color:rgba(82,82,91,.4) transparent">
                <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-3 m-0 text-text-muted/40">Available Games</p>
                <LobbyList />
                <Show when={myGames().length > 0}>
                  <div class="mt-8">
                    <p class="text-[.65rem] font-semibold tracking-[.35em] uppercase mb-3 m-0 text-text-muted/40">My Games</p>
                    <SavedGamesList />
                  </div>
                </Show>
              </div>
              <LobbyFooter />
            </div>
          </Show>

        </div>
      </div>

      {/* Gear */}
      <button onClick={() => setShowSettings(true)} title="Settings"
        class="absolute top-4 right-4 z-30 w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-base cursor-pointer
               bg-surface/90 border border-rim/60 text-text-muted/40
               transition-colors duration-150 hover:border-text-muted/40 hover:text-text-muted/80">⚙</button>

      {/* Modals */}
      <Show when={showHost()}>
        <HostModal
          plugins={plugins}
          playerName={playerName()}
          onPlayerNameChange={(n) => { setPlayerName(n); submitName(n); }}
          onConfirm={(code, isPublic, pluginId, count) =>
            props.onHostGame(code, submitName(playerName()), isPublic, pluginId, count)
          }
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
    </div>
  );
}
