/* @refresh reload */
import "./stores/index"; // ensure stores are initialized first
import.meta.glob("../plugins/**/index.ts", { eager: true }); // register all plugins
import.meta.glob("./stores/index.ts", { eager: true });
import { render } from "solid-js/web";
import { createEffect, createSignal, Show } from "solid-js";
import App from "./App";
import { LandingPage } from "./pages/landing-page/LandingPage";
import { joinRoom, requestJoin, leaveRoom, broadcastPlayerLeave } from "./utils/socket";
import { addPlayer, myUserId, setCurrentPlayer, gameState, resetGameState } from "./stores/gameStore";
import { upsertSavedGame, removeSavedGame } from "./stores/savedGamesStore";
import { playerSettings } from "./stores/playerSettingsStore";
import { sendTurnNotification } from "./utils/notifications";
import { startWatchingRoom, stopWatchingRoom } from "./utils/notificationWatcher";
import { supabase } from "./utils/supabase";

function Root() {
  const [gameStarted, setGameStarted] = createSignal(false);
  const [isHost, setIsHost] = createSignal(false);
  const [currentRoomCode, setCurrentRoomCode] = createSignal("");
  const [currentGameType, setCurrentGameType] = createSignal("");
  const [currentPlayerName, setCurrentPlayerName] = createSignal("");
  const [currentMaxPlayers, setCurrentMaxPlayers] = createSignal(2);
  const [isPublicGame, setIsPublicGame] = createSignal(false);

  function handleHostGame(
    roomCode: string,
    playerName: string,
    isPublic: boolean,
    gameType: string,
    maxPlayers: number,
  ) {
    setCurrentRoomCode(roomCode);
    setCurrentGameType(gameType);
    setCurrentPlayerName(playerName);
    setCurrentMaxPlayers(maxPlayers);
    setIsPublicGame(isPublic);

    addPlayer(myUserId, playerName);
    setCurrentPlayer({ id: myUserId, name: playerName, score: 20 });

    joinRoom(roomCode, async () => {
      setIsHost(true);
      await supabase.from("room").insert({ allowed_players: maxPlayers, join_code: roomCode, plugin: gameType, public: isPublic, active_players: 1, active: true, host_name: playerName });
      setGameStarted(true);
    });
  }

  function handleJoinGame(roomCode: string, playerName: string) {
    stopWatchingRoom(roomCode); // stop passive watcher now that we're actively in the room
    setCurrentRoomCode(roomCode);
    setCurrentPlayerName(playerName);

    joinRoom(roomCode, async () => {
      const { data: roomData } = await supabase.from("room").select("active_players").eq("join_code", roomCode);
      if (roomData && roomData[0]) {
        await supabase.from("room").update({ active_players: roomData[0].active_players + 1 }).eq("join_code", roomCode);
      }
      setGameStarted(true);
    });
    queueMicrotask(() => {
      requestJoin(myUserId, playerName);
    });
  }

  async function saveCurrentGame() {
    const code = currentRoomCode();
    if (!code) return;
    await upsertSavedGame({
      roomCode: code,
      gameType: currentGameType() || "Unknown",
      myPlayerName: currentPlayerName(),
      maxPlayers: currentMaxPlayers(),
      savedAt: Date.now(),
    });
  }

  async function handleReturnToMenu() {
    // Save a reference to this game so the player can rejoin later.
    await saveCurrentGame();

    // Persist current game state to DB so rejoining players can restore it
    // even if no one is left in the realtime channel.
    await supabase.from("room").update({ state: JSON.parse(JSON.stringify(gameState)) }).eq("join_code", currentRoomCode());

    // Disconnect from the active game channel; the notification watcher below
    // opens its own lightweight channel on a separate topic for this room.
    leaveRoom();

    // Start passively watching for our turn so we can fire a desktop notification.
    const roomCode = currentRoomCode();
    const playerName = currentPlayerName();
    startWatchingRoom(roomCode, playerName, async (name) => {
      if (playerSettings().notificationsEnabled) {
        await sendTurnNotification(name);
      }
    });

    // Reset local UI state for a clean slate.
    resetGameState();

    setGameStarted(false);
    setIsHost(false);
    setIsPublicGame(false);
  }

  async function handleQuitGame() {
    const roomCode = currentRoomCode();

    // Remove from saved games — the player has permanently left.
    await removeSavedGame(roomCode);

    // Update DB: decrement active players, deactivate room if it hits 0.
    const { data: roomData } = await supabase.from("room").select("active_players").eq("join_code", roomCode);
    if (roomData && roomData[0]) {
      const newCount = Math.max(0, roomData[0].active_players - 1);
      await supabase.from("room").update({ active_players: newCount, active: newCount > 0 }).eq("join_code", roomCode);
    }

    // Tell the room we're permanently leaving.
    broadcastPlayerLeave(myUserId);
    stopWatchingRoom(roomCode);
    leaveRoom();
    resetGameState();

    setGameStarted(false);
    setIsHost(false);
    setIsPublicGame(false);
  }

  return (
    <Show
      when={gameStarted()}
      fallback={
        <LandingPage
          onHostGame={handleHostGame}
          onJoinGame={handleJoinGame}
        />
      }
    >
      <App
        isHost={isHost()}
        onReturnToMenu={handleReturnToMenu}
        onQuitGame={handleQuitGame}
      />
    </Show>
  );
}

render(() => <Root />, document.getElementById("root") as HTMLElement);
