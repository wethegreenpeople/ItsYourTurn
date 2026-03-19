import { createSignal } from "solid-js";

const [_selectedIds, _setSelectedIds] = createSignal<Set<string>>(new Set());
const [_isSelectMode, _setIsSelectMode] = createSignal(false);

export const selectedIds = _selectedIds;
export const isSelectMode = _isSelectMode;
export const isSelected = (id: string) => _selectedIds().has(id);
export const getSelectedIds = () => _selectedIds();

export const clearSelection = () => {
  _setSelectedIds(new Set());
  _setIsSelectMode(false);
};

export const setSelection = (ids: string[]) => _setSelectedIds(new Set(ids));

/** Enter touch-based multi-select mode with an initial anchor card. */
export const enterSelectMode = (anchorId: string) => {
  _setIsSelectMode(true);
  _setSelectedIds(new Set([anchorId]));
};

/** Toggle a card in/out of the selection; exit select mode when the set empties. */
export const toggleSelected = (id: string) => {
  _setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    if (next.size === 0) _setIsSelectMode(false);
    return next;
  });
};
