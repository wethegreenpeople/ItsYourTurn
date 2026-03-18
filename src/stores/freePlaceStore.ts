import { createSignal } from "solid-js";

const [freePlaceMode, setFreePlaceMode] = createSignal(false);

let _px = 0, _py = 0;
if (typeof document !== "undefined") {
  document.addEventListener("pointermove", (e) => { _px = e.clientX; _py = e.clientY; }, { passive: true });
}

export function getDropPointer() { return { x: _px, y: _py }; }
export { freePlaceMode, setFreePlaceMode };
