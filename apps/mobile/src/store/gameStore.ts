import { create } from "zustand";
import type { GameState } from "../game/models/types";
import { getInitialGameState, processTurn } from "../game/engine/turn";
import { openStore, hireStaff, addMenuItem, assignStaffToStore, addMenuToStore } from "../game/engine/actions";
import { buildBurger, initializeIngredients } from "../game/engine/menu-builder";
import {
  saveGame, loadGame, saveTurnSnapshot,
  submitWeeklyFeedback, updateBrandProfile,
  getMe,
  type StoreMetricsInput,
} from "../services/api";
import { saveLocal, loadLocal } from "../services/local-storage";

const DEFAULT_USER_ID = "user-001";
const DEFAULT_USER_NAME = "プレイヤー1";
const SLOT_ID = 1;

interface GameStore {
  game: GameState;
  prevGame: GameState | null;
  isSaving: boolean;
  userId: string;
  userName: string;
  processTurn: () => void;
  openStore: (store: Parameters<typeof openStore>[1]) => void;
  hireStaff: (staff: Parameters<typeof hireStaff>[1]) => void;
  addMenuItem: (item: Parameters<typeof addMenuItem>[1]) => void;
  buildBurger: (input: Parameters<typeof buildBurger>[1]) => void;
  assignStaffToStore: (staffId: string, storeId: string) => void;
  addMenuToStore: (menuItemId: string, storeId: string) => void;
  save: () => Promise<void>;
  load: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: initializeIngredients(getInitialGameState()),
  prevGame: null,
  isSaving: false,
  userId: DEFAULT_USER_ID,
  userName: DEFAULT_USER_NAME,

  initAuth: async () => {
    try {
      const me = await getMe();
      if (me) {
        set({ userId: me.userId, userName: me.name });
      }
    } catch {
      // 自動登録はauthFetch内で処理される
    }
  },

  processTurn: () => {
    set((s) => ({ prevGame: s.game, game: processTurn(s.game) }));
    const g = get().game;
    const { userId } = get();

    // ターン進行ごとにオートセーブ + スナップショット送信（非同期・エラーは無視）
    saveLocal(g).catch(() => undefined);

    const stores = Object.values(g.stores);
    const avgRep = stores.length > 0
      ? stores.reduce((sum, s) => sum + s.reputation, 0) / stores.length
      : 0;

    saveTurnSnapshot(userId, SLOT_ID, {
      turnNumber: g.turn,
      cash: g.finances.cash,
      weeklyRevenue: g.finances.weeklyRevenue,
      weeklyExpenses: g.finances.weeklyExpenses,
      netProfit: g.finances.weeklyRevenue - g.finances.weeklyExpenses,
      avgReputation: avgRep,
      storeCount: stores.length,
      brandScore: g.brandScore,
    }).catch(() => undefined);

    // WeeklyFeedback送信（店舗がある場合のみ）
    if (stores.length > 0) {
      const storeMetrics: StoreMetricsInput[] = stores.map((store) => {
        const storeStaff = store.staffIds
          .map((sid: string) => g.staff[sid])
          .filter(Boolean);
        const storeMenus = store.menuItemIds
          .map((mid: string) => g.menu[mid])
          .filter(Boolean);
        const avgSkill = storeStaff.length > 0
          ? storeStaff.reduce((sum: number, s: { skillLevel: number }) => sum + s.skillLevel, 0) / storeStaff.length
          : 0;
        const avgTaste = storeMenus.length > 0
          ? storeMenus.reduce((sum: number, m: { tasteScore: number }) => sum + m.tasteScore, 0) / storeMenus.length
          : 0;
        const avgPrice = storeMenus.length > 0
          ? storeMenus.reduce((sum: number, m: { price: number }) => sum + m.price, 0) / storeMenus.length
          : 0;

        return {
          storeId: store.id,
          staffCount: storeStaff.length,
          capacity: store.capacity,
          avgSkillLevel: avgSkill,
          cleanliness: store.cleanliness,
          avgTasteScore: avgTaste,
          avgMenuPrice: avgPrice,
          currentReputation: store.reputation,
        };
      });

      submitWeeklyFeedback(userId, SLOT_ID, g.turn, storeMetrics).catch(() => undefined);
    }

    // BrandProfile更新
    const menus = Object.values(g.menu).map((m: { tasteScore: number; price: number }) => ({
      tasteScore: m.tasteScore,
      price: m.price,
    }));
    updateBrandProfile(userId, {
      slotId: SLOT_ID,
      brandScore: g.brandScore,
      menus,
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
    const { game, userId, userName } = get();
    // APIとローカル両方に保存（並行実行）
    await Promise.all([
      saveGame(userId, userName, game, SLOT_ID).catch(() => undefined),
      saveLocal(game),
    ]);
    set({ isSaving: false });
  },

  load: async () => {
    const { userId } = get();
    // まずAPIから試み、失敗したらローカルから読む
    try {
      const data = await loadGame(userId, SLOT_ID);
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
