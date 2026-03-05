import { createStore } from "solid-js/store";
import { For, JSX } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  DragEventHandler,
  createDraggable,
  createDroppable,
} from "@thisbeyond/solid-dnd";
import { Plugin, PlayArea } from "../plugins/base/plugin";
import { Plugins } from "../plugins/store";
import "./App.css";

type CardData = {
  id: number;
  name: string;
  zone: string;
};

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

/** A draggable card. Only rendered where card items live. */
export const Card = (props: { id: number; name: string }) => {
  const draggable = createDraggable(props.id);
  return (
    <div
      use:draggable={draggable}
      class="cursor-grab active:cursor-grabbing select-none rounded border border-blue-400 bg-blue-100 px-3 py-1 text-sm shadow"
      classList={{ "opacity-50": draggable.isActiveDraggable }}
    >
      {props.name}
    </div>
  );
};

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const plugins: Plugin[] = Plugins;
  const riftBound: Plugin = plugins[0];
  const [panels] = createStore<PlayArea[]>(riftBound.playAreas);

  const [cards, setCards] = createStore<CardData[]>([
    { id: 1, name: "Fireball",   zone: "hand" },
    { id: 2, name: "Shield",     zone: "hand" },
    { id: 3, name: "Lightning",  zone: "hand" },
  ]);

  return (
    <DragDropProvider onDragEnd={riftBound.onDragEnd}>
      <DragDropSensors />
      <main class="container h-screen p-4">
        <div class="grid h-full w-full grid-cols-12 grid-rows-12 gap-2 border-2 border-black">
          <For each={panels}>
            {(panel) => (
              <div
                class="border-2 border-red-500"
                style={{
                  "grid-column": `${panel.region.yStart} / ${panel.region.yFinish}`,
                  "grid-row": `${panel.region.xStart} / ${panel.region.xFinish}`,
                }}
              >
                {panel!.content!()}
              </div>
            )}
          </For>
        </div>
      </main>
    </DragDropProvider>
  );
}

export default App;
