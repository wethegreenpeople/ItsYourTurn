import { createSignal } from "solid-js";
import { storageGet, storageSet } from "../utils/storage";

export interface PlayerSettings {
  notificationsEnabled: boolean;
}

const [playerSettings, setPlayerSettings] = createSignal<PlayerSettings>({
  notificationsEnabled: true,
});

export { playerSettings };

export async function loadPlayerSettings() {
  const saved = await storageGet<PlayerSettings>("player-settings");
  if (saved) setPlayerSettings(saved);
}

export async function updatePlayerSettings(patch: Partial<PlayerSettings>) {
  const next = { ...playerSettings(), ...patch };
  setPlayerSettings(next);
  await storageSet("player-settings", next);
}
