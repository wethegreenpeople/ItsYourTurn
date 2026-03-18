import { For, Show } from "solid-js";
import {
  gameState,
  adjustScore,
  endTurn,
  toggleMessaging,
  type Player,
} from "../stores/gameStore";
import { freePlaceMode, setFreePlaceMode } from "../stores/freePlaceStore";
import { LoadDeckModal } from "./LoadDeckModal";
import { cardsInDeck } from "../stores/deckStore";
import { openDeckSearch } from "../stores/deckContextMenuStore";

const PlayerPanel = (props: { player: Player }) => {
  const isLocalPlayer = () => props.player.id === gameState.localPlayerId;
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
        <span class="score-label">{gameState.scoreLabel}</span>
        <button
          class="score-btn"
          onClick={() => adjustScore(props.player.id, -1)}
          aria-label="Decrease score"
        >
          −
        </button>
        <span class="score-value">{props.player.score}</span>
        <button
          class="score-btn"
          onClick={() => adjustScore(props.player.id, 1)}
          aria-label="Increase score"
        >
          +
        </button>
      </div>
    </div>
  );
};

export const GameHeader = () => {
  const isMyTurn = () => gameState.currentTurnPlayerId === gameState.localPlayerId;

  return (
    <aside class="game-sidebar">
      {/* Horizontal row: players + actions. Drawer sits BELOW this, not inside it. */}
      <div class="sidebar-toprow">
        <div class="sidebar-players">
          <For each={gameState.players}>
            {(player) => <PlayerPanel player={player} />}
          </For>
        </div>

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
          <Show when={cardsInDeck(`${gameState.localPlayerId}:sideboard`).length > 0}>
            <button
              class="sideboard-btn"
              onClick={() => openDeckSearch(`${gameState.localPlayerId}:sideboard`, "Sideboard")}
              title="View sideboard"
            >
              <span class="sideboard-icon">⧉</span>
              <span class="sideboard-label">
                Sideboard ({cardsInDeck(`${gameState.localPlayerId}:sideboard`).length})
              </span>
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

      {/* Drawer renders below the toprow — never inside the horizontal row */}
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
