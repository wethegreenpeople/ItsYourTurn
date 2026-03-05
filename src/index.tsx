/* @refresh reload */
import "../plugins/store"; // ensure Plugins/registerPlugin are initialized first
import.meta.glob("../plugins/*/index.ts", { eager: true }); // register all plugins
import { render } from "solid-js/web";
import App from "./App";

render(() => <App />, document.getElementById("root") as HTMLElement);
