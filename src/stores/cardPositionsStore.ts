import { gameState, setGameState } from "./gameStore";
import { broadcastGameState } from "../utils/socket";

export function setCardPos(id: string, x: number, y: number) {
  setGameState("cardPositions", id, { x, y });
  broadcastGameState();
}

export function getCardPos(id: string) {
  return gameState.cardPositions[id];
}
