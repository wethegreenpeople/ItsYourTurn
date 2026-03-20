import { supabase } from "./supabase";
import { gameState, setGameState } from "../stores/gameStore";
import type { RealtimeChannel } from "@supabase/supabase-js";

let channel: RealtimeChannel | null = null;

export function hostRoom(roomCode: string) {
  channel = supabase
    .channel(`room:${roomCode}`)
    .on('broadcast', { event: 'request_state' }, () => {
      channel?.send({ type: 'broadcast', event: 'game_state', payload: { ...gameState } });
    })
    .on('broadcast', { event: 'game_state' }, ({ payload }) => {
      setGameState(payload);
    })
    .subscribe((status) => {
      console.log(`Hosting room ${roomCode}:`, status);
    });
}

export function joinRoom(roomCode: string, onSubscribed?: () => void) {
  channel = supabase
    .channel(`room:${roomCode}`)
    .on('broadcast', { event: 'game_state' }, ({ payload }) => {
      setGameState(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onSubscribed?.();
        channel?.send({ type: 'broadcast', event: 'request_state', payload: {} });
        console.log(`Joined room ${roomCode}`);
      }
    });
}

export function broadcastGameState() {
  channel?.send({ type: 'broadcast', event: 'game_state', payload: { ...gameState } });
}

export function leaveRoom() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
