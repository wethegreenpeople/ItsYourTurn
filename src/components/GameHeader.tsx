import { createSignal, For, Show } from "solid-js";
import {
  gameState,
  adjustScore,
  endTurn,
  toggleMessaging,
  myUserId,
  type Player,
} from "../stores/gameStore";
import { freePlaceMode, setFreePlaceMode } from "../stores/freePlaceStore";
import { setShowSettingsModal } from "../stores/settingsStore";
import { LoadDeckModal } from "./LoadDeckModal";
import { cardsInDeck } from "../stores/deckStore";
import { openDeckSearch } from "../stores/deckContextMenuStore";
import { MessagingPanel } from "./MessagingPanel";
import { LeaveSection } from "./LeaveSection";

// ── Shared gamebar button classes ──
const iconBtn = "flex items-center justify-center flex-shrink-0 rounded cursor-pointer transition-colors duration-150";
const gbarBase = "flex items-center gap-2 w-full px-3 py-2 rounded bg-surface/85 border border-raised text-text-muted cursor-pointer transition-colors duration-150";
const gbarBtn  = `${gbarBase} hover:border-gold/35 hover:text-gold`;
const gbarIcon = "text-sm leading-none flex-shrink-0 w-[1.1rem] text-center";
const gbarLabel = "flex-1 text-center text-[clamp(9px,.8vw,12px)] font-bold tracking-widest uppercase";

const PlayerPanel = (props: { player: Player }) => {
  const isLocal = () => props.player.id === myUserId;
  const isTurn = () => props.player.id === gameState.currentTurnPlayerId;

  return (
    <div
      class="player-panel flex flex-col gap-0.5 px-1.5 pt-1 pb-1.5 bg-surface/85 border border-raised rounded-md flex-1 min-w-[80px] transition-[border-color,box-shadow] duration-[250ms] ease-in-out lg:w-auto lg:px-3 lg:py-2.5 lg:gap-2 lg:flex-none"
      classList={{
        "player-panel--local": isLocal(),
        "player-panel--active": isTurn(),
      }}
      data-player-id={props.player.id}
    >
      <div class="flex items-center gap-1 min-w-0 lg:gap-1.5">
        <span
          class="font-cinzel text-[9px] font-semibold text-text whitespace-nowrap overflow-hidden text-ellipsis tracking-[0.04em] leading-[1.2] lg:text-[clamp(11px,0.9vw,14px)] lg:max-w-none"
          style={{ "font-family": "var(--plugin-font-display, 'Cinzel', Georgia, serif)", color: "var(--plugin-text, #e8eddf)" }}
        >
          {props.player.name}
        </span>
        <Show when={isTurn()}>
          <span class="turn-badge hidden lg:inline font-body text-[clamp(7px,0.6vw,9px)] font-bold tracking-[0.14em] uppercase text-gold bg-gold/12 border border-gold/40 rounded-[3px] px-1 py-px whitespace-nowrap" style={{ animation: "turn-pulse 2.5s ease-in-out infinite" }}>YOUR TURN</span>
        </Show>
      </div>
      <div class="flex flex-col gap-[3px] lg:flex-row lg:items-center lg:gap-1.5">
        <div class="flex items-baseline justify-center gap-1 lg:order-1 lg:gap-1.5">
          <span class="score-label hidden lg:inline font-body text-[clamp(8px,0.65vw,10px)] font-semibold tracking-[0.12em] uppercase text-text-muted flex-shrink-0">{gameState.scoreLabel}</span>
          <span
            class="font-cinzel text-[16px] font-bold text-gold min-w-[22px] text-center tracking-[0.02em] leading-none lg:text-[clamp(16px,1.4vw,22px)] lg:min-w-[32px] lg:flex-none"
            style={{ "font-family": "var(--plugin-font-display, 'Cinzel', Georgia, serif)", color: "var(--plugin-accent, #f5cb5c)" }}
          >
            {props.player.score}
          </span>
        </div>
        <div class="flex gap-1.5 justify-center lg:order-2 lg:gap-1 lg:flex-none">
          <button
            class="score-btn w-[30px] h-[30px] flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/30 rounded-[5px] text-gold text-lg leading-none cursor-pointer transition-[background] duration-150 p-0 select-none lg:min-h-7 lg:min-w-7 lg:flex-none lg:text-base lg:rounded"
            onClick={() => adjustScore(props.player.id, -1)}
            aria-label="Decrease score"
          >−</button>
          <button
            class="score-btn w-[30px] h-[30px] flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/30 rounded-[5px] text-gold text-lg leading-none cursor-pointer transition-[background] duration-150 p-0 select-none lg:min-h-7 lg:min-w-7 lg:flex-none lg:text-base lg:rounded"
            onClick={() => adjustScore(props.player.id, 1)}
            aria-label="Increase score"
          >+</button>
        </div>
      </div>
    </div>
  );
};

