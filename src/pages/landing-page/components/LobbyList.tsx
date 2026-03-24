import { LobbyEntry } from "../../../utils/lobby";
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";

 export const LobbyList = (props: { availableGames: LobbyEntry[], closeLobby: () => void, joinGame: (roomCode: string, playerName: string) => void, playerName: string }) => (
   <div class="flex flex-col gap-2.5">
     <Show
       when={props.availableGames.length > 0}
       fallback={
         <div class="flex flex-col items-center gap-3 py-10 rounded-xl bg-surface/70 border border-dashed border-rim/50">
           <span class="text-[2rem] opacity-20">🏟</span>
           <p class="text-[.82rem] m-0 text-text-muted/30">No public games right now</p>
           <p class="text-[.72rem] m-0 text-text-muted/20">Host one to get started!</p>
         </div>
       }
     >
       <For each={props.availableGames}>
         {(game) => (
           <div class="flex items-center gap-3.5 px-4 py-3.5 rounded-[10px] bg-surface/90 border border-rim/60
                       transition-[border-color] duration-150 hover:border-text-muted/30">
             <div class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-[1.1rem]
                         bg-white/4 border border-rim/50">⚔</div>
             <div class="flex flex-col gap-1 flex-1 min-w-0">
               <span class="font-cinzel font-semibold text-sm text-text tracking-wide">{game.gameType}</span>
               <div class="flex items-center gap-2 flex-wrap">
                 <span class="text-[.72rem] text-text-muted/40">
                   Hosted by <span class="text-text-muted/65">{game.hostName}</span>
                 </span>
                 <span class="text-rim/80 text-[.55rem]">•</span>
                 <span class="text-[.7rem] font-cinzel font-bold tracking-wider text-gold/60">{game.roomCode}</span>
               </div>
             </div>
             <div class="flex flex-col items-end gap-2">
               <div class="flex gap-1 items-center flex-shrink-0">
                 <For each={Array.from({ length: game.maxPlayers }, (_, i) => i)}>
                   {(i) => (
                     <div
                       class="w-2 h-2 rounded-full transition-[background,box-shadow] duration-200"
                       classList={{
                         "bg-gold shadow-[0_0_5px_rgba(245,203,92,.4)]": i < game.currentPlayers,
                         "bg-rim/70": i >= game.currentPlayers,
                       }}
                     />
                   )}
                 </For>
               </div>
               <span class="text-[.65rem] text-text-muted/30">{game.currentPlayers}/{game.maxPlayers}</span>
             </div>
             <button
               class="px-3.5 py-1.5 rounded-[7px] border border-gold/40 bg-gold/10 text-gold
                      font-cinzel text-[.72rem] font-semibold tracking-wider cursor-pointer whitespace-nowrap flex-shrink-0
                      transition-colors duration-150 hover:bg-gold/18 hover:border-gold/65 hover:shadow-[0_2px_12px_rgba(245,203,92,.12)]"
               onClick={() => { props.closeLobby(); props.joinGame(game.roomCode, props.playerName.trim() || "Player"); }}
             >Join</button>
           </div>
         )}
       </For>
     </Show>
   </div>
 );
