import { For, Show } from "solid-js";
import {
  gameState,
  adjustScore,
  endTurn,
  toggleMessaging,
  type Player,
} from "../stores/gameStore";

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
    >
      <div class="player-panel-top">
        <span class="player-name">{props.player.name}</span>
        <Show when={isCurrentTurn()}>
          <span class="turn-badge">YOUR TURN</span>
        </Show>
      </div>
      <div class="player-panel-score">
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
    <>
      <header class="game-header">
        <div class="game-header-players">
          <For each={gameState.players}>
            {(player) => <PlayerPanel player={player} />}
          </For>
        </div>
        <div class="game-header-actions">
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
        </div>
      </header>
      <Show when={gameState.showMessaging}>
        <div class="messaging-drawer">
          <div class="messaging-inner">
            <span class="messaging-label">Chat &amp; Log — coming soon</span>
          </div>
        </div>
      </Show>
    </>
  );
};
