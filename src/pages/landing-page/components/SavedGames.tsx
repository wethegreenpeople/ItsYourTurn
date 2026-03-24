import { For } from "solid-js";
import { SavedGame } from "../../../stores/savedGamesStore";

export const SavedGamesList = (props: { savedGames: SavedGame[], onJoinGame: (roomCode: string, myPlayerName: string) => void, removeSavedGame: (roomCode: string) => void }) => (
    <div class="flex flex-col gap-1.5">
      <For each={props.savedGames}>
        {(game) => (
          <div class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[9px] bg-surface/80 border border-rim/50
                      transition-[border-color] duration-150 hover:border-text-muted/30">
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-cinzel font-semibold text-sm tracking-[.06em] text-text">{game.roomCode}</span>
                <span class="text-[.65rem] px-1.5 py-0.5 rounded bg-rim/35 text-text-muted/60">{game.gameType}</span>
              </div>
              <span class="text-[.7rem] text-text-muted/35">{game.myPlayerName} · {new Date(game.savedAt).toLocaleDateString()}</span>
            </div>
            <button
              class="px-3 py-1 rounded-md border border-text-muted/25 bg-text-muted/7 text-text-muted/80
                     text-[.78rem] font-semibold tracking-wide cursor-pointer whitespace-nowrap flex-shrink-0
                     transition-colors duration-150 hover:bg-text-muted/14 hover:border-text-muted/45 hover:text-text"
              onClick={() => props.onJoinGame(game.roomCode, game.myPlayerName)}
            >Rejoin</button>
            <button
              class="w-[22px] h-[22px] rounded flex items-center justify-center border-none bg-transparent
                     text-text-muted/20 cursor-pointer text-[.65rem] flex-shrink-0
                     transition-colors duration-150 hover:text-danger/65 hover:bg-danger/8"
              onClick={() => props.removeSavedGame(game.roomCode)} title="Remove"
            >✕</button>
          </div>
        )}
      </For>
    </div>
  );
