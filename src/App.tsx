import { createStore } from "solid-js/store";
import { For, JSX } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  createDroppable,
} from "@thisbeyond/solid-dnd";
import { Plugin, PlayArea } from "../plugins/base/plugin";
import { Plugins } from "../plugins/store";
import "./App.css";

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
      </main>
    </DragDropProvider>
  );
}

export default App;
