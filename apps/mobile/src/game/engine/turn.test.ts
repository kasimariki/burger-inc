import { describe, it, expect } from "vitest";
import { processTurn, getInitialGameState } from "./turn";
import type { Store, MenuItem, Staff } from "../models/types";

const testMenu: Record<string, MenuItem> = {
  "burger-1": {
    id: "burger-1",
    name: "クラシックバーガー",
    category: "burger",
    price: 8,
    cost: 3,
    tags: [],
    tasteScore: 70,
    popularity: 60,
    cookTime: 3,
    developmentTurns: 1,
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
    loyalty: 60,
    turnsEmployed: 10,
  },
};

const testStore: Store = {
  id: "store-1",
  name: "1号店",
  city: "東京",
  type: "street",
  rent: 4000,
  capacity: 200,
  staffIds: ["staff-1"],
  menuItemIds: ["burger-1"],
  isOpen: true,
  cleanliness: 80,
  reputation: 50,
};

describe("processTurn", () => {
  it("ターンが1進む", () => {
    const state = getInitialGameState();
    const next = processTurn(state);
    expect(next.turn).toBe(2);
  });

  it("店舗がない場合、売上は0", () => {
    const state = { ...getInitialGameState(), stores: {}, staff: {}, menu: {} };
    const next = processTurn(state);
    expect(next.finances.weeklyRevenue).toBe(0);
  });

  it("店舗がある場合、売上が発生する", () => {
    const state = {
      ...getInitialGameState(),
      stores: { "store-1": testStore },
      staff: testStaff,
      menu: testMenu,
    };
    const next = processTurn(state);
    expect(next.finances.weeklyRevenue).toBeGreaterThan(0);
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

  it("activeEvents の duration が毎ターン減少する", () => {
    const state = {
      ...getInitialGameState(),
      activeEvents: [{
        id: "test-event",
        turn: 1,
        type: "random" as const,
        severity: "minor" as const,
        title: "テスト",
        description: "テストイベント",
        impact: { revenue: 1.1 },
        duration: 3,
        resolved: false,
      }],
    };
    const next = processTurn(state);
    expect(next.activeEvents.length).toBe(1);
    expect(next.activeEvents[0].duration).toBe(2);
  });

  it("duration が 0 になったイベントは除去される", () => {
    const state = {
      ...getInitialGameState(),
      activeEvents: [{
        id: "expiring-event",
        turn: 1,
        type: "random" as const,
        severity: "minor" as const,
        title: "期限切れ",
        description: "すぐ消える",
        impact: {},
        duration: 1,
        resolved: false,
      }],
    };
    const next = processTurn(state);
    expect(next.activeEvents.length).toBe(0);
  });
});
