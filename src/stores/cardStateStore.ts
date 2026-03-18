import { createStore } from "solid-js/store";

type CardState = { faceDown?: boolean; horizontal?: boolean };
const [_cardStates, setCardStates] = createStore<Record<string, CardState>>({});

export const isFaceDown    = (id: string) => !!_cardStates[id]?.faceDown;
export const isHorizontal  = (id: string) => !!_cardStates[id]?.horizontal;

// Updater-function form ensures the parent object is created if it doesn't exist yet
export const setFaceDown      = (id: string, v: boolean) => setCardStates(id, (s) => ({ ...s, faceDown: v }));
export const toggleFaceDown   = (id: string) =>             setCardStates(id, (s) => ({ ...s, faceDown: !s?.faceDown }));
export const setHorizontal    = (id: string, v: boolean) => setCardStates(id, (s) => ({ ...s, horizontal: v }));
export const toggleHorizontal = (id: string) =>             setCardStates(id, (s) => ({ ...s, horizontal: !s?.horizontal }));
