import { supabase } from "./supabase";
import { gameState, myUserId, addPlayer, removePlayer, applyRemoteState } from "../stores/gameStore";
import type { GameState } from "../stores/gameStore";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Chat message callback — registered by chatStore to avoid circular imports.
let _chatMessageHandler: ((msg: any) => void) | null = null;
export function onChatMessage(handler: (msg: any) => void) {
  _chatMessageHandler = handler;
}

export function broadcastChatMessage(msg: any) {
  channel?.send({ type: "broadcast", event: "chat_message", payload: msg });
}

let channel: RealtimeChannel | null = null;

/**
 * Join a Supabase broadcast room. Every client uses this — no host/joiner split.
 *
 * onReady fires once the channel is subscribed AND we have valid state
 * (either because we're the first player, or because we received it from
 * another client).
 */
export function joinRoom(roomCode: string, onReady?: () => void) {
  let readyFired = false;
  const fireReady = () => {
    if (!readyFired) {
      readyFired = true;
      onReady?.();
    }
  };

  channel = supabase
    .channel(`room:${roomCode}`)

    // Another client is asking for the current state.
    // The first player in the array responds.
    .on("broadcast", { event: "request_state" }, () => {
      if (gameState.players[0]?.id === myUserId) {
        channel?.send({ type: "broadcast", event: "game_state", payload: JSON.parse(JSON.stringify(gameState)) });
      }
    })

    // A new player wants to join. The first player adds them and broadcasts.
    .on("broadcast", { event: "player_join" }, ({ payload }: { payload: { id: string; name: string } }) => {
      if (gameState.players[0]?.id === myUserId) {
        addPlayer(payload.id, payload.name);
      }
    })

    // A player is quitting the game entirely.
    .on("broadcast", { event: "player_leave" }, ({ payload }: { payload: { id: string } }) => {
      removePlayer(payload.id);
    })

    // Receive a chat message from another client.
    .on("broadcast", { event: "chat_message" }, ({ payload }) => {
      _chatMessageHandler?.(payload);
    })

    // Receive full game state from any client.
    .on("broadcast", { event: "game_state" }, ({ payload }: { payload: GameState }) => {
      applyRemoteState(payload);
      fireReady();
    })

    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // If we already have players (we're the first in the room), we're ready.
        if (gameState.players.length > 0) {
          fireReady();
        }
        // Ask if anyone is already in the room.
        channel?.send({ type: "broadcast", event: "request_state", payload: {} });
      }
    });
}

/** Broadcast the full game state to all clients. */
export function broadcastGameState() {
  channel?.send({ type: "broadcast", event: "game_state", payload: JSON.parse(JSON.stringify(gameState)) });
}

/** Tell the room we want to join as a new player. */
export function requestJoin(playerId: string, playerName: string) {
  channel?.send({ type: "broadcast", event: "player_join", payload: { id: playerId, name: playerName } });
}

/** Tell the room that a player is permanently leaving (quit, not just menu). */
export function broadcastPlayerLeave(playerId: string) {
  channel?.send({ type: "broadcast", event: "player_leave", payload: { id: playerId } });
}

export function leaveRoom() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
