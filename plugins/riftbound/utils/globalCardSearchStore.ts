import { createSignal } from "solid-js";

const [searchOpen, setSearchOpen] = createSignal(false);

export const isGlobalSearchOpen = searchOpen;
export const openGlobalSearch = () => setSearchOpen(true);
export const closeGlobalSearch = () => setSearchOpen(false);
