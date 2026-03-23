/* @refresh reload */
import "./stores/index"; // ensure stores are initialized first
import.meta.glob("../plugins/**/index.ts", { eager: true }); // register all plugins
import.meta.glob("./stores/index.ts", { eager: true });
import { render } from "solid-js/web";
import { createEffect, createSignal, Show } from "solid-js";
import App from "./App";
import { LandingPage } from "./components/LandingPage";
import { joinRoom, requestJoin, leaveRoom, broadcastPlayerLeave } from "./utils/socket";
import { addPlayer, myUserId, setCurrentPlayer, gameState, resetGameState } from "./stores/gameStore";
import { announcePublicGame, stopAnnouncingGame, updateLobbyPlayerCount } from "./utils/lobby";
import { upsertSavedGame, removeSavedGame } from "./stores/savedGamesStore";

function Root() {
  const [gameStarted, setGameStarted] = createSignal(false);
  const [isHost, setIsHost] = createSignal(false);
  const [currentRoomCode, setCurrentRoomCode] = createSignal("");
  const [currentGameType, setCurrentGameType] = createSignal("");
  const [currentPlayerName, setCurrentPlayerName] = createSignal("");
  const [currentMaxPlayers, setCurrentMaxPlayers] = createSignal(2);
  const [isPublicGame, setIsPublicGame] = createSignal(false);

  // When hosting a public game: keep lobby player count in sync.
  createEffect(() => {
    if (gameStarted() && isHost() && isPublicGame()) {
      updateLobbyPlayerCount(gameState.players.length);
    }
  });

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

    joinRoom(roomCode, () => {
      setIsHost(true);
      setGameStarted(true);

      if (isPublic) {
        announcePublicGame({
          roomCode,
          gameType,
          hostName: playerName,
          currentPlayers: 1,
          maxPlayers,
        });
      }
    });
  }

  function handleJoinGame(roomCode: string, playerName: string) {
    setCurrentRoomCode(roomCode);
    setCurrentPlayerName(playerName);

    joinRoom(roomCode, () => {
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

    // Stop announcing in the public lobby if we were hosting.
    if (isHost() && isPublicGame()) {
      stopAnnouncingGame();
    }

    // Disconnect from the room channel (player stays in other clients' state).
    leaveRoom();

    // Reset local state for a clean slate if we join something else.
    resetGameState();

    setGameStarted(false);
    setIsHost(false);
    setIsPublicGame(false);
  }

  async function handleQuitGame() {
    // Remove from saved games — the player has permanently left.
    await removeSavedGame(currentRoomCode());

    // Tell the room we're permanently leaving.
    broadcastPlayerLeave(myUserId);

    // Stop announcing publicly if we were host.
    if (isHost() && isPublicGame()) {
      stopAnnouncingGame();
    }

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
