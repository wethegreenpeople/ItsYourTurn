import { Card } from "../models/Card";
import { Deck } from "../models/Deck";

export const Decks: Deck[] = [];

export function registerDeck(deck: Deck) {
  console.log("hallo");
  console.log(JSON.stringify(Decks));
  Decks.push(deck);
}

export function getDeck(id: string): Deck | undefined {
  return Decks.find((d) => d.id === id);
}

export function cardsInDeck(deckId: string): Card[] {
  return getDeck(deckId)?.cards ?? [];
}

export function findDeckForCard(cardId: string): Deck | undefined {
  return Decks.find((d) => d.cards.some((c) => c.id === cardId));
}

export function moveCard(cardId: string, targetDeckId: string) {
  const sourceDeck = findDeckForCard(cardId);
  const targetDeck = getDeck(targetDeckId);
  if (sourceDeck && targetDeck) {
    const card = sourceDeck.removeCard(cardId);
    if (card) targetDeck.addCard(card);
  }
}

export function moveCardAt(cardId: string, targetDeckId: string, beforeCardId?: string) {
  const sourceDeck = findDeckForCard(cardId);
  const targetDeck = getDeck(targetDeckId);
  if (sourceDeck && targetDeck) {
    const card = sourceDeck.removeCard(cardId);
    if (card) targetDeck.insertCard(card, beforeCardId);
  }
}
