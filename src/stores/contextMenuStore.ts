import { createStore } from "solid-js/store";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  cardId: string;
  zoneId: string;
}

const [contextMenu, setContextMenu] = createStore<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  cardId: "",
  zoneId: "",
});

export { contextMenu };

export function showContextMenu(x: number, y: number, cardId: string, zoneId: string) {
  setContextMenu({ visible: true, x, y, cardId, zoneId });
}

export function hideContextMenu() {
  setContextMenu("visible", false);
}
