import { playerSettings, updatePlayerSettings } from "../stores/playerSettingsStore";
import { Modal } from "./ui";
import { Toggle } from "./ui";

interface PlayerSettingsProps {
  onClose: () => void;
}

export function PlayerSettings(props: PlayerSettingsProps) {
  return (
    <Modal open={true} onClose={props.onClose} title="Settings">
      <div
        class="flex items-center justify-between gap-4 px-4 py-3.5 rounded-[10px]"
        style="background:rgba(255,255,255,.03);border:1px solid rgba(82,82,91,.5)"
      >
        <div>
          <p class="font-semibold text-[.95rem] m-0 text-text-muted">Turn Notifications</p>
          <p class="text-[.78rem] mt-1 m-0" style="color:rgba(207,219,213,.4)">
            Desktop alert 10s after your turn starts (when away)
          </p>
        </div>
        <Toggle
          checked={playerSettings().notificationsEnabled}
          onChange={(v) => updatePlayerSettings({ notificationsEnabled: v })}
        />
      </div>
    </Modal>
  );
}