export const GameHeader = (props: {
  onReturnToMenu?: () => void;
  onQuitGame?: () => void;
}) => {
  const isMyTurn = () => gameState.currentTurnPlayerId === myUserId;
  const [menuOpen, setMenuOpen] = createSignal(false);
  const closeMenu = () => setMenuOpen(false);
  const sideboardCount = () => cardsInDeck(`${myUserId}:sideboard`).length;

  const EndTurnBtn = (p: { class?: string }) => (
    <button
      class={`end-turn-btn flex items-center gap-2 w-full px-3 py-2 rounded bg-gold/10 border border-gold/40 text-gold cursor-pointer transition-colors duration-150 hover:bg-gold/18 hover:border-gold/60 ${p.class ?? ""}`}
      style={isMyTurn() ? { animation: "end-turn-glow 2s ease-in-out infinite" } : undefined}
      onClick={endTurn}
    >
      <span class={gbarIcon}>▷</span>
      <span class={gbarLabel}>End Turn</span>
    </button>
  );

  const MsgToggleBtn = (p: { class?: string; showLabel?: boolean }) => (
    <Show
      when={p.showLabel}
      fallback={
        <button
          class={`${iconBtn} border border-raised bg-surface/85 text-text-muted text-[13px] p-0 hover:border-gold/35 hover:text-gold ${p.class ?? ""}`}
          classList={{ "!border-gold/45 !text-gold !bg-surface/90": gameState.showMessaging }}
          onClick={toggleMessaging}
          aria-label="Toggle chat"
        >✉</button>
      }
    >
      <button
        class={`${gbarBtn} ${p.class ?? ""}`}
        classList={{ "!border-gold/45 !text-gold !bg-gold/8": gameState.showMessaging }}
        onClick={toggleMessaging}
        aria-label="Toggle chat"
      >
        <span class={gbarIcon}>✉</span>
        <span class={gbarLabel}>Chat</span>
      </button>
    </Show>
  );

  const FreePlaceBtn = (p: { onClick?: () => void; showLabel?: boolean }) => (
    <button
      class={gbarBtn}
      classList={{ "!border-gold/45 !text-gold !bg-gold/8": freePlaceMode() }}
      onClick={p.onClick ?? (() => setFreePlaceMode(v => !v))}
      title={freePlaceMode() ? "Switch to snap layout" : "Switch to free placement"}
    >
      <span class={gbarIcon}>{freePlaceMode() ? "⊠" : "⊞"}</span>
      <Show when={p.showLabel}>
        <span class={gbarLabel}>{freePlaceMode() ? "Snap" : "Free"}</span>
      </Show>
    </button>
  );

  const SettingsBtn = (p: { onClick?: () => void; showLabel?: boolean }) => (
    <button
      class={gbarBtn}
      onClick={p.onClick ?? (() => setShowSettingsModal(true))}
      title="Settings"
    >
      <span class={gbarIcon}>⚙</span>
      <Show when={p.showLabel}>
        <span class={gbarLabel}>Settings</span>
      </Show>
    </button>
  );

  const SideboardBtn = (p: { onClick?: () => void; showLabel?: boolean }) => (
    <Show when={sideboardCount() > 0}>
      <button
        class={gbarBtn}
        onClick={p.onClick ?? (() => openDeckSearch(`${myUserId}:sideboard`, "Sideboard"))}
        title="View sideboard"
      >
        <span class={gbarIcon}>⧉</span>
        <Show when={p.showLabel}>
          <span class={gbarLabel}>Sideboard ({sideboardCount()})</span>
        </Show>
      </button>
    </Show>
  );

  return (
    <aside
      class="game-sidebar flex flex-col border-b border-raised flex-shrink-0 relative z-10 lg:items-stretch lg:justify-start lg:w-[240px] lg:min-w-[240px] lg:h-full lg:min-h-0 lg:border-b-0 lg:border-r lg:border-[#333533] lg:p-0 lg:gap-0 lg:overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1a1c19 0%, #171916 100%)" }}
    >
      <div class="flex flex-col gap-[5px] px-2 py-[5px] lg:flex-col lg:flex-shrink-0 lg:overflow-y-auto lg:px-3 lg:pt-4 lg:pb-3 lg:gap-0">
        {/* Player panels */}
        <div class="sidebar-players flex flex-row gap-[5px] min-w-0 overflow-x-auto overflow-y-visible lg:flex-col lg:gap-2.5 lg:flex-shrink-0 lg:overflow-x-visible lg:overflow-y-visible" style={{ "scrollbar-width": "none", "-webkit-overflow-scrolling": "touch" }}>
          <For each={gameState.players}>
            {(player) => <PlayerPanel player={player} />}
          </For>
        </div>

        {/* Mobile quickbar */}
        <div class="flex flex-row items-center gap-[5px] lg:hidden">
          <EndTurnBtn class="flex-1 justify-center" />
          <MsgToggleBtn class="w-7 h-7" />
          <button
            class={`${iconBtn} w-8 h-8 bg-surface/85 border border-raised text-text-muted text-base
                    hover:border-gold/45 hover:text-gold`}
            classList={{ "!border-gold/45 !text-gold": menuOpen() }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="More options"
          >☰</button>
        </div>

        {/* Desktop actions */}
        <div class="hidden lg:flex lg:flex-col lg:items-stretch lg:gap-2 lg:pt-4 lg:border-t lg:border-raised lg:mt-4 lg:flex-shrink-0">
          <EndTurnBtn />
          <FreePlaceBtn showLabel />
          <LoadDeckModal />
          <SideboardBtn showLabel />
          <MsgToggleBtn showLabel />
          <SettingsBtn showLabel />
          <Show when={props.onReturnToMenu || props.onQuitGame}>
            <LeaveSection onReturnToMenu={props.onReturnToMenu} onQuitGame={props.onQuitGame} />
          </Show>
        </div>
      </div>

      {/* Mobile hamburger dropdown */}
      <Show when={menuOpen()}>
        <div class="fixed inset-0 z-[199]" onClick={closeMenu} />
        <div
          class="absolute top-full left-0 right-0 z-[200] flex flex-col gap-1 p-2 border-b border-raised shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          style={{ background: "linear-gradient(180deg, #1a1c19 0%, #171916 100%)" }}
        >
          <FreePlaceBtn onClick={() => { setFreePlaceMode(v => !v); closeMenu(); }} showLabel />
          <LoadDeckModal onClose={closeMenu} />
          <SideboardBtn onClick={() => { openDeckSearch(`${myUserId}:sideboard`, "Sideboard"); closeMenu(); }} showLabel />
          <SettingsBtn onClick={() => { setShowSettingsModal(true); closeMenu(); }} showLabel />
          <Show when={props.onReturnToMenu}>
            <button
              class={gbarBtn}
              onClick={() => { closeMenu(); props.onReturnToMenu!(); }}
            >
              <span class={gbarIcon}>⤺</span>
              <span class={gbarLabel}>Return to Menu</span>
            </button>
          </Show>
          <Show when={props.onQuitGame}>
            <button
              class={`${gbarBase} hover:border-danger/50 hover:text-danger`}
              onClick={() => { closeMenu(); props.onQuitGame!(); }}
            >
              <span class={gbarIcon}>✕</span>
              <span class={gbarLabel}>Quit Game</span>
            </button>
          </Show>
        </div>
      </Show>

      {/* Messaging drawer */}
      <Show when={gameState.showMessaging}>
        <div class="messaging-drawer flex-shrink-0 overflow-hidden max-h-[280px] border-b border-[rgba(65,68,63,0.7)] bg-[rgba(25,27,24,0.98)] lg:flex-1 lg:overflow-hidden lg:border-b-0 lg:border-t lg:border-[rgba(65,68,63,0.7)] lg:max-h-none lg:mt-0">
          <div class="messaging-inner flex flex-col h-[280px] p-0 lg:h-full lg:min-h-0">
            <MessagingPanel />
          </div>
        </div>
      </Show>
    </aside>
  );
};
