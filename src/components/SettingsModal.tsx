import { For, Show } from "solid-js";
import { getActivePlugin } from "../stores/pluginStore";
import {
  showSettingsModal, setShowSettingsModal,
  showZoneLabels, setShowZoneLabels,
  getPluginSetting, setPluginSetting,
} from "../stores/settingsStore";
import type { PluginSetting } from "../../plugins/base/plugin";

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
          </div>
        </div>
      </div>
    </Show>
  );
};
