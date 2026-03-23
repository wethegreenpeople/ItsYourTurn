import { Plugin, PlayArea, CardAction } from "../base/plugin";
import type { PluginTheme } from "../base/plugin";
import { DropZone } from "../../src/App";
import { For, Show } from "solid-js";
import { DragEventHandler } from "@thisbeyond/solid-dnd";
import { SortableProvider } from "@thisbeyond/solid-dnd";
import { CardComponent } from "../../src/components/card";
import { cardsInDeck, moveCard, moveCardAt, moveCardToTop, moveTopCard, registerDeck } from "../../src/stores/deckStore";
import type { Card } from "../../src/models/Card";
import { registerPlugin } from "../../src/stores/pluginStore";
import { viewingPlayerId } from "../../src/stores/boardViewStore";
import { loadRiftboundDeck } from "./deckLoader";
import { showDeckContextMenu } from "../../src/stores/deckContextMenuStore";
import { freePlaceMode, getDropPointer } from "../../src/stores/freePlaceStore";
import { getCardPos, setCardPos } from "../../src/stores/cardPositionsStore";
import { startTargeting, stopTargeting } from "../../src/stores/targetingStore";
import { findDeckForCard } from "../../src/stores/deckStore";
import { showPreview } from "../../src/stores/cardPreviewStore";
import { getSelectedIds, clearSelection } from "../../src/stores/selectionStore";
import { setFaceDown, toggleFaceDown, toggleHorizontal, toggleTapped } from "../../src/stores/cardStateStore";
import { DeckStack } from "../../src/components/DeckStack";

// Renders cards in sortable snap layout
const SnapCards = (props: { deckId: string; zone: string; horizontal?: boolean }) => (
  <SortableProvider ids={cardsInDeck(props.deckId).map(c => c.id)}>
    <For each={cardsInDeck(props.deckId)}>
      {(card) => <CardComponent card={card} zoneId={props.zone} horizontal={props.horizontal} />}
    </For>
  </SortableProvider>
);

// Renders cards freely positioned by (x%, y%) stored in cardPositionsStore.
// SortableProvider is required so createSortable has context and cards remain draggable.
const FreeCards = (props: { deckId: string; zone: string; horizontal?: boolean }) => (
  <SortableProvider ids={cardsInDeck(props.deckId).map(c => c.id)}>
    <For each={cardsInDeck(props.deckId)}>
      {(card) => (
        <div
          class="card-freeplace-wrap"
          style={{
            left: `${getCardPos(card.id)?.x ?? 15}%`,
            top: `${getCardPos(card.id)?.y ?? 20}%`,
          }}
        >
          <CardComponent card={card} zoneId={props.zone} horizontal={props.horizontal} />
        </div>
      )}
    </For>
  </SortableProvider>
);

// Zone tint classes — Tailwind instead of CSS
const zoneTint = {
  battlefield: "bg-surface/97 border-rim shadow-[inset_0_1px_0_rgba(245,203,92,.08)]",
  base:        "bg-[rgba(35,35,39,.95)] border-rim shadow-[inset_0_1px_0_rgba(255,255,255,.04)]",
  runes:       "bg-surface/97 border-rim shadow-[inset_0_1px_0_rgba(245,203,92,.1)]",
  deck:        "bg-base/99 border-raised shadow-[inset_0_1px_0_rgba(245,203,92,.12)]",
};

// Zone inner container
const ZoneInner = (props: { label: string; children: any }) => (
  <div class="zone-inner flex flex-col h-full p-[3px_5px] gap-[3px] overflow-hidden">
    <span class="zone-label font-cinzel text-[clamp(9px,.8vw,13px)] font-semibold tracking-widest uppercase text-text-muted select-none leading-none">{props.label}</span>
    {props.children}
  </div>
);

