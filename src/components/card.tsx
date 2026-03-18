import { createSortable } from "@thisbeyond/solid-dnd";
import { createSignal } from "solid-js";
import { Card } from "../models/Card";
import { showContextMenu } from "../stores/contextMenuStore";
import { pendingSource, completeTarget } from "../stores/targetingStore";

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
export const CardVisual = (props: { card: Card; tapped?: boolean; dragging?: boolean }) => {
  const palette = PALETTES[hashName(props.card.name) % PALETTES.length];
  return (
    <div
      class="tcg-card"
      classList={{
        "is-tapped": !!props.tapped,
        "is-dragging": !!props.dragging,
      }}
      style={{
        "--card-top": palette.top,
        "--card-bot": palette.bot,
        "--card-art-a": palette.artA,
        "--card-art-b": palette.artB,
      }}
    >
      <div class="card-inner">
        <img src={`${props.card.image}`}></img>
        <div class="card-footer">
          <span class="card-type">{props.card.name}</span>
        </div>
      </div>
    </div>
  );
};

// Interactive card — thin wrapper that owns drag/sort + tap state
export const CardComponent = (props: { card: Card; zoneId: string }) => {
  const sortable = createSortable(props.card.id, { card: props.card, zoneId: props.zoneId });
  const [tapped, setTapped] = createSignal(false);

  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0, startY = 0;

  const onPointerDown = (e: PointerEvent) => {
    if (pendingSource()) return; // don't start long-press while targeting
    startX = e.clientX;
    startY = e.clientY;
    pressTimer = setTimeout(() => {
      pressTimer = null;
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

  return (
    <div
      use:sortable={sortable}
      data-card-id={props.card.id}
      class="card-drag-wrapper"
      style={{ "touch-action": "none" }}
      onClick={(e) => { if (pendingSource()) { e.stopPropagation(); completeTarget(props.card.id); } }}
      onPointerDown={onPointerDown}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerMove={onPointerMove}
      onDblClick={() => setTapped(t => !t)}
      onContextMenu={(e) => {
        e.preventDefault();
        cancelPress();
        showContextMenu(e.clientX, e.clientY, props.card.id, props.zoneId);
      }}
    >
      <CardVisual
        card={props.card}
        tapped={tapped()}
        dragging={sortable.isActiveDraggable}
      />
    </div>
  );
};
