import { Plugin } from "./base/plugin";

export const Plugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin) {
  Plugins.push(plugin);
}
