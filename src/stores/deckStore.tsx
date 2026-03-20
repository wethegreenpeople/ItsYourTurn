import type { Card } from "../models/Card";
import { broadcastGameState } from "../utils/socket";
import { gameState, setGameState } from "./gameStore";
import { getActivePlugin } from "./pluginStore";

/** Register a new empty deck in the game state. */
export function registerDeck(id: string) {
  if (gameState.decks.some((d) => d.id === id)) return;
  setGameState("decks", gameState.decks.length, { id, cards: [] });
  broadcastGameState();
}

function deckIndex(id: string): number {
  return gameState.decks.findIndex((d) => d.id === id);
}

export function getDeck(id: string) {
  return gameState.decks.find((d) => d.id === id);
}

export function cardsInDeck(deckId: string): Card[] {
  return getDeck(deckId)?.cards ?? [];
}

export function findDeckForCard(cardId: string) {
  return gameState.decks.find((d) => d.cards.some((c) => c.id === cardId));
}

export function addCardToDeck(deckId: string, card: Card) {
  const idx = deckIndex(deckId);
  if (idx === -1) return;
  setGameState("decks", idx, "cards", (cards) => [...cards, card]);
  broadcastGameState();
}

export function insertCardInDeck(deckId: string, card: Card, beforeCardId?: string) {
  const idx = deckIndex(deckId);
  if (idx === -1) return;
  if (!beforeCardId) {
    addCardToDeck(deckId, card);
    return;
  }
  setGameState("decks", idx, "cards", (cards) => {
    const pos = cards.findIndex((c) => c.id === beforeCardId);
    if (pos === -1) return [...cards, card];
    const next = [...cards];
    next.splice(pos, 0, card);
    return next;
  });
  broadcastGameState();
}

function removeCardFromDeck(deckIdx: number, cardId: string): Card | undefined {
  const deck = gameState.decks[deckIdx];
  const card = deck.cards.find((c) => c.id === cardId);
  if (!card) return undefined;
  setGameState("decks", deckIdx, "cards", (cards) => cards.filter((c) => c.id !== cardId));
  return { ...card }; // return a plain copy
}

export function moveCard(cardId: string, targetDeckId: string) {
  const sourceIdx = gameState.decks.findIndex((d) => d.cards.some((c) => c.id === cardId));
  const targetIdx = deckIndex(targetDeckId);
  if (sourceIdx === -1 || targetIdx === -1) return;
  const sourceDeckId = gameState.decks[sourceIdx].id;
  const card = removeCardFromDeck(sourceIdx, cardId);
  if (!card) return;
  setGameState("decks", targetIdx, "cards", (cards) => [...cards, card]);
  getActivePlugin()?.onCardMoved?.(cardId, sourceDeckId, targetDeckId);
  broadcastGameState();
}

export function moveCardAt(cardId: string, targetDeckId: string, beforeCardId?: string) {
  const sourceIdx = gameState.decks.findIndex((d) => d.cards.some((c) => c.id === cardId));
  const targetIdx = deckIndex(targetDeckId);
  if (sourceIdx === -1 || targetIdx === -1) return;
  const card = removeCardFromDeck(sourceIdx, cardId);
  if (!card) return;
  setGameState("decks", targetIdx, "cards", (cards) => {
    if (!beforeCardId) return [...cards, card];
    const pos = cards.findIndex((c) => c.id === beforeCardId);
    if (pos === -1) return [...cards, card];
    const next = [...cards];
    next.splice(pos, 0, card);
    return next;
  });
  broadcastGameState();
}

export function moveTopCard(fromDeckId: string, toDeckId: string) {
  const fromIdx = deckIndex(fromDeckId);
  const toIdx = deckIndex(toDeckId);
  if (fromIdx === -1 || toIdx === -1) return;
  const deck = gameState.decks[fromIdx];
  if (deck.cards.length === 0) return;
  const card = removeCardFromDeck(fromIdx, deck.cards[0].id);
  if (!card) return;
  setGameState("decks", toIdx, "cards", (cards) => [...cards, card]);
  broadcastGameState();
}

export function moveCardToTop(cardId: string, toDeckId: string) {
  const sourceIdx = gameState.decks.findIndex((d) => d.cards.some((c) => c.id === cardId));
  const targetIdx = deckIndex(toDeckId);
  if (sourceIdx === -1 || targetIdx === -1) return;
  const card = removeCardFromDeck(sourceIdx, cardId);
  if (!card) return;
  setGameState("decks", targetIdx, "cards", (cards) => [card, ...cards]);
  broadcastGameState();
}

export function clearDeck(deckId: string) {
  const idx = deckIndex(deckId);
  if (idx === -1) return;
  setGameState("decks", idx, "cards", []);
  broadcastGameState();
}

export function shuffleDeck(deckId: string) {
  const idx = deckIndex(deckId);
  if (idx === -1) return;
  setGameState("decks", idx, "cards", (cards) => {
    const arr = [...cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  broadcastGameState();
}
