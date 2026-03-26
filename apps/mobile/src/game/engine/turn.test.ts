import { describe, it, expect } from "vitest";
import { processTurn, getInitialGameState } from "./turn";
import type { Store, MenuItem, Staff } from "../models/types";

const testMenu: Record<string, MenuItem> = {
  "burger-1": {
    id: "burger-1",
    name: "クラシックバーガー",
    price: 8,
    cost: 3,
    tags: [],
    tasteScore: 70,
    cookTime: 3,
  },
};

const testStaff: Record<string, Staff> = {
  "staff-1": {
    id: "staff-1",
    name: "田中",
    role: "cook",
    skillLevel: 5,
    salary: 2000,
    satisfaction: 80,
  },
};

const testStore: Store = {
  id: "store-1",
  name: "1号店",
  city: "東京",
  rent: 4000,
  capacity: 200,
  staffIds: ["staff-1"],
  menuItemIds: ["burger-1"],
  isOpen: true,
};

describe("processTurn", () => {
  it("ターンが1進む", () => {
    const state = getInitialGameState();
    const next = processTurn(state);
    expect(next.turn).toBe(2);
  });

  it("店舗がない場合、売上は0", () => {
    const state = getInitialGameState();
    const next = processTurn(state);
    expect(next.finances.cash).toBe(50000); // 変化なし
  });

  it("店舗がある場合、売上が発生する", () => {
    const state = {
      ...getInitialGameState(),
      stores: { "store-1": testStore },
      staff: testStaff,
      menu: testMenu,
    };
    const next = processTurn(state);
    expect(next.finances.cash).toBeGreaterThan(0);
    expect(next.finances.totalRevenue).toBeGreaterThan(0);
  });

  it("景気が悪いと売上が減る", () => {
    const baseState = {
      ...getInitialGameState(),
      stores: { "store-1": testStore },
      staff: testStaff,
      menu: testMenu,
    };
    const boomState = { ...baseState, economy: { ...baseState.economy, phase: "boom" as const, consumerConfidence: 90 } };
    const depressionState = { ...baseState, economy: { ...baseState.economy, phase: "depression" as const, consumerConfidence: 30 } };

    const boomNext = processTurn(boomState);
    const depressionNext = processTurn(depressionState);

    expect(boomNext.finances.totalRevenue).toBeGreaterThan(depressionNext.finances.totalRevenue);
  });
});
