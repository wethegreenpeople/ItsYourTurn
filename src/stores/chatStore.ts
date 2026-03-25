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

export function sendDiceRoll(notation: string): boolean {
  const match = notation.trim().match(/^(\d+)?[dD](\d+)$/);
  if (!match) return false;

  const count = Math.min(parseInt(match[1] ?? "1", 10), 100);
  const sides = parseInt(match[2]!, 10);
  if (count < 1 || sides < 2 || sides > 10000) return false;

  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0);
  const content = count === 1
    ? `[dice] d${sides}: ${total}`
    : `[dice] ${count}d${sides}: [${rolls.join(", ")}] = ${total}`;

  const msg: ChatMessage = {
    id: uuid4(),
    type: "chat",
    timestamp: Date.now(),
    content,
    fromPlayerId: myUserId,
  };
  receiveChat(msg);
  broadcastChatMessage(msg);
  return true;
}

// Register handler for incoming chat messages from other clients.
// Runs at module init — by the time any message arrives, socket is ready.
onChatMessage(receiveChat);
