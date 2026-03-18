import { Plugin } from "../../plugins/base/plugin"

export const Plugins: Plugin[] = [];

let _activePlugin: Plugin | null = null;

export function registerPlugin(plugin: Plugin) {
  Plugins.push(plugin);
}

export function setActivePlugin(plugin: Plugin) {
  _activePlugin = plugin;
}

export function getActivePlugin(): Plugin | null {
  return _activePlugin;
}
