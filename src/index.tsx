/* @refresh reload */
import "./stores/index"; // ensure stores are initialized first
import.meta.glob("../plugins/**/index.ts", { eager: true }); // register all plugins
import.meta.glob("./stores/index.ts", { eager: true });
import { render } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import App from "./App";
import { LandingPage } from "./components/LandingPage";
import { hostRoom, joinRoom } from "./utils/socket";
import { addPlayer } from "./stores/gameStore";

function Root() {
  const [gameStarted, setGameStarted] = createSignal(false);

  function handleHostGame(roomCode: string) {
    hostRoom(roomCode);
    setGameStarted(true);
  }

  function handleJoinGame(roomCode: string) {
    joinRoom(roomCode);
    addPlayer({ id: "p2", name: "ASS", score: 20 });
    setGameStarted(true);
  }

  return (
    <Show when={gameStarted()} fallback={
      <LandingPage
        onHostGame={handleHostGame}
        onJoinGame={handleJoinGame}
      />
    }>
      <App />
    </Show>
  );
}

render(() => <Root />, document.getElementById("root") as HTMLElement);