// Zone cards area that switches between snap and free-place based on global toggle
const ZoneCards = (props: { deckId: string; zone: string; horizontal?: boolean }) => (
  <div
    class="zone-cards flex flex-wrap gap-1 content-start items-start flex-1 min-h-0 p-[2px_4px_4px] overflow-y-auto overflow-x-hidden"
    classList={{
      "zone-cards--free": freePlaceMode(),
      "zone-cards--empty": cardsInDeck(props.deckId).length === 0,
    }}
  >
    <Show when={freePlaceMode()} fallback={<SnapCards deckId={props.deckId} zone={props.zone} horizontal={props.horizontal} />}>
      <FreeCards deckId={props.deckId} zone={props.zone} horizontal={props.horizontal} />
    </Show>
  </div>
);

export class RiftBound implements Plugin {
  public id: string = "riftbound";
  public startingScore: number = 0;
  public scoreLabel: string = "Score";

  cardActions: CardAction[] = [
    {
      label: "Inspect",
      action: (id) => {
        const card = findDeckForCard(id)?.cards.find(c => c.id === id);
        const el = document.querySelector(`[data-card-id="${id}"]`);
        if (!card || !el) return;
        const r = el.getBoundingClientRect();
        showPreview(card, r.right + 12, r.top + r.height / 2);
      },
    },
    {
      label: "Target",
      action: (id) => startTargeting(id),
    },
    {
      label: "Stop Targeting",
      action: (id) => stopTargeting(id)
    },
    {
      label: "Tap / Untap",
      action: (id) => toggleTapped(id),
    },
    {
      label: "Play Hidden",
      action: (id, zoneId) => {
        setFaceDown(id, true);
        moveCard(id, `${zoneId.split(':')[0]}:base`);
      },
    },
    {
      label: "Flip",
      action: (id) => toggleFaceDown(id),
    },
    {
      label: "Toggle Horizontal",
      action: (id) => toggleHorizontal(id),
    },
    {
      label: "Send to Hand",
      action: (id, zoneId) => moveCard(id, `${zoneId.split(':')[0]}:hand`),
    },
    {
      label: "Send to Top of Deck",
      action: (id, zoneId) => moveCardToTop(id, `${zoneId.split(':')[0]}:mainDeck`),
    },
    {
      label: "Send to Bottom of Deck",
      action: (id, zoneId) => moveCard(id, `${zoneId.split(':')[0]}:mainDeck`),
    },
    {
      label: "Play as Rune",
      action: (id, zoneId) => moveCard(id, `${zoneId.split(':')[0]}:PlayedRunes`),
    },
    {
      label: "Return to Rune Deck",
      action: (id, zoneId) => moveCard(id, `${zoneId.split(':')[0]}:UnplayedRunes`),
    },
    {
      label: "Send to Sideboard",
      action: (id, zoneId) => moveCard(id, `${zoneId.split(':')[0]}:sideboard`),
    },
    {
      label: "Trash",
      action: (id, zoneId) => moveCard(id, `${zoneId.split(':')[0]}:trash`),
    },
  ];

  theme: PluginTheme = {
    accentColor: "#c9a84c",
    accentDim: "#7a6030",
    surfaceColor: "rgba(30, 34, 54, 0.95)",
    borderColor: "#3a3d54",
    textColor: "#e2d9c7",
    textMuted: "#c5c3d8",
    fontDisplay: "'Cinzel', Georgia, serif",
    fontBody: "'Rajdhani', system-ui, sans-serif",
    gridColumnsTemplate: "minmax(52px, 1fr) repeat(10, 1fr) minmax(52px, 1fr)",
    gridRowsTemplate: "repeat(6, 1fr) 1.4fr 1.4fr",
  };

  /** Only registers the plugin — no deck creation here. */
  register(): void {
    registerPlugin(this);
  }

  loadDeck(text: string, playerId: string) {
    return loadRiftboundDeck(text, playerId);
  }

