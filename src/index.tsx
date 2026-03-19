/* @refresh reload */
import "./stores/index"; // ensure stores are initialized first
import.meta.glob("../plugins/**/index.ts", { eager: true }); // register all plugins
import.meta.glob("./stores/index.ts", { eager: true });
import { render } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import App from "./App";
import { LandingPage } from "./components/LandingPage";
import { supabase } from "./utils/supabase";

function Root() {
  const [gameStarted, setGameStarted] = createSignal(false);

  async function handleHostGame(pluginId: string, playerCount: number, roomCode: string) {
    const response = await supabase.from("room").insert({ allowed_players: playerCount, join_code: roomCode, plugin: pluginId });
    setGameStarted(true);
  }

  return (
    <Show when={gameStarted()} fallback={
      <LandingPage
        onHostGame={(pluginId: string, playerCount: number, roomCode: string) => handleHostGame(pluginId, playerCount, roomCode)}
        onJoinGame={() => setGameStarted(true)}
      />
    }>
      <App />
    </Show>
  );
}

render(() => <Root />, document.getElementById("root") as HTMLElement);
