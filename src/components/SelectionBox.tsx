import { createSignal, onCleanup, Show } from "solid-js";
import { setSelection, clearSelection } from "../stores/selectionStore";
import { pendingSource } from "../stores/targetingStore";

export const SelectionBox = () => {
  const [rect, setRect] = createSignal<{ x: number; y: number; w: number; h: number } | null>(null);
  let startX = 0, startY = 0;
  let isSelecting = false;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (pendingSource()) return;
    const target = e.target as Element;
    if (
      target.closest("[data-card-id]") ||
      target.closest("button") ||
      target.closest(".context-menu") ||
      target.closest(".modal-backdrop") ||
      target.closest(".card-preview-backdrop")
    ) return;

    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    setRect(null);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isSelecting) return;
    const x = Math.min(startX, e.clientX);
    const y = Math.min(startY, e.clientY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    setRect({ x, y, w, h });
  };

  const onPointerUp = () => {
    if (!isSelecting) return;
    isSelecting = false;

    const r = rect();
    setRect(null);

    if (r && (r.w > 6 || r.h > 6)) {
      const cardEls = document.querySelectorAll("[data-card-id]");
      const selected: string[] = [];
      cardEls.forEach((el) => {
        const br = el.getBoundingClientRect();
        if (br.right > r.x && br.left < r.x + r.w && br.bottom > r.y && br.top < r.y + r.h) {
          const id = (el as HTMLElement).dataset.cardId;
          if (id) selected.push(id);
        }
      });
      if (selected.length > 0) {
        setSelection(selected);
      } else {
        clearSelection();
      }
    } else {
      clearSelection();
    }
  };

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);

  onCleanup(() => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  });

  return (
    <Show when={rect()}>
      <div
        class="selection-box"
        style={{
          left: `${rect()!.x}px`,
          top: `${rect()!.y}px`,
          width: `${rect()!.w}px`,
          height: `${rect()!.h}px`,
        }}
      />
    </Show>
  );
};
