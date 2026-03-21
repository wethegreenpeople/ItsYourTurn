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
    class="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
    style={{ background: props.value ? "var(--plugin-accent, #c9a84c)" : "#252840" }}
    onClick={() => props.onChange(!props.value)}
    aria-label="Toggle"
    role="switch"
    aria-checked={props.value}
  >
    <span
      class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
      style={{ transform: props.value ? "translateX(16px)" : "translateX(0)" }}
    />
  </button>
);

const PluginSettingRow = (props: { setting: PluginSetting }) => {
  const s = props.setting;
  const current = () => getPluginSetting(s.key, s.defaultValue);

  return (
    <div class="flex flex-col gap-2">
      <div>
        <div class="text-sm font-semibold text-[#e2d9c7]">{s.label}</div>
        <Show when={s.description}>
          <div class="text-xs text-[#c5c3d8] mt-0.5">{s.description}</div>
        </Show>
      </div>
      <Show when={s.type === "toggle"}>
        <Toggle
          value={current() === true}
          onChange={(v) => setPluginSetting(s.key, v)}
        />
      </Show>
      <Show when={s.type === "select"}>
        <div class="flex gap-2 flex-wrap">
          <For each={s.options ?? []}>
            {(opt) => (
              <button
                class="px-3 py-1.5 rounded text-xs font-semibold border transition-all"
                style={
                  current() === opt.value
                    ? {
                        background: "rgba(201,168,76,0.15)",
                        "border-color": "rgba(201,168,76,0.6)",
                        color: "var(--plugin-accent, #c9a84c)",
                      }
                    : {
                        background: "rgba(22,25,42,0.85)",
                        "border-color": "#2e3250",
                        color: "#c5c3d8",
                      }
                }
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
        class="fixed inset-0 z-[500]"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={() => setShowSettingsModal(false)}
      />
      {/* Modal */}
      <div class="fixed inset-0 z-[501] flex items-center justify-center pointer-events-none">
        <div
          class="pointer-events-auto w-80 max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl"
          style={{
            background: "#0e1226",
            border: "1px solid #3a3d54",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            class="flex items-center justify-between px-4 py-3"
            style={{ "border-bottom": "1px solid #252840" }}
          >
            <span
              class="text-sm font-semibold tracking-widest uppercase"
              style={{
                "font-family": "var(--plugin-font-display, 'Cinzel', Georgia, serif)",
                color: "var(--plugin-accent, #c9a84c)",
              }}
            >
              Settings
            </span>
            <button
              class="text-lg leading-none transition-colors"
              style={{ color: "#c5c3d8" }}
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
                <div class="text-sm font-semibold text-[#e2d9c7]">Zone Labels</div>
                <div class="text-xs text-[#c5c3d8] mt-0.5">Show zone name inside each panel</div>
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
