import { createEffect, createSignal, For, JSX, onCleanup, Show } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createDroppable,
} from "@thisbeyond/solid-dnd";
import { Plugin } from "../plugins/base/plugin";
import "./App.css";
import { CardComponent, CardVisual } from "./components/card";
import { Card } from "./models/Card";
import { Plugins, setActivePlugin } from "./stores/pluginStore";
import { cardsInDeck } from "./stores/deckStore";
import { gameState, initGame } from "./stores/gameStore";
import { GameHeader } from "./components/GameHeader";
import { CardContextMenu } from "./components/CardContextMenu";
import { previewState, hidePreview } from "./stores/cardPreviewStore";
import { ArrowOverlay } from "./components/ArrowOverlay";
import { pendingSource, cancelTargeting } from "./stores/targetingStore";

export const DropZone = (props: { id: string; children: JSX.Element }) => {
  const droppable = createDroppable(props.id);
  return (
    <div
      use:droppable={droppable}
      class="h-full w-full transition-all duration-200"
      classList={{ "zone-drop-active": droppable.isActiveDroppable }}
    >
      {props.children}
    </div>
  );
};

function App() {
  const plugin: Plugin = Plugins.filter(s => s.id === "riftbound")[0];

  // Set active plugin so lifecycle hooks work from deckStore/gameStore
  setActivePlugin(plugin);

  // Register each player and build their board areas.
  // Local player is sorted last so their board renders at the bottom.
  const playerBoards = gameState.players
    .map((p) => {
      plugin.registerPlayer(p.id);
      return { playerId: p.id, areas: plugin.createPlayerAreas(p.id) };
    })
    .sort((a, b) =>
      a.playerId === gameState.localPlayerId ? 1
        : b.playerId === gameState.localPlayerId ? -1
        : 0
    );

  initGame(plugin.startingScore ?? 20, plugin.scoreLabel ?? "HP");
  plugin.onGameStart?.(gameState.players.map(p => ({ id: p.id, name: p.name })));

  const t = plugin.theme ?? {};
  const themeVars = {
    "--plugin-accent":       t.accentColor        ?? "#c9a84c",
    "--plugin-accent-dim":   t.accentDim          ?? "#7a6030",
    "--plugin-surface":      t.surfaceColor       ?? "rgba(30,34,54,0.95)",
    "--plugin-border":       t.borderColor        ?? "#3a3d54",
    "--plugin-text":         t.textColor          ?? "#e2d9c7",
    "--plugin-text-muted":   t.textMuted          ?? "#c5c3d8",
    "--plugin-font-display": t.fontDisplay        ?? "'Cinzel', Georgia, serif",
    "--plugin-font-body":    t.fontBody           ?? "'Rajdhani', system-ui, sans-serif",
    "--plugin-grid-cols":    t.gridColumnsTemplate ?? "repeat(12, 1fr)",
    "--plugin-grid-rows":    t.gridRowsTemplate    ?? "repeat(12, 1fr)",
  };

  // Mobile: which player's board to show (desktop shows all)
  const [viewingPlayerId, setViewingPlayerId] = createSignal(gameState.localPlayerId);
  // Auto-switch mobile view to the active player on end turn
  createEffect(() => setViewingPlayerId(gameState.currentTurnPlayerId));

  // Targeting mode: crosshair cursor, Escape or click-away to cancel
  createEffect(() => {
    document.body.classList.toggle("targeting-mode", !!pendingSource());
  });
  createEffect(() => {
    if (!pendingSource()) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancelTargeting(); };
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-card-id]")) cancelTargeting();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onDocClick, { capture: true });
    onCleanup(() => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick, { capture: true });
    });
  });

  return (
    <DragDropProvider onDragEnd={plugin.onDragEnd}>
      <DragDropSensors />
      <CardContextMenu actions={plugin.cardActions ?? []} />
      <main class="game-root" style={themeVars}>
        <GameHeader />
        <div class="game-main">

          {/* Board switcher — mobile only, hidden on desktop via CSS */}
          <Show when={gameState.players.length > 1}>
            <div class="board-switcher">
              <For each={gameState.players}>
                {(p) => (
                  <button
                    class="board-switcher-tab"
                    classList={{ "board-switcher-tab--active": viewingPlayerId() === p.id }}
                    onClick={() => setViewingPlayerId(p.id)}
                  >
                    {p.id === gameState.localPlayerId ? `${p.name} (You)` : p.name}
                  </button>
                )}
              </For>
            </div>
          </Show>

          {/* All player boards — active player gets more height via CSS variable */}
          <div
            class="game-boards-wrapper"
            style={{
              "--active-rows": gameState.currentTurnPlayerId === gameState.localPlayerId
                ? "1fr 1.6fr"
                : "1.6fr 1fr",
            }}
          >
            <For each={playerBoards}>
              {({ playerId, areas }) => (
                <div
                  class="player-board"
                  classList={{
                    "player-board--hidden-mobile": viewingPlayerId() !== playerId,
                    "player-board--local": playerId === gameState.localPlayerId,
                  }}
                >
                  <div class="player-board-label">
                    {playerId === gameState.localPlayerId
                      ? "Your Board"
                      : gameState.players.find(p => p.id === playerId)?.name ?? playerId}
                  </div>
                  <div class="game-board">
                    <div class="game-grid">
                      <For each={areas}>
                        {(panel) => (
                          <div
                            class={`zone-panel${panel.className ? ` ${panel.className}` : ''}`}
                            style={{
                              "grid-column": `${panel.region.xStart} / ${panel.region.xFinish}`,
                              "grid-row":    `${panel.region.yStart} / ${panel.region.yFinish}`,
                            }}
                          >
                            {panel.content()}
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* Local player's hand — always at the bottom */}
          <div class="hand-dock">
            <DropZone id={`${gameState.localPlayerId}:hand`}>
              <div class="hand-inner">
                <span class="zone-label">Hand</span>
                <div class="hand-cards">
                  <SortableProvider ids={cardsInDeck(`${gameState.localPlayerId}:hand`).map(c => c.id)}>
                    <For each={cardsInDeck(`${gameState.localPlayerId}:hand`)}>
                      {(card) => <CardComponent card={card} zoneId={`${gameState.localPlayerId}:hand`} />}
                    </For>
                  </SortableProvider>
                </div>
              </div>
            </DropZone>
          </div>

        </div>
      </main>

      {/* DragOverlay last — renders on top of all zone stacking contexts */}
      <DragOverlay>
        {(draggable) => (
          <Show when={draggable}>
            <CardVisual card={draggable!.data.card as Card} />
          </Show>
        )}
      </DragOverlay>

      {/* Targeting arrows — live SVG overlay tracking source→target card centers */}
      <ArrowOverlay />

      {/* Card preview — floats near long-press position, transparent backdrop closes it */}
      <Show when={previewState()}>
        <div class="card-preview-backdrop" onClick={hidePreview} />
        <div
          class="card-preview-popup"
          style={{
            left: `${Math.max(8, Math.min(window.innerWidth - 196, previewState()!.x + 15))}px`,
            top: `${Math.max(8, Math.min(window.innerHeight - 260, previewState()!.y - 280))}px`,
          }}
        >
          <CardVisual card={previewState()!.card} />
        </div>
      </Show>

    </DragDropProvider>
  );
}

export default App;
