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
import { LoadDeckModal } from "./LoadDeckModal";
import { cardsInDeck } from "../stores/deckStore";
import { openDeckSearch } from "../stores/deckContextMenuStore";

const PlayerPanel = (props: { player: Player }) => {
  const isLocalPlayer = () => props.player.id === myUserId;
  const isCurrentTurn = () => props.player.id === gameState.currentTurnPlayerId;

  return (
    <div
      class="player-panel"
      classList={{
        "player-panel--local": isLocalPlayer(),
        "player-panel--active": isCurrentTurn(),
      }}
      data-player-id={props.player.id}
    >
      <div class="player-panel-top">
        <span class="player-name">{props.player.name}</span>
        <Show when={isCurrentTurn()}>
          <span class="turn-badge">YOUR TURN</span>
        </Show>
      </div>
      <div class="player-panel-score">
        <div class="score-row">
          <span class="score-label">{gameState.scoreLabel}</span>
          <span class="score-value">{props.player.score}</span>
        </div>
        <div class="score-controls">
          <button
            class="score-btn"
            onClick={() => adjustScore(props.player.id, -1)}
            aria-label="Decrease score"
          >−</button>
          <button
            class="score-btn"
            onClick={() => adjustScore(props.player.id, 1)}
            aria-label="Increase score"
          >+</button>
        </div>
      </div>
    </div>
  );
};

export const GameHeader = () => {
  const isMyTurn = () => gameState.currentTurnPlayerId === myUserId;
  const [menuOpen, setMenuOpen] = createSignal(false);
  const closeMenu = () => setMenuOpen(false);

  const sideboardCount = () =>
    cardsInDeck(`${myUserId}:sideboard`).length;

  return (
    <aside class="game-sidebar">
      <div class="sidebar-toprow">
        {/* ── Row 1: player score panels ── */}
        <div class="sidebar-players">
          <For each={gameState.players}>
            {(player) => <PlayerPanel player={player} />}
          </For>
        </div>

        {/* ── Row 2 (mobile only): primary actions + hamburger ── */}
        <div class="sidebar-quickbar">
          <button
            class="end-turn-btn"
            classList={{ "end-turn-btn--ready": isMyTurn() }}
            onClick={endTurn}
          >
            <span class="end-turn-label">End Turn</span>
          </button>
          <button
            class="msg-toggle-btn"
            classList={{ "msg-toggle-btn--open": gameState.showMessaging }}
            onClick={toggleMessaging}
            aria-label="Toggle chat"
          >
            ✉
          </button>
          <button
            class="menu-btn"
            classList={{ "menu-btn--open": menuOpen() }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="More options"
          >
            ☰
          </button>
        </div>

        {/* ── Desktop-only: all actions in a column ── */}
        <div class="sidebar-actions">
          <button
            class="end-turn-btn"
            classList={{ "end-turn-btn--ready": isMyTurn() }}
            onClick={endTurn}
          >
            <span class="end-turn-label">End Turn</span>
          </button>
          <button
            class="freeplace-btn"
            classList={{ "freeplace-btn--active": freePlaceMode() }}
            onClick={() => setFreePlaceMode(v => !v)}
            title={freePlaceMode() ? "Switch to snap layout" : "Switch to free placement"}
          >
            <span class="freeplace-icon">{freePlaceMode() ? "⊠" : "⊞"}</span>
            <span class="freeplace-label">{freePlaceMode() ? "Snap" : "Free"}</span>
          </button>
          <LoadDeckModal />
          <Show when={sideboardCount() > 0}>
            <button
              class="sideboard-btn"
              onClick={() => openDeckSearch(`${myUserId}:sideboard`, "Sideboard")}
              title="View sideboard"
            >
              <span class="sideboard-icon">⧉</span>
              <span class="sideboard-label">Sideboard ({sideboardCount()})</span>
            </button>
          </Show>
          <button
            class="msg-toggle-btn"
            classList={{ "msg-toggle-btn--open": gameState.showMessaging }}
            onClick={toggleMessaging}
            aria-label="Toggle chat"
          >
            ✉
          </button>
        </div>
      </div>

      {/* ── Hamburger dropdown (mobile only) ── */}
      <Show when={menuOpen()}>
        <div class="menu-backdrop" onClick={closeMenu} />
        <div class="sidebar-menu-dropdown">
          <button
            class="freeplace-btn"
            classList={{ "freeplace-btn--active": freePlaceMode() }}
            onClick={() => { setFreePlaceMode(v => !v); closeMenu(); }}
          >
            <span class="freeplace-icon">{freePlaceMode() ? "⊠" : "⊞"}</span>
            <span class="freeplace-label">{freePlaceMode() ? "Snap Layout" : "Free Layout"}</span>
          </button>
          <LoadDeckModal onClose={closeMenu} />
          <Show when={sideboardCount() > 0}>
            <button
              class="sideboard-btn"
              onClick={() => {
                openDeckSearch(`${myUserId}:sideboard`, "Sideboard");
                closeMenu();
              }}
            >
              <span class="sideboard-icon">⧉</span>
              <span class="sideboard-label">Sideboard ({sideboardCount()})</span>
            </button>
          </Show>
        </div>
      </Show>

      {/* ── Messaging drawer ── */}
      <Show when={gameState.showMessaging}>
        <div class="messaging-drawer">
          <div class="messaging-inner">
            <span class="messaging-label">Chat &amp; Log — coming soon</span>
          </div>
        </div>
      </Show>
    </aside>
  );
};
