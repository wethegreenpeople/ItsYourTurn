import { createSignal } from "solid-js";

const [_selectedIds, _setSelectedIds] = createSignal<Set<string>>(new Set());

export const selectedIds = _selectedIds;
export const isSelected = (id: string) => _selectedIds().has(id);
export const clearSelection = () => _setSelectedIds(new Set());
export const setSelection = (ids: string[]) => _setSelectedIds(new Set(ids));
export const getSelectedIds = () => _selectedIds();
