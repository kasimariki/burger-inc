import { create } from "zustand";
import type { GameState } from "../game/models/types";
import { getInitialGameState, processTurn } from "../game/engine/turn";
import { openStore, hireStaff, addMenuItem, assignStaffToStore, addMenuToStore } from "../game/engine/actions";
import { buildBurger, initializeIngredients } from "../game/engine/menu-builder";
import { saveGame, loadGame, saveTurnSnapshot } from "../services/api";
import { saveLocal, loadLocal } from "../services/local-storage";

const USER_ID = "user-001"; // 後でAuth実装
const USER_NAME = "プレイヤー1";

interface GameStore {
  game: GameState;
  prevGame: GameState | null;
  isSaving: boolean;
  processTurn: () => void;
  openStore: (store: Parameters<typeof openStore>[1]) => void;
  hireStaff: (staff: Parameters<typeof hireStaff>[1]) => void;
  addMenuItem: (item: Parameters<typeof addMenuItem>[1]) => void;
  buildBurger: (input: Parameters<typeof buildBurger>[1]) => void;
  assignStaffToStore: (staffId: string, storeId: string) => void;
  addMenuToStore: (menuItemId: string, storeId: string) => void;
  save: () => Promise<void>;
  load: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: initializeIngredients(getInitialGameState()),
  prevGame: null,
  isSaving: false,

  processTurn: () => {
    set((s) => ({ prevGame: s.game, game: processTurn(s.game) }));
    const g = get().game;
    // ターン進行ごとにオートセーブ + スナップショット送信（非同期・エラーは無視）
    saveLocal(g).catch(() => undefined);
    const stores = Object.values(g.stores);
    const avgRep = stores.length > 0
      ? stores.reduce((sum, s) => sum + s.reputation, 0) / stores.length
      : 0;
    saveTurnSnapshot(USER_ID, 1, {
      turnNumber: g.turn,
      cash: g.finances.cash,
      weeklyRevenue: g.finances.weeklyRevenue,
      weeklyExpenses: g.finances.weeklyExpenses,
      netProfit: g.finances.weeklyRevenue - g.finances.weeklyExpenses,
      avgReputation: avgRep,
      storeCount: stores.length,
      brandScore: g.brandScore,
    }).catch(() => undefined);
  },

  openStore: (store) =>
    set((s) => ({ game: openStore(s.game, store) })),

  hireStaff: (staff) =>
    set((s) => ({ game: hireStaff(s.game, staff) })),

  addMenuItem: (item) =>
    set((s) => ({ game: addMenuItem(s.game, item) })),

  buildBurger: (input) =>
    set((s) => ({ game: buildBurger(s.game, input) })),

  assignStaffToStore: (staffId, storeId) =>
    set((s) => ({ game: assignStaffToStore(s.game, staffId, storeId) })),

  addMenuToStore: (menuItemId, storeId) =>
    set((s) => ({ game: addMenuToStore(s.game, menuItemId, storeId) })),

  save: async () => {
    set({ isSaving: true });
    const game = get().game;
    // APIとローカル両方に保存（並行実行）
    await Promise.all([
      saveGame(USER_ID, USER_NAME, game),
      saveLocal(game),
    ]);
    set({ isSaving: false });
  },

  load: async () => {
    // まずAPIから試み、失敗したらローカルから読む
    try {
      const data = await loadGame(USER_ID);
      if (data?.gameState) {
        set({ game: data.gameState });
        return;
      }
    } catch {
      // API失敗時はローカルにフォールバック
    }
    const localData = await loadLocal();
    if (localData) {
      set({ game: localData });
    }
  },
}));
