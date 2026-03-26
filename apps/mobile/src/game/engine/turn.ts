import type { GameState, GameEvent } from "../models/types";
import { calcWeeklyRevenue, calcWeeklyExpenses } from "../simulation/sales";
import { advanceMacroEconomy } from "./macro";

export function processTurn(state: GameState): GameState {
  const newEconomy = advanceMacroEconomy(state.economy);
  const events: GameEvent[] = [];
  let cashDelta = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;

  // 全店舗の売上・コストを計算
  for (const store of Object.values(state.stores)) {
    if (!store.isOpen) continue;

    const revenue = calcWeeklyRevenue(store, state.menu, newEconomy);
    const expenses = calcWeeklyExpenses(store, state.staff, state.menu, newEconomy);
    const profit = revenue - expenses;

    cashDelta += profit;
    totalRevenue += revenue;
    totalExpenses += expenses;
  }

  const newCash = state.finances.cash + cashDelta;

  return {
    ...state,
    turn: state.turn + 1,
    economy: newEconomy,
    finances: {
      cash: newCash,
      totalRevenue: state.finances.totalRevenue + totalRevenue,
      totalExpenses: state.finances.totalExpenses + totalExpenses,
      netProfit: newCash - 50000, // 初期資金との差
    },
    events: [...state.events, ...events].slice(-50), // 直近50件のみ保持
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
    },
    stores: {},
    staff: {},
    menu: {},
    economy: {
      phase: "boom",
      interestRate: 0.03,
      inflationRate: 0.02,
      consumerConfidence: 70,
      turnsInPhase: 0,
    },
    brandScore: 50,
    events: [],
  };
}
