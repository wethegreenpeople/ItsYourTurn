import { createDraggable } from "@thisbeyond/solid-dnd";
import { createSignal } from "solid-js";
import { Card } from "../models/Card";

export const CardComponent = (props: { card: Card }) => {
  const draggable = createDraggable(props.card.id);
  const [rotated, setRotated] = createSignal(false);
  return (
    <div
      use:draggable={draggable}
      class="cursor-grab active:cursor-grabbing select-none rounded borderx-3 py-1 shadow h-25 w-20 bg-white transition-transform"
      classList={{ "opacity-50": draggable.isActiveDraggable }}
      style={{ "touch-action": "none", transform: rotated() ? "rotate(90deg)" : "" }}
      onDblClick={() => setRotated((r) => !r)}
    >
      <div class="flex flex-col">
        <div class="flex flex-row bg-gray-600 place-content-center text-white">
          {props.card.name}
        </div>
      </div>
    </div>
  );
};
