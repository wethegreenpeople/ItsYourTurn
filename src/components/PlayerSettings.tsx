import { playerSettings, updatePlayerSettings } from "../stores/playerSettingsStore";

interface PlayerSettingsProps {
  onClose: () => void;
}

export function PlayerSettings(props: PlayerSettingsProps) {
  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background:rgba(0,0,0,.65); backdrop-filter:blur(4px);"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <style>{`
        @keyframes panel-in {
          from { opacity:0; transform:scale(.91) translateY(16px); }
          to   { opacity:1; transform:scale(1)    translateY(0); }
        }
        .settings-panel { animation: panel-in .32s cubic-bezier(.175,.885,.32,1.275) both; }
        .pill-toggle {
          position:relative; width:44px; height:24px; border-radius:12px;
          border:1px solid rgba(58,61,84,.8); cursor:pointer;
          transition: background .2s ease, border-color .2s ease;
          flex-shrink:0;
        }
        .pill-toggle--on  { background:rgba(201,168,76,.25); border-color:rgba(201,168,76,.5); }
        .pill-toggle--off { background:rgba(20,22,40,.8); }
        .pill-thumb {
          position:absolute; top:3px; width:16px; height:16px; border-radius:50%;
          transition: left .18s ease, background .2s ease;
        }
        .pill-toggle--on  .pill-thumb { left:23px; background:#c9a84c; box-shadow:0 0 6px rgba(201,168,76,.6); }
        .pill-toggle--off .pill-thumb { left:3px;  background:rgba(197,195,216,.3); }
      `}</style>

      <div
        class="settings-panel modal-top-accent relative"
        style="
          background:linear-gradient(160deg,#12162a 0%,#0d1020 100%);
          border:1px solid rgba(58,61,84,.9);
          border-radius:16px;
          width:360px;
          padding:28px 28px 24px;
          box-shadow:0 24px 64px rgba(0,0,0,.7), 0 0 0 1px rgba(201,168,76,.06);
        "
      >
        {/* Header */}
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <div>
            <div style="font-family:'Rajdhani',sans-serif; font-size:1.3rem; font-weight:700; letter-spacing:.12em; color:#c9a84c;">
              SETTINGS
            </div>
            <div style="width:40px; height:1px; background:linear-gradient(90deg,#c9a84c,transparent); margin-top:4px;" />
          </div>
          <button
            onClick={props.onClose}
            style="
              width:30px; height:30px; border-radius:8px; border:1px solid rgba(58,61,84,.8);
              background:rgba(255,255,255,.04); color:rgba(197,195,216,.6);
              font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center;
              transition:all .15s ease;
            "
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "#c5c3d8";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(197,195,216,.6)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Notification row */}
        <div style="
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 16px; border-radius:10px;
          background:rgba(255,255,255,.03); border:1px solid rgba(58,61,84,.6);
        ">
          <div>
            <div style="font-family:'Rajdhani',sans-serif; font-weight:600; font-size:.95rem; letter-spacing:.04em; color:#c5c3d8;">
              Turn Notifications
            </div>
            <div style="font-size:.78rem; color:rgba(197,195,216,.4); margin-top:2px; font-family:'Rajdhani',sans-serif;">
              Desktop alert 10s after your turn starts (when away)
            </div>
          </div>
          <button
            class={`pill-toggle ${playerSettings().notificationsEnabled ? "pill-toggle--on" : "pill-toggle--off"}`}
            onClick={() => updatePlayerSettings({ notificationsEnabled: !playerSettings().notificationsEnabled })}
            title={playerSettings().notificationsEnabled ? "Disable turn notifications" : "Enable turn notifications"}
          >
            <div class="pill-thumb" />
          </button>
        </div>
      </div>
    </div>
  );
}
