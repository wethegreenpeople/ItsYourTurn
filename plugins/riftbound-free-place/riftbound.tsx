import { Plugin, PlayArea, CardAction, GameBarAction } from "../base/plugin";
import type { PluginTheme } from "../base/plugin";
import { DropZone } from "../../src/App";
import { For, Show } from "solid-js";
import { DragEventHandler } from "@thisbeyond/solid-dnd";
import { SortableProvider } from "@thisbeyond/solid-dnd";
import { CardComponent } from "../../src/components/card";
import { cardsInDeck, moveCard, moveCardToTop, moveTopCard, registerDeck } from "../../src/stores/deckStore";
import { registerPlugin } from "../../src/stores/pluginStore";
import { viewingPlayerId } from "../../src/stores/boardViewStore";
import { loadRiftboundDeck } from "./deckLoader";
import { showDeckContextMenu } from "../../src/stores/deckContextMenuStore";
import { getDropPointer } from "../../src/stores/freePlaceStore";
import { getCardPos, setCardPos } from "../../src/stores/cardPositionsStore";
import { startTargeting, stopTargeting } from "../../src/stores/targetingStore";
import { startAttaching, getAttachments, getParent, detachCard, detachAll } from "../../src/stores/attachmentStore";
import { addCounter, resetCounters, getBuffs, clearBuffs } from "../../src/stores/counterStore";
import { openAddBuff } from "../../src/stores/addBuffStore";
import { findDeckForCard } from "../../src/stores/deckStore";
import { showPreview } from "../../src/stores/cardPreviewStore";
import { getSelectedIds, clearSelection } from "../../src/stores/selectionStore";
import { setFaceDown, toggleFaceDown, toggleHorizontal, toggleTapped } from "../../src/stores/cardStateStore";
import { DeckStack } from "../../src/components/DeckStack";
import { showZoneLabels } from "../../src/stores/settingsStore";
import { openGlobalSearch } from "../riftbound/globalCardSearchStore";
import { GlobalCardSearchModal } from "../riftbound/GlobalCardSearchModal";

// Renders cards freely positioned by (x%, y%), skipping cards attached to a parent.
// Each card gets its own isolated SortableProvider so createSortable has context but no
// siblings to sort against — preventing the swap-reorder animation from firing.
const FreeCards = (props: { deckId: string; zone: string; horizontal?: boolean }) => (
  <For each={cardsInDeck(props.deckId).filter(c => !getParent(c.id))}>
    {(card) => (
      <SortableProvider ids={[card.id]}>
        <div
          class="card-freeplace-wrap"
          style={{
            left: `${getCardPos(card.id)?.x ?? 15}%`,
            top: `${getCardPos(card.id)?.y ?? 20}%`,
          }}
        >
          <CardComponent card={card} zoneId={props.zone} horizontal={props.horizontal} />
        </div>
      </SortableProvider>
    )}
  </For>
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
  <div
    class="zone-inner flex flex-col h-full overflow-hidden"
    classList={{
      "p-[3px_5px] gap-[3px]": showZoneLabels(),
      "p-[2px_4px] gap-0": !showZoneLabels(),
    }}
  >
    <Show when={showZoneLabels()}>
      <span class="zone-label font-cinzel text-[clamp(9px,.8vw,13px)] font-semibold tracking-widest uppercase text-text-muted select-none leading-none">{props.label}</span>
    </Show>
    {props.children}
  </div>
);

const ZoneCards = (props: { deckId: string; zone: string; horizontal?: boolean }) => (
  <div
    class="zone-cards zone-cards--free flex flex-wrap gap-1 content-start items-start flex-1 min-h-0 p-[2px_4px_4px] overflow-y-auto overflow-x-hidden"
    classList={{ "zone-cards--empty": cardsInDeck(props.deckId).filter(c => !getParent(c.id)).length === 0 }}
  >
    <FreeCards deckId={props.deckId} zone={props.zone} horizontal={props.horizontal} />
  </div>
);

export class RiftBoundFreePlace implements Plugin {
  public id: string = "riftbound-freeplace";
  public startingScore: number = 0;
  public scoreLabel: string = "Score";

