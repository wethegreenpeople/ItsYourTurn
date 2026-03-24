import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { useDragDropContext } from "@thisbeyond/solid-dnd";
import { viewingPlayerId, setViewingPlayerId } from "../stores/boardViewStore";
import { gameState } from "../stores/gameStore";
import { getActivePlugin } from "../stores/pluginStore";

/**
 * Handles two mobile-only drag gestures for switching the viewed player board:
 *  1. Drag to the left/right edge of the screen → switch to prev/next player after a short hold.
 *  2. Drag pointer over any element with [data-player-id] → switch to that player after a short hold.
 *
 * Also renders the left/right edge indicator strips that appear while dragging.
 * Must be rendered inside <DragDropProvider>.
 */
export const DragBoardSwitcher = () => {
  const [dndState] = useDragDropContext()!;
  const [activeEdge, setActiveEdge] = createSignal<"left" | "right" | null>(null);

  let switchTimer: ReturnType<typeof setTimeout> | undefined;

  const cancelSwitch = () => {
    clearTimeout(switchTimer);
    switchTimer = undefined;
  };

  const scheduleSwitch = (targetId: string, delay: number) => {
    if (viewingPlayerId() === targetId || switchTimer) return;
    switchTimer = setTimeout(() => {
      setViewingPlayerId(targetId);
      switchTimer = undefined;
      setActiveEdge(null);
    }, delay);
  };

  createEffect(() => {
    const dragging = !!dndState.active.draggable;
    if (!dragging) {
      cancelSwitch();
      setActiveEdge(null);
      return;
    }

    const onPointerMove = (e: PointerEvent) => {
      const ids = gameState.players.map(p => p.id);
      const curIdx = ids.indexOf(viewingPlayerId());

      // 1. Player panel / board-switcher tab hover (works on all screen sizes).
      //    e.target is always the DragOverlay card, so pierce through with elementsFromPoint.
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      let playerEl: HTMLElement | null = null;
      for (const el of stack) {
        const found = (el as HTMLElement).closest?.("[data-player-id]") as HTMLElement | null;
        if (found) { playerEl = found; break; }
      }
      if (playerEl) {
        const pid = playerEl.dataset.playerId!;
        if (pid !== viewingPlayerId()) {
          cancelSwitch();
          setActiveEdge(null);
          scheduleSwitch(pid, 500);
          return;
        }
      }

      // 2. Left / right edge zones — mobile only, not for free-place plugin
      if (window.innerWidth >= 768 || getActivePlugin()?.id === "riftbound-freeplace") {
        cancelSwitch();
        setActiveEdge(null);
        return;
      }

      const w = window.innerWidth;
      const EDGE = w * 0.13;

      if (e.clientX < EDGE) {
        const prev = ids[(curIdx - 1 + ids.length) % ids.length];
        if (prev !== viewingPlayerId()) {
          setActiveEdge("left");
          scheduleSwitch(prev, 400);
          return;
        }
      } else if (e.clientX > w - EDGE) {
        const next = ids[(curIdx + 1) % ids.length];
        if (next !== viewingPlayerId()) {
          setActiveEdge("right");
          scheduleSwitch(next, 400);
          return;
        }
      } else {
        // Moved away from edge
        cancelSwitch();
        setActiveEdge(null);
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    onCleanup(() => {
      document.removeEventListener("pointermove", onPointerMove);
      cancelSwitch();
      setActiveEdge(null);
    });
  });

  const isDragging = () => !!dndState.active.draggable;
  const multiPlayer = () => gameState.players.length > 1;

  return (
    <Show when={isDragging() && multiPlayer()}>
      <div
        class="drag-edge-zone drag-edge-zone--left"
        classList={{ "drag-edge-zone--active": activeEdge() === "left" }}
      >
        <span class="drag-edge-arrow">‹</span>
      </div>
      <div
        class="drag-edge-zone drag-edge-zone--right"
        classList={{ "drag-edge-zone--active": activeEdge() === "right" }}
      >
        <span class="drag-edge-arrow">›</span>
      </div>
    </Show>
  );
};
