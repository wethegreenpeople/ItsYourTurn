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

  function targets(): string[] {
    const selected = getSelectedIds();
    return selected.size > 1 && selected.has(contextMenu.cardId)
      ? Array.from(selected)
      : [contextMenu.cardId];
  }

  const isMulti = () => targets().length > 1;
  const menuX = () => Math.min(contextMenu.x, window.innerWidth - 180);
  const menuY = () => Math.min(contextMenu.y, window.innerHeight - props.actions.length * 36 - 16);

  return (
    <Show when={contextMenu.visible}>
      <Portal>
        <div
          class="fixed inset-0 z-[9998]"
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
          class="context-menu fixed z-[9999] min-w-[172px] border border-raised rounded-md p-1 flex flex-col gap-px overflow-hidden"
          style={{
            left: `${menuX()}px`,
            top: `${menuY()}px`,
            background: "linear-gradient(180deg, #2b2d2a 0%, #1a1c19 100%)",
            "box-shadow": "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,203,92,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
            animation: "context-menu-in 0.1s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Show when={isMulti()}>
            <div class="px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-gold border-b border-gold/15 mb-0.5">
              {targets().length} cards selected
            </div>
          </Show>
          <For each={props.actions}>
            {(action) => (
              <button
                class="flex items-center w-full py-[7px] px-2.5 bg-transparent border-none rounded text-text font-body text-[clamp(11px,0.9vw,13px)] font-medium tracking-[0.04em] text-left cursor-pointer transition-[background,color] duration-100 whitespace-nowrap hover:bg-gold/12 hover:text-gold active:bg-gold/20"
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
