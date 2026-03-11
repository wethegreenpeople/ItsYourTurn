import { Plugin } from "../../plugins/base/plugin"

export const Plugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin) {
  Plugins.push(plugin);
}
