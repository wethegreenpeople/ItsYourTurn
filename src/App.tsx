import { createEffect, createMemo, For, JSX, onCleanup, Show } from "solid-js";
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
import { cardsInDeck, moveCard } from "./stores/deckStore";
import { viewingPlayerId, setViewingPlayerId } from "./stores/boardViewStore";
import { currentPlayer, gameState, initGame } from "./stores/gameStore";
import { GameHeader } from "./components/GameHeader";
import { CardContextMenu } from "./components/CardContextMenu";
import { DeckContextMenu } from "./components/DeckContextMenu";
import { DeckSearchModal } from "./components/DeckSearchModal";
import { previewState, hidePreview } from "./stores/cardPreviewStore";
import { ArrowOverlay } from "./components/ArrowOverlay";
import { pendingSource, cancelTargeting } from "./stores/targetingStore";
import { SelectionBox } from "./components/SelectionBox";
import { isHorizontal } from "./stores/cardStateStore";
import { DragBoardSwitcher } from "./components/DragBoardSwitcher";

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

function App(props: { isHost?: boolean }) {
  const plugin: Plugin = Plugins.filter(s => s.id === "riftbound")[0];

  // Set active plugin so lifecycle hooks work from deckStore/gameStore
  setActivePlugin(plugin);

  // Track registered players so registerPlayer/createPlayerAreas only run once per player.
  const registeredPlayers = new Map<string, { playerId: string; areas: ReturnType<Plugin["createPlayerAreas"]> }>();

  const playerBoards = createMemo(() => {
    const mapped = gameState.players.map((p) => {
      if (!registeredPlayers.has(p.id)) {
        plugin.registerPlayer(p.id);
        registeredPlayers.set(p.id, { playerId: p.id, areas: plugin.createPlayerAreas(p.id) });
      }
      return registeredPlayers.get(p.id)!;
    });

    // Always place local player at index 1 (bottom-left in the column-flow grid).
    // Grid fills: index 0 = top-left, index 1 = bottom-left, index 2 = top-right, etc.
    const localIdx = mapped.findIndex(b => b.playerId === currentPlayer()?.id);
    if (localIdx > 1) {
      const [local] = mapped.splice(localIdx, 1);
      mapped.splice(1, 0, local);
    } else if (localIdx === 0 && mapped.length > 1) {
      const [local] = mapped.splice(0, 1);
      mapped.splice(1, 0, local);
    }

    return mapped;
  });

  if (props.isHost) {
    initGame(plugin.startingScore ?? 20, plugin.scoreLabel ?? "Doot");
  }
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

  // Context menu actions: static plugin actions + dynamic "send to other player's battlefield" entries
  const allCardActions = () => [
    ...(plugin.cardActions ?? []),
    ...gameState.players
      .filter(p => p.id !== currentPlayer()?.id)
      .map(p => ({
        label: `To ${p.name}'s Battlefield`,
        action: (cardId: string) => moveCard(cardId, `${p.id}:battlefield`),
      })),
  ];

  // Targeting mode: crosshair cursor, Escape or click-away to cancel
  createEffect(() => {
    document.body.classList.toggle("targeting-mode", !!pendingSource());
  });
  createEffect(() => {
    if (!pendingSource()) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancelTargeting(); };
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Element;
      // Allow clicking cards (completes target) and board-switch controls without cancelling
      if (t.closest("[data-card-id]") || t.closest("[data-player-id]")) return;
      cancelTargeting();
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
      <CardContextMenu actions={allCardActions()} />
      <DeckContextMenu />
      <DeckSearchModal />
      <DragBoardSwitcher />
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
                    data-player-id={p.id}
                  >
                    {p.id === currentPlayer()?.id ? `${p.name} (You)` : p.name}
                  </button>
                )}
              </For>
            </div>
          </Show>

          {/* All player boards — active player gets more height via CSS variable */}
          <div
            class="game-boards-wrapper"
            style={{
              "--active-rows": gameState.currentTurnPlayerId === currentPlayer()?.id
                ? "1fr 1.6fr"
                : "1.6fr 1fr",
            }}
          >
            <For each={playerBoards()}>
              {({ playerId, areas }) => (
                <div
                  class="player-board"
                  classList={{
                    "player-board--hidden-mobile": viewingPlayerId() !== playerId,
                    "player-board--local": playerId === currentPlayer()?.id,
                  }}
                >
                  <div class="player-board-label">
                    {playerId === currentPlayer()?.id
                      ? "Your Board"
                      : gameState.players.find(p => p.id === playerId)?.name ?? playerId}
                  </div>
                  <div class="game-board">
                    <div class="game-grid">
                      <For each={areas}>
                        {(panel) => (
                          <div
                            class={`zone-panel${panel.className ? ` ${panel.className}` : ''}`}
                            data-zone={panel.id}
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
            <DropZone id={`${currentPlayer()?.id}:hand`}>
              <div class="hand-inner">
                <span class="zone-label">Hand</span>
                <div class="hand-cards">
                  <SortableProvider ids={cardsInDeck(`${currentPlayer()?.id}:hand`).map(c => c.id)}>
                    <For each={cardsInDeck(`${currentPlayer()?.id}:hand`)}>
                      {(card) => <CardComponent card={card} zoneId={`${currentPlayer()?.id}:hand`} />}
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
            {() => {
              const card = draggable!.data.card as Card;
              const zoneId = draggable!.data.zoneId as string;
              return (
                <CardVisual
                  card={card}
                  horizontal={isHorizontal(card.id)}
                />
              );
            }}
          </Show>
        )}
      </DragOverlay>

      {/* Targeting arrows — live SVG overlay tracking source→target card centers */}
      <ArrowOverlay />

      {/* Rubber-band multi-card selection */}
      <SelectionBox />

      {/* Card preview — floats near long-press position, transparent backdrop closes it */}
      <Show when={previewState()}>
        {() => {
          const card = previewState()!.card;
          const horiz = isHorizontal(card.id);
          // Portrait preview: 270×378. Horizontal preview: 378×270 (swapped).
          const pw = horiz ? 378 : 270;
          const ph = horiz ? 270 : 378;
          const x = Math.max(8, Math.min(window.innerWidth  - pw - 16, previewState()!.x + 15));
          const y = Math.max(8, Math.min(window.innerHeight - ph - 16, previewState()!.y - ph));
          return (
            <>
              <div class="card-preview-backdrop" onClick={hidePreview} />
              <div class="card-preview-popup" style={{ left: `${x}px`, top: `${y}px` }}>
                <CardVisual card={card} horizontal={horiz} />
              </div>
            </>
          );
        }}
      </Show>

    </DragDropProvider>
  );
}

export default App;
