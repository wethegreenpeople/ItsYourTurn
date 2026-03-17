import { JSX } from "solid-js";
import { DragEventHandler } from "@thisbeyond/solid-dnd";

export interface PluginTheme {
  /** CSS background shorthand for .game-root (full gradient string) */
  bgGradient?: string;
  /** Primary accent color — gold, teal, etc. */
  accentColor?: string;
  /** Dimmer/darker variant of accent for borders */
  accentDim?: string;
  /** Base zone panel background (CSS color / rgba) */
  surfaceColor?: string;
  /** Base zone panel border color */
  borderColor?: string;
  /** Primary text color */
  textColor?: string;
  /** Muted label/secondary text color */
  textMuted?: string;
  /** CSS font-family for zone labels and card names */
  fontDisplay?: string;
  /** CSS font-family for UI text */
  fontBody?: string;
  /** CSS grid-template-columns value — lets plugin define column widths */
  gridColumnsTemplate?: string;
}

export interface Plugin {
  id: string;
  playAreas: PlayArea[];
  theme?: PluginTheme;
  register: () => void;
  onDragEnd: DragEventHandler;
}

export interface PlayArea {
  id: string;
  region: Region;
  content: () => JSX.Element;
  description?: string;
  className?: string;
}

export interface Region {
  xStart: number;
  xFinish: number;
  yStart: number;
  yFinish: number;
}
