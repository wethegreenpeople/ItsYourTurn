import { createDraggable } from "@thisbeyond/solid-dnd";

export const Card = (props: { id: number; name: string }) => {
  const draggable = createDraggable(props.id);
  return (
    <div
      use:draggable={draggable}
      class="cursor-grab active:cursor-grabbing select-none rounded borderx-3 py-1 shadow h-25 w-20 bg-white"
      classList={{ "opacity-50": draggable.isActiveDraggable }}
      style={{ "touch-action": "none" }}
    >
      <div class="flex flex-col">
        <div class="flex flex-row bg-gray-600 place-content-center text-white">
          {props.name}
        </div>
      </div>
    </div>
  );
};