  settings = [
    {
      key: 'boardLayout',
      label: 'Board Layout',
      description: 'Arrange boards vertically (top/bottom) or side by side',
      type: 'select' as const,
      options: [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Side by Side' },
      ],
      defaultValue: 'vertical',
    },
  ];

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
      label: "Attach to...",
      action: (id) => startAttaching(id),
    },
    {
      label: "Detach",
      action: (id) => detachCard(id),
      show: (id) => !!getParent(id),
    },
    {
      label: "Detach Attachments",
      action: (id) => detachAll(id),
      show: (id) => getAttachments(id).length > 0,
    },
    {
      label: "Add",
      submenu: [
        { label: "Counter +1",      action: (id) => addCounter(id, 1) },
        { label: "Counter +5",      action: (id) => addCounter(id, 5) },
        { label: "Counter −1",      action: (id) => addCounter(id, -1) },
        { label: "Counter −5",      action: (id) => addCounter(id, -5) },
        { label: "Reset Counters",  action: (id) => resetCounters(id) },
        { label: "Buff…",           action: (id) => openAddBuff(id) },
      ],
    },
    {
      label: "Clear Buffs",
      action: (id) => clearBuffs(id),
      show: (id) => getBuffs(id).length > 0,
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

  gameBarActions: GameBarAction[] = [
    {
      label: "Card Search",
      icon: "⊕",
      action: openGlobalSearch,
    },
  ];

  renderOverlays = () => <GlobalCardSearchModal />;

  theme: PluginTheme = {
    accentColor: "#c9a84c",
    accentDim: "#7a6030",
    surfaceColor: "rgba(30, 34, 54, 0.95)",
    borderColor: "#3a3d54",
    textColor: "#e2d9c7",
    textMuted: "#c5c3d8",
    fontDisplay: "'Cinzel', Georgia, serif",
    fontBody: "'Rajdhani', system-ui, sans-serif",
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
    registerDeck(`${p}:UnplayedRunes`);
    registerDeck(`${p}:mainDeck`);
    registerDeck(`${p}:trash`);
    registerDeck(`${p}:sideboard`);
    registerDeck(`${p}:board`);
  }

  /** Returns the zone layout for a specific player, using player-scoped deck IDs. */
  createPlayerAreas(playerId: string): PlayArea[] {
    const p = playerId;
    return [
      {
        id: `${p}:board`,
        className: zoneTint.battlefield,
        region: { xStart: 1, xFinish: 13, yStart: 1, yFinish: 11 },
        content: () => (
          <DropZone id={`${p}:board`}>
            <ZoneInner label="board">
              <ZoneCards deckId={`${p}:board`} zone={`${p}:board`} />
            </ZoneInner>
          </DropZone>
        ),
      },

      {
        id: `${p}:mainDeck`,
        className: zoneTint.deck,
        region: { xStart: 1, xFinish: 3, yStart: 11, yFinish: 13 },
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
        region: { xStart: 3, xFinish: 5, yStart: 11, yFinish: 13 },
        content: () => (
          <DropZone id={`${p}:UnplayedRunes`}>
            <DeckStack
              count={cardsInDeck(`${p}:UnplayedRunes`).length}
              title="Rune Deck — click to reveal top card, right-click for options"
              onClick={() => moveTopCard(`${p}:UnplayedRunes`, `${p}:hand`)}
              onContextMenu={(e) => showDeckContextMenu(e.clientX, e.clientY, `${p}:UnplayedRunes`)}
            />
          </DropZone>
        ),
      },
      {
        id: `${p}:trash`,
        className: zoneTint.deck,
        region: { xStart: 5, xFinish: 7, yStart: 11, yFinish: 13 },
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

    let hitZoneId: string | undefined;
    for (const el of document.elementsFromPoint(px, py)) {
      const panel = (el as HTMLElement).closest?.("[data-zone]") as HTMLElement | null;
      if (panel?.dataset.zone) { hitZoneId = panel.dataset.zone; break; }
    }

    const viewedPlayer = viewingPlayerId();
    if (!hitZoneId || hitZoneId.split(":")[0] !== viewedPlayer) {
      const panels = document.querySelectorAll(`[data-zone^="${viewedPlayer}:"]`);
      for (const panel of Array.from(panels)) {
        const rect = (panel as HTMLElement).getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom) {
          hitZoneId = (panel as HTMLElement).dataset.zone;
          break;
        }
      }
    }

    const targetId = hitZoneId ?? (droppable?.id as string | undefined);
    if (!targetId) return;

    // Prefer the live zone element for rect calculation; fall back to droppable.node
    const zoneEl = (document.querySelector(`[data-zone="${targetId}"]`) as HTMLElement | null)
      ?? (droppable?.node as HTMLElement | undefined);

    const clamp = (v: number) => Math.max(2, Math.min(98, v));
    const zoneRect = zoneEl?.getBoundingClientRect();
    const relX = zoneRect ? clamp(((px - zoneRect.left) / zoneRect.width) * 100) : 50;
    const relY = zoneRect ? clamp(((py - zoneRect.top) / zoneRect.height) * 100) : 50;

    // Multi-select: move all selected cards preserving their relative positions
    const selected = getSelectedIds();
    if (selected.size > 1 && selected.has(cardId)) {
      const origin = getCardPos(cardId) ?? { x: 15, y: 20 };
      const dx = relX - origin.x;
      const dy = relY - origin.y;
      selected.forEach(id => {
        const pos = getCardPos(id) ?? { x: 15, y: 20 };
        moveCard(id, targetId);
        setCardPos(id, clamp(pos.x + dx), clamp(pos.y + dy));
        // Move attachments with each selected card
        getAttachments(id).forEach(attachedId => {
          moveCard(attachedId, targetId);
          setCardPos(attachedId, clamp(pos.x + dx), clamp(pos.y + dy));
        });
      });
      clearSelection();
      return;
    }

    if (zoneRect) {
      moveCard(cardId, targetId);
      setCardPos(cardId, relX, relY);
    } else {
      moveCard(cardId, targetId);
    }

    // Move all attachments to same zone and position as the parent
    getAttachments(cardId).forEach(attachedId => {
      moveCard(attachedId, targetId);
      if (zoneRect) setCardPos(attachedId, relX, relY);
    });
  };
}
