import { describe, it, expect } from "vitest";
import { rollForEvents, getActiveEventModifiers, processEvents } from "./event-engine";
import { getInitialGameState } from "../engine/turn";
import { initializeIngredients } from "../engine/menu-builder";
import type { GameEvent } from "../models/types";

describe("rollForEvents", () => {
  it("店舗がない場合でも動作する（ただしminStores>0のイベントは発生しない）", () => {
    const state = getInitialGameState();
    // 確率的なのでエラーが出ないことだけ確認
    const events = rollForEvents(state);
    expect(Array.isArray(events)).toBe(true);
  });

  it("activeEvents が上限に達していたら新しいイベントは発生しない", () => {
    const state = {
      ...getInitialGameState(),
      activeEvents: Array.from({ length: 3 }, (_, i) => ({
        id: `event-${i}`,
        turn: 1,
        type: "random" as const,
        severity: "minor" as const,
        title: `ダミー${i}`,
        description: "",
        impact: {},
        duration: 5,
        resolved: false,
      })),
    };
    const events = rollForEvents(state);
    expect(events.length).toBe(0);
  });
});

describe("getActiveEventModifiers", () => {
  it("イベントがない場合はデフォルト倍率を返す", () => {
    const mods = getActiveEventModifiers([]);
    expect(mods.revenue).toBe(1.0);
    expect(mods.expenses).toBe(1.0);
    expect(mods.customerFlow).toBe(1.0);
    expect(mods.cash).toBe(0);
  });

  it("複数イベントの影響が乗算される", () => {
    const events: GameEvent[] = [
      {
        id: "e1", turn: 1, type: "economic", severity: "moderate",
        title: "原材料費高騰", description: "",
        impact: { expenses: 1.2 },
        duration: 4, resolved: false,
      },
      {
        id: "e2", turn: 1, type: "menu", severity: "minor",
        title: "SNSバズ", description: "",
        impact: { customerFlow: 1.3, revenue: 1.1 },
        duration: 2, resolved: false,
      },
    ];

    const mods = getActiveEventModifiers(events);
    expect(mods.expenses).toBeCloseTo(1.2, 2);
    expect(mods.customerFlow).toBeCloseTo(1.3, 2);
    expect(mods.revenue).toBeCloseTo(1.1, 2);
  });
});

describe("processEvents", () => {
  it("ブランドスコアへの影響が反映される", () => {
    const state = {
      ...getInitialGameState(),
      stores: {
        "store-1": {
          id: "store-1", name: "1号店", city: "東京", type: "street" as const,
          rent: 4000, capacity: 200, staffIds: [], menuItemIds: [],
          isOpen: true, cleanliness: 80, reputation: 50,
        },
      },
      activeEvents: [{
        id: "food-safety", turn: 1, type: "supply_chain" as const,
        severity: "major" as const,
        title: "食品安全問題", description: "",
        impact: { brandScore: -15, customerFlow: 0.6 },
        duration: 4, resolved: false,
      }],
    };

    const result = processEvents(state);
    expect(result.brandScore).toBeLessThan(state.brandScore);
  });
});
