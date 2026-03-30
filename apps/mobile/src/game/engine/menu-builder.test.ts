import { describe, it, expect } from "vitest";
import { calcTasteScore, calcMenuCost, calcCookTime, calcPopularity, buildBurger, initializeIngredients } from "./menu-builder";
import { getInitialGameState } from "./turn";
import type { Ingredient } from "../models/types";

const patty: Ingredient = {
  id: "ing-patty-beef-2",
  name: "レギュラービーフパティ",
  category: "patty",
  subType: "beef",
  cost: 1.5,
  quality: 2,
  tasteBonus: 12,
};

const bun: Ingredient = {
  id: "ing-bun-brioche-4",
  name: "ブリオッシュバンズ",
  category: "bun",
  subType: "brioche",
  cost: 0.8,
  quality: 4,
  tasteBonus: 8,
};

const cheese: Ingredient = {
  id: "ing-topping-cheese-3",
  name: "チーズ",
  category: "topping",
  subType: "cheese",
  cost: 0.5,
  quality: 3,
  tasteBonus: 6,
};

const lettuce: Ingredient = {
  id: "ing-topping-lettuce-2",
  name: "レタス",
  category: "topping",
  subType: "lettuce",
  cost: 0.2,
  quality: 2,
  tasteBonus: 2,
};

const sauce: Ingredient = {
  id: "ing-sauce-special-4",
  name: "特製ソース",
  category: "sauce",
  subType: "special",
  cost: 0.5,
  quality: 4,
  tasteBonus: 10,
};

describe("calcTasteScore", () => {
  it("0〜100の範囲で味スコアを返す", () => {
    const score = calcTasteScore(patty, bun, [cheese, lettuce], sauce, 5);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("シェフスキルが高いほどスコアが上がる", () => {
    const low = calcTasteScore(patty, bun, [cheese], sauce, 2);
    const high = calcTasteScore(patty, bun, [cheese], sauce, 9);
    expect(high).toBeGreaterThan(low);
  });

  it("トッピングが多いほどスコアが上がる", () => {
    const few = calcTasteScore(patty, bun, [cheese], sauce, 5);
    const many = calcTasteScore(patty, bun, [cheese, lettuce], sauce, 5);
    expect(many).toBeGreaterThanOrEqual(few);
  });
});

describe("calcMenuCost", () => {
  it("全食材のコストの合計を返す", () => {
    const cost = calcMenuCost(patty, bun, [cheese, lettuce], sauce);
    expect(cost).toBeCloseTo(1.5 + 0.8 + 0.5 + 0.2 + 0.5, 1);
  });
});

describe("calcCookTime", () => {
  it("基本5分 + トッピング0.5分/個", () => {
    expect(calcCookTime([])).toBe(5);
    expect(calcCookTime([cheese])).toBe(6); // 5 + 0.5 -> round = 6
    expect(calcCookTime([cheese, lettuce])).toBe(6); // 5 + 1.0 = 6
  });
});

describe("calcPopularity", () => {
  it("0〜100の範囲で人気度を返す", () => {
    const pop = calcPopularity(70, 10, 3);
    expect(pop).toBeGreaterThanOrEqual(0);
    expect(pop).toBeLessThanOrEqual(100);
  });

  it("味が良くて安いほど人気が高い", () => {
    const cheap = calcPopularity(80, 8, 3);
    const expensive = calcPopularity(80, 20, 3);
    expect(cheap).toBeGreaterThan(expensive);
  });
});

describe("initializeIngredients", () => {
  it("デフォルト食材がゲーム状態に追加される", () => {
    const state = initializeIngredients(getInitialGameState());
    const ingredients = Object.values(state.ingredients);
    expect(ingredients.length).toBeGreaterThan(20);
    expect(ingredients.some(i => i.category === "patty")).toBe(true);
    expect(ingredients.some(i => i.category === "bun")).toBe(true);
    expect(ingredients.some(i => i.category === "topping")).toBe(true);
    expect(ingredients.some(i => i.category === "sauce")).toBe(true);
  });
});

describe("buildBurger", () => {
  it("バーガーをメニューに追加できる", () => {
    const state = initializeIngredients(getInitialGameState());
    const ingredients = Object.values(state.ingredients);
    const p = ingredients.find(i => i.category === "patty")!;
    const b = ingredients.find(i => i.category === "bun")!;
    const t = ingredients.filter(i => i.category === "topping").slice(0, 2);
    const s = ingredients.find(i => i.category === "sauce")!;

    const result = buildBurger(state, {
      name: "テストバーガー",
      pattyId: p.id,
      bunId: b.id,
      toppingIds: t.map(x => x.id),
      sauceId: s.id,
      price: 10,
    });

    const menus = Object.values(result.menu);
    const newBurger = menus.find(m => m.name === "テストバーガー")!;
    expect(newBurger).toBeDefined();
    expect(newBurger.category).toBe("burger");
    expect(newBurger.recipe).toBeDefined();
    expect(result.finances.cash).toBeLessThan(state.finances.cash);
  });

  it("資金不足の場合エラーになる", () => {
    const state = {
      ...initializeIngredients(getInitialGameState()),
      finances: { ...getInitialGameState().finances, cash: 0 },
    };
    const ingredients = Object.values(state.ingredients);
    const p = ingredients.find(i => i.category === "patty")!;
    const b = ingredients.find(i => i.category === "bun")!;
    const s = ingredients.find(i => i.category === "sauce")!;

    expect(() => buildBurger(state, {
      name: "金欠バーガー",
      pattyId: p.id,
      bunId: b.id,
      toppingIds: [],
      sauceId: s.id,
      price: 10,
    })).toThrow("開発資金が不足");
  });
});
