import { supabase } from "./supabase";
import { myUserId } from "../stores/gameStore";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface WatchedGame {
  playerName: string;
  channel: RealtimeChannel;
  timerId: ReturnType<typeof setTimeout> | null;
}

// One passive subscription per room code, keyed by room code.
// Uses a separate channel topic ("notify:X") from the active game ("room:X")
// so watching multiple games never interferes with joining new ones.
const watched = new Map<string, WatchedGame>();

export function startWatchingRoom(
  roomCode: string,
  playerName: string,
  onMyTurn: (name: string) => void,
) {
  stopWatchingRoom(roomCode); // replace any stale watcher for this room

  const channel = supabase
    .channel(`room:${roomCode}`)
    .on("broadcast", { event: "game_state" }, ({ payload }: any) => {
      const game = watched.get(roomCode);
      if (!game) return;

      if (payload.currentTurnPlayerId === myUserId) {
        // It's our turn — start debounce timer if not already running
        if (game.timerId === null) {
          game.timerId = setTimeout(() => {
            game.timerId = null;
            onMyTurn(game.playerName);
          }, 10_000);
        }
      } else {
        // No longer our turn — cancel any pending timer
        if (game.timerId !== null) {
          clearTimeout(game.timerId);
          game.timerId = null;
        }
      }
    })
    .subscribe();

  watched.set(roomCode, { playerName, channel, timerId: null });
}

export function stopWatchingRoom(roomCode: string) {
  const game = watched.get(roomCode);
  if (!game) return;
  if (game.timerId !== null) clearTimeout(game.timerId);
  supabase.removeChannel(game.channel);
  watched.delete(roomCode);
}
