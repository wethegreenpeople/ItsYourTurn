import { createDraggable, createDroppable, createSortable } from "@thisbeyond/solid-dnd";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      draggable: ReturnType<typeof createDraggable>;
      droppable: ReturnType<typeof createDroppable>;
      sortable: ReturnType<typeof createSortable>;
    }
  }
}
