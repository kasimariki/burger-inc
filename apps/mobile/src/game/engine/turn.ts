import type { GameState } from "../models/types";
import { calcWeeklyRevenue, calcWeeklyExpenses } from "../simulation/sales";
import { advanceMacroEconomy } from "./macro";
import { processEvents, getActiveEventModifiers } from "../events/event-engine";
import { applyBrandScoreToState } from "./brand";
import { GAME_CONFIG } from "@burger-inc/shared";

export function processTurn(state: GameState): GameState {
  // 1. マクロ経済を進行
  const newEconomy = advanceMacroEconomy(state.economy);

  // 2. イベント処理（新イベント発生 + ブランド/キャッシュへの即時影響）
  const stateAfterEvents = processEvents({ ...state, economy: newEconomy });

  // 3. アクティブイベントの倍率を取得
  const modifiers = getActiveEventModifiers(stateAfterEvents.activeEvents);

  // 4. 全店舗の売上・コストを計算（イベント倍率 + サプライヤー適用）
  const supplier = stateAfterEvents.activeSupplier ?? null;
  const supplierCostMult = supplier?.costMultiplier ?? 1;
  const supplierQualityBonus = supplier?.qualityBonus ?? 0;

  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const store of Object.values(stateAfterEvents.stores)) {
    if (!store.isOpen) continue;

    const revenue = calcWeeklyRevenue(store, stateAfterEvents.menu, newEconomy, supplierQualityBonus);
    const expenses = calcWeeklyExpenses(store, stateAfterEvents.staff, stateAfterEvents.menu, newEconomy, supplierCostMult, supplierQualityBonus);

    totalRevenue += Math.round(revenue * (modifiers.revenue ?? 1) * (modifiers.customerFlow ?? 1));
    totalExpenses += Math.round(expenses * (modifiers.expenses ?? 1));
  }

  // 5. 税引後収益を計算し、cashDelta を確定
  const revenueAfterTax = Math.round(totalRevenue * (1 - GAME_CONFIG.economy.taxRate));
  const cashDelta = revenueAfterTax - totalExpenses;
  const newCash = stateAfterEvents.finances.cash + cashDelta;

  // 6. activeEvents の期限切れを処理
  const activeEvents = stateAfterEvents.activeEvents
    .map(e => ({ ...e, duration: e.duration - 1 }))
    .filter(e => e.duration > 0);

  // 7. ブランドスコアを更新（店舗 reputation の平均を avgRating に変換）
  const openStoreList = Object.values(stateAfterEvents.stores).filter(s => s.isOpen);
  const avgRating = openStoreList.length > 0
    ? openStoreList.reduce((sum, s) => sum + s.reputation, 0) / openStoreList.length / 20
    : 1;
  const newBrandProfile = applyBrandScoreToState(stateAfterEvents, avgRating, 0);

  return {
    ...stateAfterEvents,
    turn: state.turn + 1,
    economy: newEconomy,
    finances: {
      cash: newCash,
      totalRevenue: stateAfterEvents.finances.totalRevenue + totalRevenue,
      totalExpenses: stateAfterEvents.finances.totalExpenses + totalExpenses,
      netProfit: stateAfterEvents.finances.netProfit + cashDelta,
      weeklyRevenue: revenueAfterTax,
      weeklyExpenses: totalExpenses,
    },
    activeEvents,
    brandProfile: newBrandProfile,
  };
}

export function getInitialGameState(): GameState {
  const STORE_ID = "store-tutorial-001";
  const COOK_ID = "staff-tutorial-cook";
  const CASHIER_ID = "staff-tutorial-cashier";
  const BURGER_ID = "menu-tutorial-burger";

  return {
    turn: 1,
    finances: {
      cash: 50000,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      weeklyRevenue: 0,
      weeklyExpenses: 0,
    },
    stores: {
      [STORE_ID]: {
        id: STORE_ID,
        name: "Starter Shack",
        city: "Tokyo",
        type: "street",
        rent: 2500,
        capacity: 100,
        staffIds: [COOK_ID, CASHIER_ID],
        menuItemIds: [BURGER_ID],
        isOpen: true,
        cleanliness: 80,
        reputation: 50,
      },
    },
    staff: {
      [COOK_ID]: {
        id: COOK_ID,
        name: "Hiro",
        role: "cook",
        skillLevel: 3,
        salary: 2000,
        satisfaction: 70,
        loyalty: 60,
        turnsEmployed: 0,
      },
      [CASHIER_ID]: {
        id: CASHIER_ID,
        name: "Mika",
        role: "cashier",
        skillLevel: 2,
        salary: 1800,
        satisfaction: 70,
        loyalty: 60,
        turnsEmployed: 0,
      },
    },
    menu: {
      [BURGER_ID]: {
        id: BURGER_ID,
        name: "Classic Burger",
        category: "burger",
        price: 9,
        cost: 3,
        tags: ["classic"],
        tasteScore: 55,
        popularity: 50,
        cookTime: 3,
        developmentTurns: 1,
      },
    },
    ingredients: {},
    economy: {
      phase: "boom",
      interestRate: 0.03,
      inflationRate: 0.02,
      consumerConfidence: 80,  // 70→80: 序盤は好況スタート
      turnsInPhase: 0,
    },
    brandScore: 50,
    brandProfile: {
      positioning: "standard",
      brandScore: 50,
      brandConsistency: 70,
      weeklyScoreDelta: 0,
    },
    events: [],
    activeEvents: [],
    activeSupplier: null,
  };
}
