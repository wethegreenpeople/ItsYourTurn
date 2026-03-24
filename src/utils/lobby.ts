export interface LobbyEntry {
  userId: string;
  roomCode: string;
  gameType: string;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: number;
}
