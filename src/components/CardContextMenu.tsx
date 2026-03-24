import { Show, For, onMount, onCleanup, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { contextMenu, hideContextMenu } from "../stores/contextMenuStore";
import { getSelectedIds, enterSelectMode, toggleSelected } from "../stores/selectionStore";
import type { CardAction } from "../../plugins/base/plugin";

export const CardContextMenu = (props: { actions: CardAction[] }) => {
  const [expanded, setExpanded] = createSignal<string | null>(null);

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

  const visibleActions = () => props.actions.filter(a => !a.show || a.show(contextMenu.cardId));
  const isMulti = () => targets().length > 1;
  const menuX = () => Math.min(contextMenu.x, window.innerWidth - 180);
  const menuY = () => Math.min(contextMenu.y, window.innerHeight - visibleActions().length * 36 - 16);

  const btnClass = "flex items-center w-full py-[7px] px-2.5 bg-transparent border-none rounded text-text font-body text-[clamp(11px,0.9vw,13px)] font-medium tracking-[0.04em] text-left cursor-pointer transition-[background,color] duration-100 whitespace-nowrap hover:bg-gold/12 hover:text-gold active:bg-gold/20";
  const subBtnClass = "flex items-center w-full py-[6px] px-2.5 bg-transparent border-none rounded text-text-muted font-body text-[clamp(10px,0.85vw,12px)] font-medium tracking-[0.04em] text-left cursor-pointer transition-[background,color] duration-100 whitespace-nowrap hover:bg-gold/10 hover:text-gold active:bg-gold/18";

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
          <For each={visibleActions()}>
            {(action) => (
              <>
                <button
                  class={btnClass}
                  onClick={() => {
                    if (action.submenu) {
                      setExpanded(v => v === action.label ? null : action.label);
                    } else if (action.action) {
                      const ids = targets();
                      ids.forEach(id => action.action!(id, contextMenu.zoneId));
                      hideContextMenu();
                    }
                  }}
                >
                  <span class="flex-1">{action.label}</span>
                  <Show when={action.submenu}>
                    <span class="text-[10px] opacity-60 ml-1">
                      {expanded() === action.label ? "▾" : "▸"}
                    </span>
                  </Show>
                </button>
                <Show when={action.submenu && expanded() === action.label}>
                  <div class="flex flex-col gap-px pl-2 pb-0.5 border-b border-gold/8">
                    <For each={action.submenu!}>
                      {(sub) => (
                        <button
                          class={subBtnClass}
                          onClick={() => {
                            const ids = targets();
                            ids.forEach(id => sub.action(id, contextMenu.zoneId));
                            hideContextMenu();
                          }}
                        >
                          {sub.label}
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </>
            )}
          </For>
        </div>
      </Portal>
    </Show>
  );
};
