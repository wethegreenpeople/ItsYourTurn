import { Plugin, PlayArea } from "../base/plugin";
import { registerPlugin } from "../store";
import { DropZone, Card } from "../../src/App";
import { For } from "solid-js";
import { createStore } from "solid-js/store";
import { DragEventHandler } from "@thisbeyond/solid-dnd";

type CardData = { id: number; name: string; zone: string };
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
        yFinish: 7
      },
      content: () => (
        <DropZone id="battlefield">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Battlefield</p>
            <div class="flex flex-wrap gap-2">
              <For each={this.cardsIn("battlefield")}>
                {(card) => <Card id={card.id} name={card.name} />}
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
        xFinish: 7,
        yStart: 7,
        yFinish: 13
      },
      content: () => (
        <div class="flex h-full flex-col gap-2 p-2">
          <p class="text-xs text-gray-400">Base (static)</p>
          <p class="text-sm">No drag/drop in this panel.</p>
        </div>
      )
    },
    {
      id: "hand",
      region: {
        xStart: 7,
        xFinish: 13,
        yStart: 7,
        yFinish: 13
      },
      content: () => (
        <DropZone id="hand">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Hand</p>
            <div class="flex flex-wrap gap-2">
              <For each={this.cardsIn("hand")}>
                {(card) => <Card id={card.id} name={card.name} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    }
  ]

  private cards: CardData[];
  private setCards: ReturnType<typeof createStore<CardData[]>>[1];

  constructor() {
    const [cards, setCards] = createStore<CardData[]>([]);
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
