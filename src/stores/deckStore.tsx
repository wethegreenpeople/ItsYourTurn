import { Card } from "../models/Card";
import { Deck } from "../models/Deck";
import { getActivePlugin } from "./pluginStore";

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
    if (card) {
      targetDeck.addCard(card);
      getActivePlugin()?.onCardMoved?.(cardId, sourceDeck.id, targetDeckId);
    }
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

/** Move the first card (top) of fromDeck to the end of toDeck. */
export function moveTopCard(fromDeckId: string, toDeckId: string) {
  const fromDeck = getDeck(fromDeckId);
  const toDeck = getDeck(toDeckId);
  if (!fromDeck || !toDeck || fromDeck.cards.length === 0) return;
  const card = fromDeck.removeCard(fromDeck.cards[0].id);
  if (card) toDeck.addCard(card);
}

/** Move a card to the front (top) of a deck. */
export function moveCardToTop(cardId: string, toDeckId: string) {
  const sourceDeck = findDeckForCard(cardId);
  const targetDeck = getDeck(toDeckId);
  if (!sourceDeck || !targetDeck) return;
  const card = sourceDeck.removeCard(cardId);
  if (card) targetDeck.insertCard(card, targetDeck.cards[0]?.id);
}
