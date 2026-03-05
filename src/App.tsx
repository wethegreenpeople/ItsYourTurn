import { createStore } from "solid-js/store";
import { For, JSX } from "solid-js";
import { RiftBound } from "../plugins/riftbound/riftbound"
import {
  DragDropProvider,
  DragDropSensors,
  DragEventHandler,
  createDraggable,
  createDroppable,
} from "@thisbeyond/solid-dnd";
import "./App.css";
import { PlayArea } from "../plugins/base/description";

// ── Types ────────────────────────────────────────────────────────────────────

type PanelId = "battlefield" | "base" | "hand";

type Panel = {
  id: PanelId;
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
};

type CardData = {
  id: number;
  name: string;
  zone: PanelId;
};

// ── Drag/drop primitives ─────────────────────────────────────────────────────

/** Wrap any content to make it a drop target. Only use where drops are wanted. */
const DropZone = (props: { id: string | number; children: JSX.Element }) => {
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
const Card = (props: { id: number; name: string }) => {
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
  const riftbound = new RiftBound();
  const [panels] = createStore<PlayArea[]>(riftbound.playAreas);

  const [cards, setCards] = createStore<CardData[]>([
    { id: 1, name: "Fireball",   zone: "hand" },
    { id: 2, name: "Shield",     zone: "hand" },
    { id: 3, name: "Lightning",  zone: "hand" },
  ]);

  const cardsIn = (zone: PanelId) => cards.filter((c) => c.zone === zone);

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (draggable && droppable) {
      const cardId = draggable.id as number;
      const targetZone = droppable.id as PanelId;
      setCards((c) => c.id === cardId, "zone", targetZone);
    }
  };

  /**
   * Define what each panel renders.
   * Panels that want drag/drop wrap with <DropZone> or render <Card>s.
   * Panels that don't (e.g. "base") just return plain content.
   */
  const panelContent: Record<string, () => JSX.Element> = {
    battlefield: () => (
      <DropZone id="battlefield">
        <div class="flex h-full flex-col gap-2 p-2">
          <p class="text-xs text-gray-400">Battlefield</p>
          <div class="flex flex-wrap gap-2">
            <For each={cardsIn("battlefield")}>
              {(card) => <Card id={card.id} name={card.name} />}
            </For>
          </div>
        </div>
      </DropZone>
    ),

    base: () => (
      // No drag/drop here — just plain content
      <div class="flex h-full flex-col gap-2 p-2">
        <p class="text-xs text-gray-400">Base (static)</p>
        <p class="text-sm">No drag/drop in this panel.</p>
      </div>
    ),

    hand: () => (
      <DropZone id="hand">
        <div class="flex h-full flex-col gap-2 p-2">
          <p class="text-xs text-gray-400">Hand</p>
          <div class="flex flex-wrap gap-2">
            <For each={cardsIn("hand")}>
              {(card) => <Card id={card.id} name={card.name} />}
            </For>
          </div>
        </div>
      </DropZone>
    ),
  };

  return (
    <DragDropProvider onDragEnd={onDragEnd}>
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
                {panelContent[panel.id]?.()}
              </div>
            )}
          </For>
        </div>
      </main>
    </DragDropProvider>
  );
}

export default App;
