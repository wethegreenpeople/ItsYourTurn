import { gameState, setGameState } from "./gameStore";
import { broadcastGameState } from "../utils/socket";

export function getCounter(cardId: string): number {
  return gameState.cardCounters[cardId] ?? 0;
}

export function addCounter(cardId: string, delta: number) {
  const current = gameState.cardCounters[cardId] ?? 0;
  setGameState("cardCounters", cardId, current + delta);
  broadcastGameState();
}

export function resetCounters(cardId: string) {
  setGameState("cardCounters", cardId, 0);
  broadcastGameState();
}

export function getBuffs(cardId: string): string[] {
  return gameState.cardBuffs[cardId] ?? [];
}

export function addBuff(cardId: string, buff: string) {
  const current = gameState.cardBuffs[cardId] ?? [];
  setGameState("cardBuffs", cardId, [...current, buff]);
  broadcastGameState();
}

export function clearBuffs(cardId: string) {
  setGameState("cardBuffs", cardId, []);
  broadcastGameState();
}
