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

function App(props: { isHost?: boolean; onReturnToMenu?: () => void; onQuitGame?: () => void }) {
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
    "--plugin-accent":       t.accentColor        ?? "#f5cb5c",
    "--plugin-accent-dim":   t.accentDim          ?? "#b8952a",
    "--plugin-surface":      t.surfaceColor       ?? "rgba(39,39,42,0.95)",
    "--plugin-border":       t.borderColor        ?? "#52525B",
    "--plugin-text":         t.textColor          ?? "#e8eddf",
    "--plugin-text-muted":   t.textMuted          ?? "#cfdbd5",
    "--plugin-font-display": t.fontDisplay        ?? "'Cinzel', Georgia, serif",
    "--plugin-font-body":    t.fontBody           ?? "'Inter', system-ui, sans-serif",
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
      <main
        class="flex flex-col h-dvh lg:flex-row"
        style={{
          ...themeVars,
          background: "radial-gradient(ellipse 100% 55% at 50% 0%, rgba(40, 40, 48, 0.25) 0%, transparent 70%), linear-gradient(180deg, #1c1c1f 0%, #111113 100%)",
        }}
      >
        <GameHeader onReturnToMenu={props.onReturnToMenu} onQuitGame={props.onQuitGame} />
        <div class="flex flex-col flex-1 min-h-0 min-w-0">

          {/* Board switcher — mobile only, hidden on desktop via lg:hidden */}
          <Show when={gameState.players.length > 1}>
            <div class="flex gap-1 px-2 py-1.5 bg-base/90 border-b border-raised flex-shrink-0 lg:hidden">
              <For each={gameState.players}>
                {(p) => (
                  <button
                    class="flex-1 py-1.5 px-2 rounded text-[11px] font-semibold tracking-widest uppercase cursor-pointer
                           transition-colors duration-150 border"
                    classList={{
                      "bg-gold/12 border-gold/50 text-gold": viewingPlayerId() === p.id,
                      "bg-surface/85 border-raised text-text-muted": viewingPlayerId() !== p.id,
                    }}
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
            class="game-boards-wrapper flex flex-col flex-1 min-h-0"
            style={{
              "--active-rows": gameState.currentTurnPlayerId === currentPlayer()?.id
                ? "1fr 1.6fr"
                : "1.6fr 1fr",
            }}
          >
            <For each={playerBoards()}>
              {({ playerId, areas }) => (
                <div
                  class="player-board flex flex-col flex-1 min-h-0 min-w-0"
                  classList={{
                    "player-board--hidden-mobile": viewingPlayerId() !== playerId,
                    "player-board--local": playerId === currentPlayer()?.id,
                  }}
                >
                  <div class="font-cinzel text-[clamp(8px,0.7vw,11px)] font-semibold tracking-widest uppercase text-text-muted px-2 py-0.5 flex-shrink-0 border-b border-white/4">
                    {playerId === currentPlayer()?.id
                      ? "Your Board"
                      : gameState.players.find(p => p.id === playerId)?.name ?? playerId}
                  </div>
                  <div class="game-board flex-1 min-h-0 p-1.5 md:p-2.5 relative overflow-hidden md:overflow-visible">
                    <div
                      class="game-grid h-full w-full grid gap-[3px] md:gap-1 bg-base/40 border border-raised rounded-lg md:rounded-[10px] p-[3px] md:p-1"
                      style={{
                        "grid-template-columns": "var(--plugin-grid-cols, repeat(12, 1fr))",
                        "grid-template-rows": "var(--plugin-grid-rows, repeat(12, 1fr))",
                      }}
                    >
                      <For each={areas}>
                        {(panel) => (
                          <div
                            class={`zone-panel bg-surface/95 border border-rim transition-[border-color] duration-200${panel.className ? ` ${panel.className}` : ''}`}
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
          <div
            class="hand-dock relative flex-shrink-0 border-t border-raised"
            style={{
              background: "linear-gradient(0deg, #111113 0%, #18181b 100%)",
              "min-height": "clamp(96px, 13vh, 160px)",
              "max-height": "clamp(120px, 18vh, 200px)",
            }}
          >
            <DropZone id={`${currentPlayer()?.id}:hand`}>
              <div class="flex flex-col h-full px-2 pt-1.5 pb-2 gap-1">
                <span class="zone-label">Hand</span>
                <div class="hand-cards flex flex-row gap-2 overflow-x-auto flex-1 items-end pb-0.5" style={{ "-webkit-overflow-scrolling": "touch", "scrollbar-width": "none" }}>
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
              <div class="fixed inset-0 z-[9999]" onClick={hidePreview} />
              <div class="card-preview-popup fixed z-[10000] pointer-events-auto" style={{ left: `${x}px`, top: `${y}px`, animation: "preview-card-in 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
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
