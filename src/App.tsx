import { createStore } from "solid-js/store";
import { For, JSX, Show } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createDroppable,
} from "@thisbeyond/solid-dnd";
import { Plugin, PlayArea } from "../plugins/base/plugin";
import "./App.css";
import { CardComponent, CardVisual } from "./components/card";
import { Card } from "./models/Card";
import { Plugins } from "./stores/pluginStore";
import { cardsInDeck } from "./stores/deckStore";
import { GameHeader } from "./components/GameHeader";

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
  const plugins: Plugin[] = Plugins;
  const plugin: Plugin = plugins.filter(s => s.id === "riftbound")[0];
  const [panels] = createStore<PlayArea[]>(plugin.playAreas);

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
  };

  return (
    <DragDropProvider onDragEnd={plugin.onDragEnd}>
      <DragDropSensors />
      <DragOverlay>
        {(draggable) => (
          <Show when={draggable}>
            <CardVisual card={draggable!.data.card as Card} />
          </Show>
        )}
      </DragOverlay>
      <main class="game-root" style={themeVars}>
        <GameHeader />
        <div class="game-board">
          <div class="game-grid">
            <For each={panels}>
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
        <div class="hand-dock">
          <DropZone id="hand">
            <div class="hand-inner">
              <span class="zone-label">Hand</span>
              <div class="hand-cards">
                <SortableProvider ids={cardsInDeck("hand").map(c => c.id)}>
                  <For each={cardsInDeck("hand")}>
                    {(card) => <CardComponent card={card} zoneId="hand" />}
                  </For>
                </SortableProvider>
              </div>
            </div>
          </DropZone>
        </div>
      </main>
    </DragDropProvider>
  );
}

export default App;
