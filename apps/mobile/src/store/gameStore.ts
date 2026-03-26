import { create } from "zustand";
import type { GameState } from "../game/models/types";
import { getInitialGameState } from "../game/engine/turn";
import { processTurn } from "../game/engine/turn";
import { openStore, hireStaff, addMenuItem, assignStaffToStore, addMenuToStore } from "../game/engine/actions";

interface GameStore {
  game: GameState;
  processTurn: () => void;
  openStore: (store: Parameters<typeof openStore>[1]) => void;
  hireStaff: (staff: Parameters<typeof hireStaff>[1]) => void;
  addMenuItem: (item: Parameters<typeof addMenuItem>[1]) => void;
  assignStaffToStore: (staffId: string, storeId: string) => void;
  addMenuToStore: (menuItemId: string, storeId: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: getInitialGameState(),

  processTurn: () =>
    set((s) => ({ game: processTurn(s.game) })),

  openStore: (store) =>
    set((s) => ({ game: openStore(s.game, store) })),

  hireStaff: (staff) =>
    set((s) => ({ game: hireStaff(s.game, staff) })),

  addMenuItem: (item) =>
    set((s) => ({ game: addMenuItem(s.game, item) })),

  assignStaffToStore: (staffId, storeId) =>
    set((s) => ({ game: assignStaffToStore(s.game, staffId, storeId) })),

  addMenuToStore: (menuItemId, storeId) =>
    set((s) => ({ game: addMenuToStore(s.game, menuItemId, storeId) })),
}));
