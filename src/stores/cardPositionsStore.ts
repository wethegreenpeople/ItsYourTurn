import { createStore } from "solid-js/store";

type Pos = { x: number; y: number };
const [positions, setPositions] = createStore<Record<string, Pos>>({});

export function setCardPos(id: string, x: number, y: number) {
  setPositions(id, { x, y });
}

export function getCardPos(id: string): Pos | undefined {
  return positions[id];
}
