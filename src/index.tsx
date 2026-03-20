/* @refresh reload */
import "./stores/index"; // ensure stores are initialized first
import.meta.glob("../plugins/**/index.ts", { eager: true }); // register all plugins
import.meta.glob("./stores/index.ts", { eager: true });
import { render } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import App from "./App";
import { LandingPage } from "./components/LandingPage";
import { joinRoom, requestJoin } from "./utils/socket";
import { addPlayer, myUserId, setCurrentPlayer } from "./stores/gameStore";

function Root() {
  const [gameStarted, setGameStarted] = createSignal(false);
  const [isHost, setIsHost] = createSignal(false);

  function handleHostGame(roomCode: string, playerName: string) {
    // Host adds themselves locally first, then joins the room.
    addPlayer(myUserId, playerName);
    setCurrentPlayer({ id: myUserId, name: playerName, score: 20 });

    joinRoom(roomCode, () => {
      setIsHost(true);
      setGameStarted(true);
    });
  }

  function handleJoinGame(roomCode: string, playerName: string) {
    // Join the room. Once subscribed, ask the host to add us.
    // onReady fires after we receive the game state back with us in it.
    joinRoom(roomCode, () => {
      setGameStarted(true);
    });
    // We need the channel to be set up before requesting join,
    // so we do it in a microtask to let joinRoom's subscribe fire first.
    queueMicrotask(() => {
      requestJoin(myUserId, playerName);
    });
  }

  return (
    <Show when={gameStarted()} fallback={
      <LandingPage
        onHostGame={handleHostGame}
        onJoinGame={handleJoinGame}
      />
    }>
      <App isHost={isHost()} />
    </Show>
  );
}

render(() => <Root />, document.getElementById("root") as HTMLElement);
