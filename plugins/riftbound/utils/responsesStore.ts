import { createStore } from "solid-js/store";
import { gameState, myUserId } from "../../../src/stores/gameStore";
import {
  broadcastResponseRequest,
  broadcastResponseAnswer,
  broadcastResponseDone,
  broadcastResponseCancel,
  onResponseRequest,
  onResponseAnswer,
  onResponseDone,
  onResponseCancel,
} from "../../../src/utils/socket";

export type ResponseAnswer = "pending" | "yes" | "no";

interface ResponsesState {
  isActive: boolean;
  initiatorId: string;
  responses: Record<string, ResponseAnswer>;
  respondingPlayerId: string | null;
}

const [responsesState, setResponsesState] = createStore<ResponsesState>({
  isActive: false,
  initiatorId: "",
  responses: {},
  respondingPlayerId: null,
});

export { responsesState };

function checkAutoDismiss() {
  if (!responsesState.isActive) return;
  const vals = Object.values(responsesState.responses);
  if (
    vals.length > 0 &&
    vals.every((v) => v !== "pending") &&
    !responsesState.respondingPlayerId
  ) {
    setResponsesState("isActive", false);
  }
}

export function initiateResponses() {
  if (gameState.currentTurnPlayerId !== myUserId) return;
  const others = gameState.players
    .filter((p) => p.id !== myUserId)
    .map((p) => p.id);
  if (others.length === 0) return;
  const responses = {} as Record<string, ResponseAnswer>;
  others.forEach((id) => {
    responses[id] = "pending";
  });
  setResponsesState({
    isActive: true,
    initiatorId: myUserId,
    responses,
    respondingPlayerId: null,
  });
  broadcastResponseRequest({ initiatorId: myUserId, pendingPlayerIds: others });
}

export function submitResponse(answer: "yes" | "no") {
  if (!responsesState.isActive || responsesState.responses[myUserId] !== "pending") return;
  setResponsesState("responses", myUserId, answer);
  broadcastResponseAnswer({ playerId: myUserId, answer });
  if (answer === "yes") {
    setResponsesState("respondingPlayerId", myUserId);
  } else {
    checkAutoDismiss();
  }
}

export function finishResponding() {
  if (responsesState.respondingPlayerId !== myUserId) return;
  setResponsesState("respondingPlayerId", null);
  broadcastResponseDone({ playerId: myUserId });
  checkAutoDismiss();
}

export function cancelResponses() {
  if (responsesState.initiatorId !== myUserId) return;
  setResponsesState("isActive", false);
  broadcastResponseCancel();
}

// ── Socket event handlers ────────────────────────────────────────────────────

onResponseRequest((payload: { initiatorId: string; pendingPlayerIds: string[] }) => {
  if (payload.initiatorId === myUserId) return;
  const responses = {} as Record<string, ResponseAnswer>;
  payload.pendingPlayerIds.forEach((id: string) => {
    responses[id] = "pending";
  });
  setResponsesState({
    isActive: true,
    initiatorId: payload.initiatorId,
    responses,
    respondingPlayerId: null,
  });
});

onResponseAnswer((payload: { playerId: string; answer: "yes" | "no" }) => {
  if (!responsesState.isActive || payload.playerId === myUserId) return;
  setResponsesState("responses", payload.playerId, payload.answer);
  if (payload.answer === "yes") {
    setResponsesState("respondingPlayerId", payload.playerId);
  } else {
    checkAutoDismiss();
  }
});

onResponseDone((payload: { playerId: string }) => {
  if (!responsesState.isActive) return;
  if (responsesState.respondingPlayerId === payload.playerId) {
    setResponsesState("respondingPlayerId", null);
  }
  checkAutoDismiss();
});

onResponseCancel(() => {
  setResponsesState("isActive", false);
});
