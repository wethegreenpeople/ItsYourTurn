import { createSignal } from "solid-js";
import { Card } from "../models/Card";

type PreviewState = { card: Card; x: number; y: number } | null;
const [previewState, setPreviewState] = createSignal<PreviewState>(null);

export { previewState };

export function showPreview(card: Card, x: number, y: number) {
  setPreviewState({ card, x, y });
}

export function hidePreview() {
  setPreviewState(null);
}
