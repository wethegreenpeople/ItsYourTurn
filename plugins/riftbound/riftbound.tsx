import { Plugin, PlayArea } from "../base/plugin";
import type { PluginTheme } from "../base/plugin";
import { DropZone } from "../../src/App";
import { For } from "solid-js";
import { DragEventHandler } from "@thisbeyond/solid-dnd";
import { SortableProvider } from "@thisbeyond/solid-dnd";
import { CardComponent } from "../../src/components/card";
import { cardsInDeck, moveCard, moveCardAt, registerDeck } from "../../src/stores/deckStore";
import { Deck } from "../../src/models/Deck";
import { Card } from "../../src/models/Card";
import { registerPlugin } from "../../src/stores/pluginStore";

export class RiftBound implements Plugin {
  public id: string = "riftbound";

  theme: PluginTheme = {
    accentColor: "#c9a84c",
    accentDim: "#7a6030",
    surfaceColor: "rgba(30, 34, 54, 0.95)",
    borderColor: "#3a3d54",
    textColor: "#e2d9c7",
    textMuted: "#c5c3d8",
    fontDisplay: "'Cinzel', Georgia, serif",
    fontBody: "'Rajdhani', system-ui, sans-serif",
    // Ensures narrow deck columns (1 and 12) have minimum width on mobile
    gridColumnsTemplate: "minmax(52px, 1fr) repeat(10, 1fr) minmax(52px, 1fr)",
  };

  register(): void {
    registerPlugin(this);

    const hand = new Deck("hand");
    registerDeck(hand);
    registerDeck(new Deck("battlefield"));
    registerDeck(new Deck("base"));
    registerDeck(new Deck("UnplayedRunes"));
    registerDeck(new Deck("PlayedRunes"));
    registerDeck(new Deck("mainDeck"));

    hand.addCard(new Card("Draven"));
    hand.addCard(new Card("Yasuo"));
    hand.addCard(new Card("Ahri"));
  }

  playAreas: PlayArea[] = [
    {
      id: "battlefield",
      className: "zone-battlefield",
      region: { xStart: 1, xFinish: 13, yStart: 1, yFinish: 4 },
      content: () => (
        <DropZone id="battlefield">
          <div class="zone-inner">
            <span class="zone-label">Battlefield</span>
            <div class="zone-cards">
              <SortableProvider ids={cardsInDeck("battlefield").map(c => c.id)}>
                <For each={cardsInDeck("battlefield")}>
                  {(card) => <CardComponent card={card} zoneId="battlefield" />}
                </For>
              </SortableProvider>
            </div>
          </div>
        </DropZone>
      ),
    },
    {
      id: "base",
      className: "zone-base",
      region: { xStart: 1, xFinish: 13, yStart: 4, yFinish: 7 },
      content: () => (
        <DropZone id="base">
          <div class="zone-inner">
            <span class="zone-label">Base</span>
            <div class="zone-cards">
              <SortableProvider ids={cardsInDeck("base").map(c => c.id)}>
                <For each={cardsInDeck("base")}>
                  {(card) => <CardComponent card={card} zoneId="base" />}
                </For>
              </SortableProvider>
            </div>
          </div>
        </DropZone>
      ),
    },
    {
      id: "UnplayedRunes",
      className: "zone-deck",
      region: { xStart: 1, xFinish: 2, yStart: 7, yFinish: 9 },
      content: () => (
        <DropZone id="UnplayedRunes">
          <div class="deck-zone">
            <div class="deck-stack-wrap">
              <div class="deck-card-back" />
              <div class="deck-card-back" />
              <div class="deck-card-back" />
            </div>
            <span class="deck-count">{cardsInDeck("UnplayedRunes").length}</span>
            <span class="zone-label" style={{ "text-align": "center", "line-height": "1.2" }}>Rune{"\n"}Deck</span>
          </div>
        </DropZone>
      ),
    },
    {
      id: "PlayedRunes",
      className: "zone-runes",
      region: { xStart: 2, xFinish: 12, yStart: 7, yFinish: 9 },
      content: () => (
        <DropZone id="PlayedRunes">
          <div class="zone-inner">
            <span class="zone-label">Runes</span>
            <div class="zone-cards">
              <SortableProvider ids={cardsInDeck("PlayedRunes").map(c => c.id)}>
                <For each={cardsInDeck("PlayedRunes")}>
                  {(card) => <CardComponent card={card} zoneId="PlayedRunes" />}
                </For>
              </SortableProvider>
            </div>
          </div>
        </DropZone>
      ),
    },
    {
      id: "mainDeck",
      className: "zone-deck",
      region: { xStart: 12, xFinish: 13, yStart: 7, yFinish: 9 },
      content: () => (
        <DropZone id="mainDeck">
          <div class="deck-zone">
            <div class="deck-stack-wrap">
              <div class="deck-card-back" />
              <div class="deck-card-back" />
              <div class="deck-card-back" />
            </div>
            <span class="deck-count">{cardsInDeck("mainDeck").length}</span>
            <span class="zone-label" style={{ "text-align": "center", "line-height": "1.2" }}>Deck</span>
          </div>
        </DropZone>
      ),
    },
  ];

  onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;

    const targetId = droppable.id as string;
    const targetData = droppable.data as { card?: Card; zoneId?: string } | null;

    if (targetData?.card && targetData?.zoneId) {
      // Dropped on another card — insert before it in the target zone
      moveCardAt(draggable.id as string, targetData.zoneId, targetId);
    } else {
      // Dropped on a zone — append to end
      moveCard(draggable.id as string, targetId);
    }
  };
}
