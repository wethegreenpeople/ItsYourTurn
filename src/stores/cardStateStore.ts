import { gameState, setGameState } from "./gameStore";
import { broadcastGameState } from "../utils/socket";

export const isFaceDown    = (id: string) => !!gameState.cardStates[id]?.faceDown;
export const isHorizontal  = (id: string) => !!gameState.cardStates[id]?.horizontal;
export const isTapped      = (id: string) => !!gameState.cardStates[id]?.tapped;

export const setFaceDown = (id: string, v: boolean) => {
  setGameState("cardStates", id, (s) => ({ ...s, faceDown: v }));
  broadcastGameState();
};

export const toggleFaceDown = (id: string) => {
  setGameState("cardStates", id, (s) => ({ ...s, faceDown: !s?.faceDown }));
  broadcastGameState();
};

export const setHorizontal = (id: string, v: boolean) => {
  setGameState("cardStates", id, (s) => ({ ...s, horizontal: v }));
  broadcastGameState();
};

export const toggleHorizontal = (id: string) => {
  setGameState("cardStates", id, (s) => ({ ...s, horizontal: !s?.horizontal }));
  broadcastGameState();
};

export const setTapped = (id: string, v: boolean) => {
  setGameState("cardStates", id, (s) => ({ ...s, tapped: v }));
  broadcastGameState();
};

export const toggleTapped = (id: string) => {
  setGameState("cardStates", id, (s) => ({ ...s, tapped: !s?.tapped }));
  broadcastGameState();
};
