import { Show, For, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { contextMenu, hideContextMenu } from "../stores/contextMenuStore";
import { getSelectedIds, enterSelectMode, toggleSelected } from "../stores/selectionStore";
import type { CardAction } from "../../plugins/base/plugin";

export const CardContextMenu = (props: { actions: CardAction[] }) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") hideContextMenu();
  };

  onMount(() => document.addEventListener("keydown", handleKeyDown));
  onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

  /** Cards the next action should apply to — resolved fresh each time. */
  function targets(): string[] {
    const selected = getSelectedIds();
    return selected.size > 1 && selected.has(contextMenu.cardId)
      ? Array.from(selected)
      : [contextMenu.cardId];
  }

  const isMulti = () => targets().length > 1;

  // Clamp menu position so it doesn't overflow the viewport
  const menuX = () => Math.min(contextMenu.x, window.innerWidth - 180);
  const menuY = () => Math.min(contextMenu.y, window.innerHeight - props.actions.length * 36 - 16);

  return (
    <Show when={contextMenu.visible}>
      <Portal>
        {/* Backdrop catches outside clicks.
            elementsFromPoint lets us detect cards behind the backdrop so tapping
            a different card enters multi-select rather than just dismissing. */}
        <div
          class="context-menu-backdrop"
          onClick={(e) => {
            const anchorId = contextMenu.cardId;
            const behind = document.elementsFromPoint(e.clientX, e.clientY);
            const cardEl = behind.find(
              el => (el as HTMLElement).dataset?.cardId
            ) as HTMLElement | undefined;
            const tappedId = cardEl?.dataset.cardId;
            hideContextMenu();
            if (tappedId && tappedId !== anchorId) {
              enterSelectMode(anchorId);
              toggleSelected(tappedId);
            }
          }}
          onContextMenu={(e) => { e.preventDefault(); hideContextMenu(); }}
        />
        <div
          class="context-menu"
          style={{ left: `${menuX()}px`, top: `${menuY()}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <Show when={isMulti()}>
            <div class="context-menu-header">
              {targets().length} cards selected
            </div>
          </Show>
          <For each={props.actions}>
            {(action) => (
              <button
                class="context-menu-item"
                onClick={() => {
                  const ids = targets();
                  ids.forEach(id => action.action(id, contextMenu.zoneId));
                  hideContextMenu();
                }}
              >
                {action.label}
              </button>
            )}
          </For>
        </div>
      </Portal>
    </Show>
  );
};
