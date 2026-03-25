import { createSignal } from "solid-js";
import type { KeyCombo, KeyBindingDef } from "../../plugins/base/plugin";
import type { Card } from "../models/Card";

export type { KeyCombo, KeyBindingDef };

// ── Registry ──────────────────────────────────────────────────────────────────

const _reg = new Map<string, KeyBindingDef>();
const [_rev, _bump] = createSignal(0);

export function registerKeyBinding(def: KeyBindingDef): void {
  _reg.set(def.id, def);
  _bump(v => v + 1);
}

/** All registered bindings (reactive — re-runs when registry changes). */
export function getAllBindings(): KeyBindingDef[] {
  _rev();
  return Array.from(_reg.values());
}

/** Bindings grouped by category (reactive). */
export function getBindingsByCategory(): { category: string; bindings: KeyBindingDef[] }[] {
  _rev();
  const groups = new Map<string, KeyBindingDef[]>();
  for (const def of _reg.values()) {
    if (!groups.has(def.category)) groups.set(def.category, []);
    groups.get(def.category)!.push(def);
  }
  return Array.from(groups.entries()).map(([category, bindings]) => ({ category, bindings }));
}

// ── Override Persistence ──────────────────────────────────────────────────────

const _lsKey = (id: string) => `tcg:kb:${id}`;

export function getEffectiveCombo(id: string): KeyCombo {
  const raw = localStorage.getItem(_lsKey(id));
  if (raw) {
    try { return JSON.parse(raw) as KeyCombo; } catch { /* ignore */ }
  }
  return _reg.get(id)?.defaultCombo ?? { key: "" };
}

export function setComboOverride(id: string, combo: KeyCombo | null): void {
  if (combo === null) localStorage.removeItem(_lsKey(id));
  else localStorage.setItem(_lsKey(id), JSON.stringify(combo));
  _bump(v => v + 1);
}

export function isBindingOverridden(id: string): boolean {
  return localStorage.getItem(_lsKey(id)) !== null;
}

// ── Execution ─────────────────────────────────────────────────────────────────

export function comboMatches(e: KeyboardEvent, c: KeyCombo): boolean {
  return (
    e.key === c.key &&
    !!c.ctrl  === e.ctrlKey &&
    !!c.alt   === e.altKey  &&
    !!c.shift === e.shiftKey &&
    !!c.meta  === e.metaKey
  );
}

/** Fire the first matching non-hover binding action. Call from a global keydown listener. */
export function executeBindings(e: KeyboardEvent): void {
  for (const def of _reg.values()) {
    if (def.isHoverModifier || !def.action) continue;
    if (comboMatches(e, getEffectiveCombo(def.id))) {
      e.preventDefault();
      def.action();
      return;
    }
  }
}

// ── Alt-Hover Preview State ───────────────────────────────────────────────────
// Split into two signals so position changes never re-mount the card preview.

/** The card shown in the alt-hover preview (identity only), or null. */
export const [altHoverCard, setAltHoverCard] = createSignal<Card | null>(null);
/** Mouse position while alt-hovering — updates on every mousemove. */
export const [altHoverPos, setAltHoverPos] = createSignal({ x: 0, y: 0 });

// Register the built-in global alt+hover binding (display/override metadata only)
registerKeyBinding({
  id: "global:alt-hover-card",
  label: "Enlarge Card on Hover",
  description: "Hold modifier and hover over any card for a mid-size preview",
  category: "Global",
  defaultCombo: { key: "Alt" },
  isHoverModifier: true,
});
