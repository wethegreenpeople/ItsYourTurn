import { createStore } from "solid-js/store";
import { Card } from "./Card";

export class Deck {
  id: string;
  cards: Card[];
  private setCards: ReturnType<typeof createStore<Card[]>>[1];

  constructor(id: string) {
    this.id = id;
    const [cards, setCards] = createStore<Card[]>([]);
    this.cards = cards;
    this.setCards = setCards;
  }

  addCard(card: Card) {
    this.setCards([...this.cards, card]);
  }

  removeCard(cardId: string): Card | undefined {
    const card = this.cards.find(c => c.id === cardId);
    if (card) {
      this.setCards(this.cards.filter(c => c.id !== cardId));
    }
    return card;
  }
}
