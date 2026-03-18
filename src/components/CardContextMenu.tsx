import { Show, For, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { contextMenu, hideContextMenu } from "../stores/contextMenuStore";
import type { CardAction } from "../../plugins/base/plugin";

export const CardContextMenu = (props: { actions: CardAction[] }) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") hideContextMenu();
  };

  onMount(() => document.addEventListener("keydown", handleKeyDown));
  onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

  // Clamp menu position so it doesn't overflow the viewport
  const menuX = () => Math.min(contextMenu.x, window.innerWidth - 180);
  const menuY = () => Math.min(contextMenu.y, window.innerHeight - props.actions.length * 36 - 16);

  return (
    <Show when={contextMenu.visible}>
      <Portal>
        {/* Backdrop catches outside clicks */}
        <div
          class="context-menu-backdrop"
          onClick={hideContextMenu}
          onContextMenu={(e) => { e.preventDefault(); hideContextMenu(); }}
        />
        <div
          class="context-menu"
          style={{ left: `${menuX()}px`, top: `${menuY()}px` }}
          // Prevent backdrop from immediately closing when clicking a menu item
          onClick={(e) => e.stopPropagation()}
        >
          <For each={props.actions}>
            {(action) => (
              <button
                class="context-menu-item"
                onClick={() => {
                  action.action(contextMenu.cardId, contextMenu.zoneId);
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
