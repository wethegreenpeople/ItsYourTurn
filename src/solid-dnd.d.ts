import { createDraggable, createDroppable } from "@thisbeyond/solid-dnd";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      draggable: ReturnType<typeof createDraggable>;
      droppable: ReturnType<typeof createDroppable>;
    }
  }
}
