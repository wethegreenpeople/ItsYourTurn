import { createSignal } from "solid-js";

const [buffCardId, setBuffCardId] = createSignal<string | null>(null);

export { buffCardId };
export const openAddBuff = (cardId: string) => setBuffCardId(cardId);
export const closeAddBuff = () => setBuffCardId(null);
