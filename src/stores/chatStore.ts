import { createStore } from "solid-js/store";
import { uuid4 } from "../utils/uuid";
import { broadcastChatMessage, onChatMessage } from "../utils/socket";
import { myUserId } from "./gameStore";

export interface ChatMessage {
  id: string;
  type: "chat" | "event";
  timestamp: number;
  content: string;
  fromPlayerId?: string;    // chat: who sent it
  actorPlayerId?: string;   // event: who performed the action
  targetPlayerId?: string;  // event: who was acted on
}

const [chatState, setChatState] = createStore<{ messages: ChatMessage[] }>({ messages: [] });

export const chatMessages = () => chatState.messages;

export function receiveChat(msg: ChatMessage) {
  if (chatState.messages.some((m) => m.id === msg.id)) return;
  setChatState("messages", chatState.messages.length, msg);
}

export function sendChatMessage(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return;
  const msg: ChatMessage = {
    id: uuid4(),
    type: "chat",
    timestamp: Date.now(),
    content: trimmed,
    fromPlayerId: myUserId,
  };
  receiveChat(msg);
  broadcastChatMessage(msg);
}

export function logEvent(
  content: string,
  actorPlayerId?: string,
  targetPlayerId?: string,
) {
  const msg: ChatMessage = {
    id: uuid4(),
    type: "event",
    timestamp: Date.now(),
    content,
    actorPlayerId,
    targetPlayerId,
  };
  setChatState("messages", chatState.messages.length, msg);
  broadcastChatMessage(msg);
}

// Register handler for incoming chat messages from other clients.
// Runs at module init — by the time any message arrives, socket is ready.
onChatMessage(receiveChat);
