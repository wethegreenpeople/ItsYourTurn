import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

// ── Zone labels ──────────────────────────────────────────────────────────────
const _initZoneLabels = (() => {
  const s = localStorage.getItem("tcg:showZoneLabels");
  return s !== null ? (JSON.parse(s) as boolean) : false;
})();

const [showZoneLabels, _setShowZoneLabels] = createSignal(_initZoneLabels);
export { showZoneLabels };

export function setShowZoneLabels(v: boolean) {
  localStorage.setItem("tcg:showZoneLabels", JSON.stringify(v));
  _setShowZoneLabels(v);
}

// ── Settings modal ────────────────────────────────────────────────────────────
export const [showSettingsModal, setShowSettingsModal] = createSignal(false);

// ── Plugin settings ───────────────────────────────────────────────────────────
function loadPluginSettings(): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("tcg:ps:")) {
      try {
        result[k.slice(7)] = JSON.parse(localStorage.getItem(k)!) as string | boolean;
      } catch { /* skip malformed */ }
    }
  }
  return result;
}

const [pluginSettings, _setPluginSettings] = createStore<Record<string, string | boolean>>(
  loadPluginSettings()
);

export { pluginSettings };

export function getPluginSetting(key: string, defaultValue: string | boolean): string | boolean {
  return pluginSettings[key] ?? defaultValue;
}

export function setPluginSetting(key: string, value: string | boolean) {
  localStorage.setItem(`tcg:ps:${key}`, JSON.stringify(value));
  _setPluginSettings(key, value);
}
