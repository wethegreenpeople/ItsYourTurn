import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { getActivePlugin } from "../stores/pluginStore";
import {
  showSettingsModal, setShowSettingsModal,
  showZoneLabels, setShowZoneLabels,
  getPluginSetting, setPluginSetting,
} from "../stores/settingsStore";
import {
  getBindingsByCategory, getEffectiveCombo, setComboOverride,
  isBindingOverridden, getAllBindings,
} from "../stores/keybindingStore";
import type { KeyCombo } from "../stores/keybindingStore";
import type { PluginSetting } from "../../plugins/base/plugin";

// ── Shared toggle ─────────────────────────────────────────────────────────────

const Toggle = (props: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    class="relative w-10 h-6 rounded-full transition-colors duration-150 flex-shrink-0 cursor-pointer border border-raised"
    classList={{
      "bg-gold/80 border-gold/60": props.value,
      "bg-surface": !props.value,
    }}
    onClick={() => props.onChange(!props.value)}
    aria-label="Toggle"
    role="switch"
    aria-checked={props.value}
  >
    <span
      class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-150"
      classList={{
        "translate-x-4": props.value,
        "translate-x-0": !props.value,
      }}
    />
  </button>
);

// ── Plugin setting row ────────────────────────────────────────────────────────

const PluginSettingRow = (props: { setting: PluginSetting }) => {
  const s = props.setting;
  const current = () => getPluginSetting(s.key, s.defaultValue);

  return (
    <div class="flex flex-col gap-2">
      <div>
        <div class="text-sm font-semibold text-text">{s.label}</div>
        <Show when={s.description}>
          <div class="text-xs text-text-muted mt-0.5">{s.description}</div>
        </Show>
      </div>
      <Show when={s.type === "toggle"}>
        <Toggle value={current() === true} onChange={(v) => setPluginSetting(s.key, v)} />
      </Show>
      <Show when={s.type === "select"}>
        <div class="flex gap-2 flex-wrap">
          <For each={s.options ?? []}>
            {(opt) => (
              <button
                class="px-3 py-1.5 rounded text-xs font-semibold border transition-all duration-150 cursor-pointer"
                classList={{
                  "bg-gold/12 border-gold/50 text-gold": current() === opt.value,
                  "bg-surface border-raised text-text-muted hover:border-gold/35 hover:text-gold": current() !== opt.value,
                }}
                onClick={() => setPluginSetting(s.key, opt.value)}
              >
                {opt.label}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

// ── Keybinding combo display ──────────────────────────────────────────────────

const ComboDisplay = (props: { id: string; isHover: boolean }) => {
  const combo = () => getEffectiveCombo(props.id);

  const parts = (): string[] => {
    const c = combo();
    const ps: string[] = [];
    if (c.ctrl)  ps.push("Ctrl");
    if (c.alt)   ps.push("Alt");
    if (c.shift) ps.push("Shift");
    if (c.meta)  ps.push("⌘");

    const k = c.key;
    if      (k === " ")        ps.push("Space");
    else if (k === "Alt")      ps.push("Alt");
    else if (k === "Control")  ps.push("Ctrl");
    else if (k === "Shift")    ps.push("Shift");
    else if (k === "Meta")     ps.push("⌘");
    else if (k === "Escape")   ps.push("Esc");
    else if (k === "ArrowUp")  ps.push("↑");
    else if (k === "ArrowDown") ps.push("↓");
    else if (k === "ArrowLeft") ps.push("←");
    else if (k === "ArrowRight") ps.push("→");
    else ps.push(k.length === 1 ? k.toUpperCase() : k);

    return ps;
  };

  return (
    <div class="flex items-center gap-0.5 flex-wrap">
      <For each={parts()}>
        {(part, i) => (
          <>
            <Show when={i() > 0}>
              <span class="text-text-faint text-[9px] px-[2px] select-none">+</span>
            </Show>
            <kbd class="keycap">{part}</kbd>
          </>
        )}
      </For>
      <Show when={props.isHover}>
        <span class="text-text-faint text-[9px] px-[2px] select-none">+</span>
        <span class="text-[10px] text-text-muted/80 italic leading-none">hover</span>
      </Show>
    </div>
  );
};

// ── Keyboard shortcuts section ────────────────────────────────────────────────

const KeyboardShortcutsSection = () => {
  const [listeningId, setListeningId] = createSignal<string | null>(null);
  const groups = () => getBindingsByCategory();
  const listeningDef = () => getAllBindings().find(b => b.id === listeningId());

  // Capture keydown while remapping
  createEffect(() => {
    const id = listeningId();
    if (!id) return;

    const def = listeningDef();

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setListeningId(null);
        return;
      }

      if (def?.isHoverModifier) {
        // For hover bindings, only accept a lone modifier key
        if (["Alt", "Control", "Shift", "Meta"].includes(e.key)) {
          setComboOverride(id, { key: e.key });
          setListeningId(null);
        }
        return;
      }

      // For regular bindings, skip modifier-only presses
      if (["Alt", "Control", "Shift", "Meta"].includes(e.key)) return;

      const combo: KeyCombo = { key: e.key };
      if (e.ctrlKey)  combo.ctrl  = true;
      if (e.altKey)   combo.alt   = true;
      if (e.shiftKey) combo.shift = true;
      if (e.metaKey)  combo.meta  = true;
      setComboOverride(id, combo);
      setListeningId(null);
    };

    document.addEventListener("keydown", onKey, { capture: true });
    onCleanup(() => document.removeEventListener("keydown", onKey, { capture: true }));
  });

  return (
    // Hidden on mobile — keyboard shortcuts aren't relevant on touch devices
    <div class="hidden md:flex flex-col gap-3">
      <div class="border-t border-raised" />

      <div class="text-[10px] font-bold tracking-[0.15em] uppercase text-text-faint select-none">
        Keyboard Shortcuts
      </div>

      <For each={groups()}>
        {({ category, bindings }) => (
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-bold tracking-[0.1em] uppercase text-text-faint/60 select-none">
              {category}
            </span>
            <For each={bindings}>
              {(def) => (
                <div class="flex items-start justify-between gap-2 py-2 px-2.5 rounded-md bg-surface/60 border border-raised/50">
                  {/* Label + description */}
                  <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span class="text-[11px] font-semibold text-text leading-none">{def.label}</span>
                    <Show when={def.description}>
                      <span class="text-[10px] text-text-muted/65 leading-tight mt-0.5">{def.description}</span>
                    </Show>
                  </div>

                  {/* Combo + actions */}
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <Show
                      when={listeningId() === def.id}
                      fallback={
                        <>
                          <ComboDisplay id={def.id} isHover={!!def.isHoverModifier} />
                          <button
                            class="w-6 h-6 rounded flex items-center justify-center text-[11px] text-text-muted hover:text-gold transition-colors cursor-pointer ml-1"
                            onClick={() => setListeningId(def.id)}
                            title="Remap shortcut"
                          >
                            ✎
                          </button>
                          <Show when={isBindingOverridden(def.id)}>
                            <button
                              class="w-6 h-6 rounded flex items-center justify-center text-[13px] text-text-muted hover:text-danger transition-colors cursor-pointer"
                              onClick={() => setComboOverride(def.id, null)}
                              title="Reset to default"
                            >
                              ↺
                            </button>
                          </Show>
                        </>
                      }
                    >
                      <span class="text-[10px] text-gold/80 font-semibold">
                        {listeningDef()?.isHoverModifier ? "Press a modifier key…" : "Press keys…"}
                      </span>
                      <button
                        class="w-6 h-6 ml-1 rounded flex items-center justify-center text-[10px] text-text-muted hover:text-text transition-colors cursor-pointer"
                        onClick={() => setListeningId(null)}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────

export const SettingsModal = () => {
  const pluginSettings = (): PluginSetting[] => getActivePlugin()?.settings ?? [];

  return (
    <Show when={showSettingsModal()}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-[500] bg-black/65"
        onClick={() => setShowSettingsModal(false)}
      />
      {/* Modal */}
      <div class="fixed inset-0 z-[501] flex items-center justify-center pointer-events-none">
        <div
          class="pointer-events-auto w-80 max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl bg-base border border-raised"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-raised">
            <span class="font-cinzel text-sm font-semibold tracking-widest uppercase text-gold">
              Settings
            </span>
            <button
              class="text-lg leading-none text-text-muted hover:text-text transition-colors duration-150 cursor-pointer"
              onClick={() => setShowSettingsModal(false)}
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div class="px-4 py-3 flex flex-col gap-5">
            {/* Universal: Zone Labels */}
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-text">Zone Labels</div>
                <div class="text-xs text-text-muted mt-0.5">Show zone name inside each panel</div>
              </div>
              <Toggle value={showZoneLabels()} onChange={setShowZoneLabels} />
            </div>

            {/* Plugin-declared settings */}
            <For each={pluginSettings()}>
              {(setting) => <PluginSettingRow setting={setting} />}
            </For>

            {/* Keyboard shortcuts — desktop only */}
            <KeyboardShortcutsSection />
          </div>
        </div>
      </div>
    </Show>
  );
};
