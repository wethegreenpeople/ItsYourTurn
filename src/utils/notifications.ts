const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function sendTurnNotification(playerName: string) {
  if (!isTauri()) return;
  const { isPermissionGranted, requestPermission, sendNotification } =
    await import("@tauri-apps/plugin-notification");
  let granted = await isPermissionGranted();
  if (!granted) {
    const perm = await requestPermission();
    granted = perm === "granted";
  }
  if (granted) {
    sendNotification({ title: "Your Turn!", body: `${playerName}, it's your turn.` });
  }
}
