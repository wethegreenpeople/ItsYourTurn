import { createStore } from "solid-js/store";
import { For, JSX } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  createDroppable,
} from "@thisbeyond/solid-dnd";
import { Plugin, PlayArea } from "../plugins/base/plugin";
import "./App.css";
import { CardComponent } from "./components/card";
import { Plugins } from "./stores/pluginStore";
import { cardsInDeck } from "./stores/deckStore";

export const DropZone = (props: { id: string; children: JSX.Element }) => {
  const droppable = createDroppable(props.id);
  return (
    <div
      use:droppable={droppable}
      class="h-full w-full transition-colors"
      classList={{ "bg-green-100 ring-2 ring-green-400": droppable.isActiveDroppable }}
    >
      {props.children}
    </div>
  );
};

function App() {
  const plugins: Plugin[] = Plugins;
  const riftBound: Plugin = plugins.filter(s => s.id === "riftbound")[0];
  const [panels] = createStore<PlayArea[]>(riftBound.playAreas);

  return (
    <DragDropProvider onDragEnd={riftBound.onDragEnd}>
      <DragDropSensors />
      <main class="container h-screen p-4">
        <div class="flex flex-col" id="playArea">
          <div class="grid h-full w-full grid-cols-12 grid-rows-12 gap-2 border-2 border-black">
            <For each={panels}>
              {(panel) => (
                <div
                  class="border-2 border-red-500"
                  style={{
                    "grid-column": `${panel.region.xStart} / ${panel.region.xFinish}`,
                    "grid-row": `${panel.region.yStart} / ${panel.region.yFinish}`,
                  }}
                >
                  {panel.content()}
                </div>
              )}
            </For>
          </div>
        </div>
        <div class="flex flex-row" id="hand">
          <DropZone id="hand">
            <div class="flex h-full flex-col gap-2 p-2">
              <p class="text-xs text-gray-400">Hand</p>
              <div class="flex flex-wrap gap-2">
                <For each={cardsInDeck("hand")}>
                  {(card) => <CardComponent card={card} />}
                </For>
              </div>
            </div>
          </DropZone>
        </div>
      </main>
    </DragDropProvider>
  );
}

export default App;
