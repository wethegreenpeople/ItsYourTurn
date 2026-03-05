import { JSX } from "solid-js";
import { DragEventHandler } from "@thisbeyond/solid-dnd";

export interface Plugin {
  playAreas: PlayArea[]
  register: () => void;
  onDragEnd: DragEventHandler
}

export interface PlayArea {
  id: string;
  region: Region;
  content?: () => JSX.Element;
  description?: string;
}

export interface Region {
  xStart: number;
  xFinish: number;
  yStart: number;
  yFinish: number;
}
