import { createSignal } from "solid-js";
import { storageGet, storageSet } from "../utils/storage";

export interface SavedGame {
  roomCode: string;
  gameType: string;
  myPlayerName: string;
  maxPlayers: number;
  savedAt: number;
}

function readLocalSavedGames(): SavedGame[] {
  try {
    const raw = localStorage.getItem("tcg:my-games");
    return raw ? (JSON.parse(raw) as SavedGame[]) : [];
  } catch { return []; }
}

const [savedGames, setSavedGames] = createSignal<SavedGame[]>(readLocalSavedGames());
export { savedGames };

export async function loadSavedGames() {
  const stored = await storageGet<SavedGame[]>("my-games");
  if (stored?.length) setSavedGames(stored);
}

export async function upsertSavedGame(game: SavedGame) {
  const current = savedGames();
  const idx = current.findIndex((g) => g.roomCode === game.roomCode);
  const next = idx >= 0
    ? current.map((g, i) => (i === idx ? game : g))
    : [game, ...current].slice(0, 10); // keep last 10
  setSavedGames(next);
  await storageSet("my-games", next);
}

export async function removeSavedGame(roomCode: string) {
  const next = savedGames().filter((g) => g.roomCode !== roomCode);
  setSavedGames(next);
  await storageSet("my-games", next);
}