  /** Creates all decks for a single player, scoped by playerId. */
  registerPlayer(playerId: string): void {
    const p = playerId;
    registerDeck(`${p}:hand`);
    registerDeck(`${p}:battlefield`);
    registerDeck(`${p}:base`);
    registerDeck(`${p}:UnplayedRunes`);
    registerDeck(`${p}:PlayedRunes`);
    registerDeck(`${p}:mainDeck`);
    registerDeck(`${p}:trash`);
    registerDeck(`${p}:champion`);
    registerDeck(`${p}:legend`);
    registerDeck(`${p}:sideboard`);
  }

  /** Returns the zone layout for a specific player, using player-scoped deck IDs. */
  createPlayerAreas(playerId: string): PlayArea[] {
    const p = playerId;
    return [
      {
        id: `${p}:battlefield`,
        className: zoneTint.battlefield,
        region: { xStart: 1, xFinish: 11, yStart: 1, yFinish: 4 },
        content: () => (
          <DropZone id={`${p}:battlefield`}>
            <ZoneInner label="Battlefield">
              <ZoneCards deckId={`${p}:battlefield`} zone={`${p}:battlefield`} />
            </ZoneInner>
          </DropZone>
        ),
      },
      {
        id: `${p}:legend`,
        className: zoneTint.battlefield,
        region: { xStart: 11, xFinish: 12, yStart: 1, yFinish: 4 },
        content: () => (
          <DropZone id={`${p}:legend`}>
            <ZoneInner label="Legend">
              <ZoneCards deckId={`${p}:legend`} zone={`${p}:legend`} />
            </ZoneInner>
          </DropZone>
        ),
      },
      {
        id: `${p}:champion`,
        className: zoneTint.battlefield,
        region: { xStart: 12, xFinish: 13, yStart: 1, yFinish: 4 },
        content: () => (
          <DropZone id={`${p}:champion`}>
            <ZoneInner label="Champion">
              <ZoneCards deckId={`${p}:champion`} zone={`${p}:champion`} />
            </ZoneInner>
          </DropZone>
        ),
      },
      {
        id: `${p}:base`,
        className: zoneTint.base,
        region: { xStart: 1, xFinish: 12, yStart: 4, yFinish: 7 },
        content: () => (
          <DropZone id={`${p}:base`}>
            <ZoneInner label="Base">
              <ZoneCards deckId={`${p}:base`} zone={`${p}:base`} />
            </ZoneInner>
          </DropZone>
        ),
      },
      {
        id: `${p}:mainDeck`,
        className: zoneTint.deck,
        region: { xStart: 12, xFinish: 13, yStart: 4, yFinish: 7 },
        content: () => (
          <DropZone id={`${p}:mainDeck`}>
            <DeckStack
              count={cardsInDeck(`${p}:mainDeck`).length}
              title="Main Deck — click to draw, right-click for options"
              onClick={() => moveTopCard(`${p}:mainDeck`, `${p}:hand`)}
              onContextMenu={(e) => showDeckContextMenu(e.clientX, e.clientY, `${p}:mainDeck`)}
            />
          </DropZone>
        ),
      },
      {
        id: `${p}:UnplayedRunes`,
        className: zoneTint.deck,
        region: { xStart: 1, xFinish: 2, yStart: 7, yFinish: 9 },
        content: () => (
          <DropZone id={`${p}:UnplayedRunes`}>
            <DeckStack
              count={cardsInDeck(`${p}:UnplayedRunes`).length}
              title="Rune Deck — click to reveal top card, right-click for options"
              onClick={() => moveTopCard(`${p}:UnplayedRunes`, `${p}:PlayedRunes`)}
              onContextMenu={(e) => showDeckContextMenu(e.clientX, e.clientY, `${p}:UnplayedRunes`)}
            />
          </DropZone>
        ),
      },
      {
        id: `${p}:PlayedRunes`,
        className: zoneTint.runes,
        region: { xStart: 2, xFinish: 12, yStart: 7, yFinish: 9 },
        content: () => (
          <DropZone id={`${p}:PlayedRunes`}>
            <ZoneInner label="Runes">
              <ZoneCards deckId={`${p}:PlayedRunes`} zone={`${p}:PlayedRunes`} />
            </ZoneInner>
          </DropZone>
        ),
      },
      {
        id: `${p}:trash`,
        className: zoneTint.deck,
        region: { xStart: 12, xFinish: 13, yStart: 7, yFinish: 9 },
        content: () => (
          <DropZone id={`${p}:trash`}>
            <DeckStack
              count={cardsInDeck(`${p}:trash`).length}
              title="Trash — click to take top card to hand, right-click for options"
              onClick={() => moveTopCard(`${p}:trash`, `${p}:hand`)}
              onContextMenu={(e) => showDeckContextMenu(e.clientX, e.clientY, `${p}:trash`)}
            />
          </DropZone>
        ),
      },
    ];
  }

  onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (!draggable) return;

    const cardId = draggable.id as string;
    const { x: px, y: py } = getDropPointer();

    // solid-dnd caches droppable rects at drag-start, so zones that were
    // hidden (display:none) when the drag began — e.g. the opponent's board on
    // mobile — are never detected even after the board switches mid-drag.
    // Strategy:
    // 1. Hit-test with elementsFromPoint + .closest("[data-zone]") traversal so
    //    we find the zone even when the pointer is over a nested child element.
    // 2. If that yields no zone, or the zone belongs to the wrong player,
    //    scan every zone panel of the currently-viewed player by bounding rect.
    //    This handles the case where the pointer is still at the screen edge
    //    (where the board-switch triggered) rather than over a specific zone.
    let hitZoneId: string | undefined;
    for (const el of document.elementsFromPoint(px, py)) {
      const panel = (el as HTMLElement).closest?.("[data-zone]") as HTMLElement | null;
      if (panel?.dataset.zone) { hitZoneId = panel.dataset.zone; break; }
    }

    const viewedPlayer = viewingPlayerId();
    if (!hitZoneId || hitZoneId.split(":")[0] !== viewedPlayer) {
      // Rect-scan fallback: find whichever visible zone of the viewed player
      // contains the pointer.
      const panels = document.querySelectorAll(`[data-zone^="${viewedPlayer}:"]`);
      for (const panel of Array.from(panels)) {
        const rect = (panel as HTMLElement).getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue; // hidden
        if (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom) {
          hitZoneId = (panel as HTMLElement).dataset.zone;
          break;
        }
      }
    }

    const targetId = hitZoneId ?? (droppable?.id as string | undefined);
    if (!targetId) return;

    const targetData = droppable?.data as { card?: Card; zoneId?: string } | null;

    // Multi-select: move all selected cards to the target zone
    const selected = getSelectedIds();
    if (selected.size > 1 && selected.has(cardId)) {
      selected.forEach(id => moveCard(id, targetId));
      clearSelection();
      return;
    }

    if (freePlaceMode()) {
      // Prefer the live zone element for rect calculation; fall back to droppable.node
      const zoneEl = (document.querySelector(`[data-zone="${targetId}"]`) as HTMLElement | null)
        ?? (droppable?.node as HTMLElement | undefined);
      if (zoneEl) {
        const zoneRect = zoneEl.getBoundingClientRect();
        const relX = Math.max(5, Math.min(90, ((px - zoneRect.left) / zoneRect.width) * 100));
        const relY = Math.max(5, Math.min(90, ((py - zoneRect.top) / zoneRect.height) * 100));
        moveCard(cardId, targetId);
        setCardPos(cardId, relX, relY);
      } else {
        moveCard(cardId, targetId);
      }
    } else {
      if (targetData?.card && targetData?.zoneId) {
        moveCardAt(cardId, targetData.zoneId, targetId);
      } else {
        moveCard(cardId, targetId);
      }
    }
  };

  // Lifecycle hooks — RiftBound uses these as extension points.
  // onGameStart, onTurnStart, onTurnEnd, onCardMoved are all optional.
  // Add game-specific reactions here (e.g., auto-draw on turn start).
}
