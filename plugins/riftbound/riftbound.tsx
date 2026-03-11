import { Plugin, PlayArea } from "../base/plugin";
import { registerPlugin } from "../store";
import { DropZone } from "../../src/App";
import { For } from "solid-js";
import { createStore } from "solid-js/store";
import { DragEventHandler } from "@thisbeyond/solid-dnd";
import { CardComponent } from "../../src/components/card";

export class RiftBound implements Plugin {
  register(): void {
    registerPlugin(this);
  }
  playAreas: PlayArea[] = [
    {
      id: "battlefield",
      region: {
        xStart: 1,
        xFinish: 13,
        yStart: 1,
        yFinish: 4
      },
      content: () => (
        <DropZone id="battlefield">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Battlefield</p>
            <div class="flex flex-wrap gap-2">
              <For each={this.cardsIn("battlefield")}>
                {(card) => <CardComponent id={card.id} name={card.name} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    },
    {
      id: "fff",
      region: {
        xStart: 6,
        xFinish: 8,
        yStart: 1,
        yFinish: 2
      },
      content: () => (
        <DropZone id="fff">
          <div class="flex h-full flex-col gap-2 p-2">
            <div class="flex flex-wrap gap-2">
              <For each={this.cardsIn("fff")}>
                {(card) => <CardComponent card={card} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    },
    {
      id: "base",
      region: {
        xStart: 1,
        xFinish: 13,
        yStart: 4,
        yFinish: 7
      },
      content: () => (
        <div class="flex h-full flex-col gap-2 p-2">
          <p class="text-xs text-gray-400">Base (static)</p>
          <p class="text-sm">No drag/drop in this panel.</p>
        </div>
      )
    },
    {
      id: "runeDeck",
      region: {
        xStart: 1,
        xFinish: 2,
        yStart: 7,
        yFinish: 9
      },
      content: () => (
        <DropZone id="runeDeck">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Rune Deck</p>
            <div class="flex flex-wrap gap-2">
              <For each={this.cardsIn("runeDeck")}>
                {(card) => <CardComponent card={card} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    },
    {
      id: "runes",
      region: {
        xStart: 2,
        xFinish: 12,
        yStart: 7,
        yFinish: 9
      },
      content: () => (
        <DropZone id="runes">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Runes</p>
            <div class="flex flex-wrap gap-2">
              <For each={this.cardsIn("runes")}>
                {(card) => <CardComponent card={card} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    },
    {
      id: "mainDeck",
      region: {
        xStart: 12,
        xFinish: 13,
        yStart: 7,
        yFinish: 9
      },
      content: () => (
        <DropZone id="mainDeck">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Deck</p>
            <div class="flex flex-wrap gap-2">
              <For each={this.cardsIn("mainDeck")}>
                {(card) => <CardComponent id={card.id} name={card.name} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    }
  ]

  private cards: CardData[];
  private setCards: ReturnType<typeof createStore<CardData[]>>[1];
  public id: string = "riftbound";

  constructor() {
    const [cards, setCards] = createStore<CardData[]>([
      { id: 1, name: "Draven",   zone: "hand" },
      { id: 2, name: "Yasuo",     zone: "hand" },
      { id: 3, name: "Ahri",  zone: "hand" },
    ]);
    this.cards = cards;
    this.setCards = setCards;
  }

  private cardsIn(zone: string): CardData[] {
    return this.cards.filter((c) => c.zone === zone);
  }

  onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (draggable && droppable) {
      const cardId = draggable.id as number;
      const targetZone = droppable.id as string;
      this.setCards((c) => c.id === cardId, "zone", targetZone);
    }
  };
}
