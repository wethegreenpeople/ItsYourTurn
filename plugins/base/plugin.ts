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
  /** CSS grid-template-rows value — lets plugin control row count and sizing */
  gridRowsTemplate?: string;
}

export interface CardSubAction {
  label: string;
  action: (cardId: string, zoneId: string) => void;
}

export interface CardAction {
  label: string;
  /** Called when this action has no submenu. Required if submenu is absent. */
  action?: (cardId: string, zoneId: string) => void;
  /** If provided, this action is only shown in the context menu when this returns true. */
  show?: (cardId: string) => boolean;
  /** If provided, clicking this item expands an inline submenu instead of executing action. */
  submenu?: CardSubAction[];
}

export interface PluginSetting {
  key: string;
  label: string;
  description?: string;
  type: 'toggle' | 'select';
  options?: { value: string; label: string }[];
  defaultValue: boolean | string;
}

export interface KeyCombo {
  /**
   * The primary key using KeyboardEvent.key values.
   * Use " " for Space, "Alt"/"Control"/"Shift"/"Meta" for modifier-only hover bindings.
   */
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface KeyBindingDef {
  id: string;
  label: string;
  description?: string;
  /** Groups entries in the shortcuts UI (e.g. "Global", "Riftbound") */
  category: string;
  /** Plugin ID if plugin-specific; absent for global bindings */
  pluginId?: string;
  defaultCombo: KeyCombo;
  /** Called when the combo is pressed. Absent for hover-modifier bindings. */
  action?: () => void;
  /**
   * True for modifier-hold-while-hovering bindings.
   * The keypress executor won't fire this; the app checks it during mousemove.
   */
  isHoverModifier?: boolean;
}

/** A button that appears in the game sidebar / hamburger menu. */
export interface GameBarAction {
  label: string;
  icon: string;
  action: () => void;
}

export interface Plugin {
  id: string;
  theme?: PluginTheme;

  /** Starting score (HP, life points, etc.) for each player. Default: 20. */
  startingScore?: number;
  /** Label shown next to the score counter. Default: "HP". */
  scoreLabel?: string;
  /** Context menu actions available on any card. Plugin-specific. */
  cardActions?: CardAction[];
  /** Settings this plugin exposes in the Settings panel. */
  settings?: PluginSetting[];
  /** Keyboard shortcuts this plugin registers. Activated when the plugin becomes active. */
  keyBindings?: KeyBindingDef[];
  /** Extra buttons added to the game bar sidebar and mobile hamburger menu. */
  gameBarActions?: GameBarAction[];
  /**
   * Optional widgets rendered in the desktop sidebar only (not mobile hamburger).
   * Use this for complex plugin-specific UI like turn phase trackers.
   */
  gameBarWidgets?: JSX.Element[];
  /**
   * Optional extra overlays/modals rendered by the plugin (e.g. card search modal).
   * Called inside the DragDropProvider in App.tsx.
   */
  renderOverlays?: () => JSX.Element;

  /**
   * Called once to register the plugin itself. Should only call registerPlugin(this).
   * Do NOT create decks here — create them in registerPlayer().
   */
  register: () => void;

  /**
   * Called once per player before the game starts.
   * Create all player-scoped decks here (e.g. `"p1:hand"`, `"p1:battlefield"`).
   */
  registerPlayer: (playerId: string) => void;

  /**
   * Return the PlayAreas (zone layout) for a specific player.
   * All deck IDs in the returned areas should be scoped to `playerId`.
   */
  createPlayerAreas: (playerId: string) => PlayArea[];

  /** Drag-and-drop resolution. Receives draggable and droppable after a drag ends. */
  onDragEnd: DragEventHandler;

  // ── Lifecycle hooks (all optional) ──────────────────────────────────────

  /** Called after all players are registered, before first render. */
  onGameStart?: (players: { id: string; name: string }[]) => void;
  /** Called when a player's turn begins. */
  onTurnStart?: (playerId: string) => void;
  /** Called when a player's turn ends. */
  onTurnEnd?: (playerId: string) => void;
  /**
   * Called after any card move (drag, context menu action, deck click).
   * fromZoneId and toZoneId are the deck IDs involved.
   */
  onCardMoved?: (cardId: string, fromZoneId: string, toZoneId: string) => void;

  /**
   * Parse and load a deck list string for a specific player.
   * The plugin is responsible for routing cards to the correct zones.
   * Returns any card names/IDs that couldn't be resolved.
   */
  loadDeck?: (text: string, playerId: string) => Promise<{ errors: string[] }>;
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
