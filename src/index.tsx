/* @refresh reload */
import "./stores/index"; // ensure stores are initialized first
import.meta.glob("../plugins/**/index.ts", { eager: true }); // register all plugins
import.meta.glob("./stores/index.ts", { eager: true });
import { render } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import App from "./App";
import { LandingPage } from "./components/LandingPage";

function Root() {
  const [gameStarted, setGameStarted] = createSignal(false);

  return (
    <Show when={gameStarted()} fallback={
      <LandingPage
        onHostGame={() => setGameStarted(true)}
        onJoinGame={() => setGameStarted(true)}
      />
    }>
      <App />
    </Show>
  );
}

render(() => <Root />, document.getElementById("root") as HTMLElement);
