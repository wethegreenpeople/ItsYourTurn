import { createSortable } from "@thisbeyond/solid-dnd";
import { Show } from "solid-js";
import { Card } from "../models/Card";
import { showContextMenu } from "../stores/contextMenuStore";
import { pendingSource, completeTarget, arrows } from "../stores/targetingStore";
import { isSelected, isSelectMode, getSelectedIds, clearSelection, toggleSelected } from "../stores/selectionStore";
import { isFaceDown, isHorizontal, isTapped, toggleTapped } from "../stores/cardStateStore";
import { findDeckForCard } from "../stores/deckStore";
import { gameState } from "../stores/gameStore";

export const PALETTES = [
  { top: '#2d1b4e', bot: '#0e0818', artA: '#3d1f6e', artB: '#180830', symbol: '✦' },
  { top: '#1b2d4e', bot: '#081218', artA: '#1f3d6e', artB: '#081030', symbol: '◈' },
  { top: '#4e2d1b', bot: '#1a0800', artA: '#6e3d1f', artB: '#301008', symbol: '⬡' },
  { top: '#1b4e2d', bot: '#081a0e', artA: '#1f6e3d', artB: '#083018', symbol: '❋' },
  { top: '#4e4b1b', bot: '#1a1800', artA: '#6e681f', artB: '#302800', symbol: '✧' },
  { top: '#4e1b2d', bot: '#1a0810', artA: '#6e1f3d', artB: '#300818', symbol: '⬘' },
];

export function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

// Pure visual — used in both CardComponent and DragOverlay
export const CardVisual = (props: {
  card: Card;
  tapped?: boolean;
  dragging?: boolean;
  selected?: boolean;
  faceDown?: boolean;
  horizontal?: boolean;
}) => {
  const palette = PALETTES[hashName(props.card.name) % PALETTES.length];
  return (
    <div
      class="tcg-card"
      classList={{
        "is-tapped": !!props.tapped,
        "is-dragging": !!props.dragging,
        "is-selected": !!props.selected,
        "is-facedown": !!props.faceDown,
        "tcg-card--horizontal": !!props.horizontal,
      }}
      style={{
        "--card-top": palette.top,
        "--card-bot": palette.bot,
        "--card-art-a": palette.artA,
        "--card-art-b": palette.artB,
      }}
    >
      <div class="card-inner">
        <img src={`${props.card.image}`} draggable="false" />
        <div
          class="card-footer absolute bottom-0 left-0 right-0 flex items-center justify-center border-t border-gold/18 overflow-hidden"
          style={{ padding: "2px 4px", background: "rgba(0, 0, 0, 0.82)" }}
        >
          <span
            class="font-body text-[clamp(13px,9cqw,24px)] font-semibold uppercase leading-tight text-center"
            style={{ "font-family": "var(--plugin-font-body, 'Inter', system-ui, sans-serif)", color: "var(--plugin-text-muted, #cfdbd5)", "overflow-wrap": "break-word" }}
          >
            {props.card.name}
          </span>
        </div>
      </div>
    </div>
  );
};

// Returns the player name that this card is sending an arrow TO across board boundaries, or null.
function crossPlayerOutgoing(cardId: string): string | null {
  const outgoing = arrows().find(a => a.sourceId === cardId);
  if (!outgoing) return null;
  const sourcePlayer = findDeckForCard(cardId)?.id.split(":")[0];
  const targetPlayer = findDeckForCard(outgoing.targetId)?.id.split(":")[0];
  if (!targetPlayer || targetPlayer === sourcePlayer) return null;
  return gameState.players.find(p => p.id === targetPlayer)?.name ?? targetPlayer;
}

// Returns the player name that is targeting this card from another board, or null.
function crossPlayerIncoming(cardId: string): string | null {
  const incoming = arrows().find(a => a.targetId === cardId);
  if (!incoming) return null;
  const targetPlayer = findDeckForCard(cardId)?.id.split(":")[0];
  const sourcePlayer = findDeckForCard(incoming.sourceId)?.id.split(":")[0];
  if (!sourcePlayer || sourcePlayer === targetPlayer) return null;
  return gameState.players.find(p => p.id === sourcePlayer)?.name ?? sourcePlayer;
}

