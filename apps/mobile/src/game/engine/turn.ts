import type { GameState } from "../models/types";
import { calcWeeklyRevenue, calcWeeklyExpenses } from "../simulation/sales";
import { advanceMacroEconomy } from "./macro";
import { processEvents, getActiveEventModifiers } from "../events/event-engine";

export function processTurn(state: GameState): GameState {
  // 1. マクロ経済を進行
  const newEconomy = advanceMacroEconomy(state.economy);

  // 2. イベント処理（新イベント発生 + ブランド/キャッシュへの即時影響）
  const stateAfterEvents = processEvents({ ...state, economy: newEconomy });

  // 3. アクティブイベントの倍率を取得
  const modifiers = getActiveEventModifiers(stateAfterEvents.activeEvents);

  // 4. 全店舗の売上・コストを計算（イベント倍率適用）
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const store of Object.values(stateAfterEvents.stores)) {
    if (!store.isOpen) continue;

    const revenue = calcWeeklyRevenue(store, stateAfterEvents.menu, newEconomy);
    const expenses = calcWeeklyExpenses(store, stateAfterEvents.staff, stateAfterEvents.menu, newEconomy);

    totalRevenue += Math.round(revenue * (modifiers.revenue ?? 1) * (modifiers.customerFlow ?? 1));
    totalExpenses += Math.round(expenses * (modifiers.expenses ?? 1));
  }

  const cashDelta = totalRevenue - totalExpenses;
  const newCash = stateAfterEvents.finances.cash + cashDelta;

  // 5. activeEvents の期限切れを処理
  const activeEvents = stateAfterEvents.activeEvents
    .map(e => ({ ...e, duration: e.duration - 1 }))
    .filter(e => e.duration > 0);

  return {
    ...stateAfterEvents,
    turn: state.turn + 1,
    economy: newEconomy,
    finances: {
      cash: newCash,
      totalRevenue: stateAfterEvents.finances.totalRevenue + totalRevenue,
      totalExpenses: stateAfterEvents.finances.totalExpenses + totalExpenses,
      netProfit: newCash - 50000,
      weeklyRevenue: totalRevenue,
      weeklyExpenses: totalExpenses,
    },
    activeEvents,
  };
}

export function getInitialGameState(): GameState {
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
    stores: {},
    staff: {},
    menu: {},
    ingredients: {},
    economy: {
      phase: "boom",
      interestRate: 0.03,
      inflationRate: 0.02,
      consumerConfidence: 70,
      turnsInPhase: 0,
    },
    brandScore: 50,
    events: [],
    activeEvents: [],
  };
}
