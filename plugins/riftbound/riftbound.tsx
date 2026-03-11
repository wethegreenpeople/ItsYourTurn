import { Plugin, PlayArea } from "../base/plugin";
import { DropZone } from "../../src/App";
import { For } from "solid-js";
import { DragEventHandler } from "@thisbeyond/solid-dnd";
import { CardComponent } from "../../src/components/card";
import { cardsInDeck, getDeck, moveCard, registerDeck } from "../../src/stores/deckStore";
import { Deck } from "../../src/models/Deck";
import { Card } from "../../src/models/Card";
import { registerPlugin } from "../../src/stores/pluginStore";

export class RiftBound implements Plugin {
  public id: string = "riftbound";

  register(): void {
    registerPlugin(this);

    const hand = new Deck("hand");
    registerDeck(hand);
    registerDeck(new Deck("battlefield"));
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
              <For each={cardsInDeck("battlefield")}>
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
      id: "UnplayedRunes",
      region: {
        xStart: 1,
        xFinish: 2,
        yStart: 7,
        yFinish: 9
      },
      content: () => (
        <DropZone id="UnplayedRunes">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Rune Deck</p>
            <div class="flex flex-wrap gap-2">
              <For each={cardsInDeck("UnplayedRunes")}>
                {(card) => <CardComponent card={card} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    },
    {
      id: "PlayedRunes",
      region: {
        xStart: 2,
        xFinish: 12,
        yStart: 7,
        yFinish: 9
      },
      content: () => (
        <DropZone id="PlayedRunes">
          <div class="flex h-full flex-col gap-2 p-2">
            <p class="text-xs text-gray-400">Runes</p>
            <div class="flex flex-wrap gap-2">
              <For each={cardsInDeck("PlayedRunes")}>
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
              <For each={cardsInDeck("mainDeck")}>
                {(card) => <CardComponent card={card} />}
              </For>
            </div>
          </div>
        </DropZone>
      )
    }
  ];

  onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (draggable && droppable) {
      moveCard(draggable.id as string, droppable.id as string);
    }
  };
}
