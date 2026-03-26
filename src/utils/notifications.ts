const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function sendTurnNotification(playerName: string) {
  if (isTauri()) {
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
  } else if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification("Your Turn!", { body: `${playerName}, it's your turn.` });
    }
  }
}