// Interactive card — thin wrapper that owns drag/sort + tap state
export const CardComponent = (props: { card: Card; zoneId: string; horizontal?: boolean }) => {
  const sortable = createSortable(props.card.id, { card: props.card, zoneId: props.zoneId });
  // Zone prop (all cards in that zone are horizontal) OR per-card state from store
  const effectiveHorizontal = () => !!props.horizontal || isHorizontal(props.card.id);
  const outgoing = () => crossPlayerOutgoing(props.card.id);
  const incoming = () => crossPlayerIncoming(props.card.id);

  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0, startY = 0;
  let lastTapTime = 0, lastTapX = 0, lastTapY = 0;
  // Prevents the click that fires after a long-press from toggling selection
  let suppressNextClick = false;

  const onPointerDown = (e: PointerEvent) => {
    if (pendingSource()) return;
    startX = e.clientX;
    startY = e.clientY;
    pressTimer = setTimeout(() => {
      pressTimer = null;
      lastTapTime = 0;
      suppressNextClick = true;
      showContextMenu(startX, startY, props.card.id, props.zoneId);
    }, 600);
  };

  const cancelPress = () => {
    if (pressTimer !== null) { clearTimeout(pressTimer); pressTimer = null; }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (pressTimer && (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8)) {
      cancelPress();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    cancelPress();
    if (pendingSource()) return;
    const now = Date.now();
    const dx = Math.abs(e.clientX - lastTapX);
    const dy = Math.abs(e.clientY - lastTapY);
    if (now - lastTapTime < 300 && dx < 20 && dy < 20) {
      const selected = getSelectedIds();
      const ids = selected.size > 1 && selected.has(props.card.id)
        ? Array.from(selected)
        : [props.card.id];
      ids.forEach(id => toggleTapped(id));
      lastTapTime = 0;
    } else {
      lastTapTime = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
    }
  };

  return (
    <div
      use:sortable={sortable}
      data-card-id={props.card.id}
      class="inline-block flex-shrink-0 cursor-grab active:cursor-grabbing relative"
      style={{ "touch-action": "none" }}
      onDragStart={(e) => e.preventDefault()}
      onClick={(e) => {
        if (suppressNextClick) { suppressNextClick = false; return; }
        if (pendingSource()) { e.stopPropagation(); completeTarget(props.card.id); return; }

        // In select mode: tap toggles this card in/out of the selection
        if (isSelectMode()) {
          toggleSelected(props.card.id);
          return;
        }

        // Clicking an unselected card while a multi-selection is active clears the selection
        if (getSelectedIds().size > 1 && !isSelected(props.card.id)) clearSelection();
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={cancelPress}
      onPointerMove={onPointerMove}
      onContextMenu={(e) => {
        e.preventDefault();
        cancelPress();
        showContextMenu(e.clientX, e.clientY, props.card.id, props.zoneId);
      }}
    >
      <CardVisual
        card={props.card}
        tapped={isTapped(props.card.id)}
        dragging={sortable.isActiveDraggable}
        selected={isSelected(props.card.id)}
        faceDown={isFaceDown(props.card.id)}
        horizontal={effectiveHorizontal()}
      />
      <Show when={outgoing()}>
        <div class="absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[0.02em] whitespace-nowrap px-[5px] py-px rounded-[3px] pointer-events-none z-10 leading-[14px] bg-gold/92 text-[#1a1100] shadow-[0_1px_4px_rgba(0,0,0,0.5)]">→ {outgoing()}</div>
      </Show>
      <Show when={incoming()}>
        <div class="cross-player-badge--in absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[0.02em] whitespace-nowrap px-[5px] py-px rounded-[3px] pointer-events-none z-10 leading-[14px] bg-[rgba(210,60,60,0.92)] text-white shadow-[0_1px_4px_rgba(0,0,0,0.5)]">← {incoming()}</div>
      </Show>
    </div>
  );
};
