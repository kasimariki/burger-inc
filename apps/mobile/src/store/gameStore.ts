import { create } from "zustand";
import type { GameState, ActiveSupplier, BrandPositioning, CityStatus } from "../game/models/types";
import { getInitialGameState, processTurn } from "../game/engine/turn";
import { openStore, hireStaff, addMenuItem, assignStaffToStore, addMenuToStore } from "../game/engine/actions";
import { buildBurger, initializeIngredients } from "../game/engine/menu-builder";
import { calcBrandConsistency, calcBrandScoreDelta } from "../game/engine/brand";
import {
  saveGame, loadGame, saveTurnSnapshot,
  submitWeeklyFeedback, updateBrandProfile,
  getMe, fetchCityStatus, checkCityUnlock,
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
  profitHistory: { turn: number; netProfit: number }[];
  cityStatuses: CityStatus[];
  userId: string;
  userName: string;
  processTurn: () => void;
  openStore: (store: Parameters<typeof openStore>[1]) => void;
  hireStaff: (staff: Parameters<typeof hireStaff>[1]) => void;
  addMenuItem: (item: Parameters<typeof addMenuItem>[1]) => void;
  buildBurger: (input: Parameters<typeof buildBurger>[1]) => void;
  assignStaffToStore: (staffId: string, storeId: string) => void;
  addMenuToStore: (menuItemId: string, storeId: string) => void;
  contractSupplier: (supplier: ActiveSupplier) => void;
  setBrandPositioning: (positioning: BrandPositioning) => void;
  refreshCityStatus: () => Promise<void>;
  checkAndUnlockCities: () => Promise<string[]>;
  save: () => Promise<void>;
  load: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: initializeIngredients(getInitialGameState()),
  prevGame: null,
  isSaving: false,
  profitHistory: [],
  cityStatuses: [],
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
    const prevGame = get().game;
    const nextGame = processTurn(prevGame);
    const weeklyProfit = nextGame.finances.weeklyRevenue - nextGame.finances.weeklyExpenses;
    set((s) => ({
      prevGame,
      game: nextGame,
      profitHistory: [
        ...s.profitHistory.slice(-7),
        { turn: prevGame.turn, netProfit: weeklyProfit },
      ],
    }));

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

    // セーブ後に都市解禁チェック（非同期、エラーは無視）
    get().checkAndUnlockCities().catch(() => undefined);
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

  contractSupplier: (supplier) =>
    set((s) => ({ game: { ...s.game, activeSupplier: supplier } })),

  setBrandPositioning: (positioning) =>
    set((s) => {
      const menus = Object.values(s.game.menu).map(m => ({ tasteScore: m.tasteScore, price: m.price }));
      const consistency = calcBrandConsistency(positioning, menus);
      const openStores = Object.values(s.game.stores).filter(st => st.isOpen);
      const avgRating = openStores.length > 0
        ? openStores.reduce((sum, st) => sum + st.reputation, 0) / openStores.length / 20
        : 1;
      const delta = calcBrandScoreDelta(consistency, avgRating, 0);
      return {
        game: {
          ...s.game,
          brandProfile: {
            ...s.game.brandProfile,
            positioning,
            brandConsistency: consistency,
            weeklyScoreDelta: delta,
          },
        },
      };
    }),

  refreshCityStatus: async () => {
    const { userId } = get();
    const data = await fetchCityStatus(userId, SLOT_ID);
    if (Array.isArray(data)) {
      set({ cityStatuses: data });
    }
  },

  checkAndUnlockCities: async () => {
    const game = get().game;
    const { userId } = get();
    const storeCount = Object.keys(game.stores).length;
    const result = await checkCityUnlock(
      userId, String(SLOT_ID),
      game.brandProfile.brandScore,
      storeCount,
      game.finances.cash
    );
    if (result?.newlyUnlocked?.length) {
      // 解禁された都市をローカル反映
      set((s) => ({
        cityStatuses: s.cityStatuses.map(c =>
          result.totalUnlocked.includes(c.id) ? { ...c, isUnlocked: true } : c
        ),
      }));
    }
    return result?.newlyUnlocked ?? [];
  },

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
    const applyMigration = (gs: GameState): GameState => ({
      ...gs,
      stores: Object.fromEntries(
        Object.entries(gs.stores).map(([id, s]) => [
          id,
          { ...s, cityId: s.cityId ?? "midvale" },
        ])
      ),
      brandProfile: gs.brandProfile ?? {
        positioning: "standard",
        brandScore: 50,
        brandConsistency: 70,
        weeklyScoreDelta: 0,
      },
    });

    try {
      const data = await loadGame(userId, SLOT_ID);
      if (data?.gameState) {
        set({ game: applyMigration(data.gameState) });
        return;
      }
    } catch {
      // API失敗時はローカルにフォールバック
    }
    const localData = await loadLocal();
    if (localData) {
      set({ game: applyMigration(localData) });
    }
  },
}));
