// ========================================
// メニュー開発システム
// 食材を組み合わせてバーガーを作成し、味スコア・原価・調理時間を計算
// ========================================

import type { GameState, Ingredient, MenuItem, Recipe, IngredientId } from "../models/types";
import { GAME_CONFIG, DEFAULT_INGREDIENTS } from "@burger-inc/shared";

interface BuildBurgerInput {
  name: string;
  pattyId: IngredientId;
  bunId: IngredientId;
  toppingIds: IngredientId[];
  sauceId: IngredientId;
  price: number;
}

// 食材からバーガーの味スコアを計算
export function calcTasteScore(
  patty: Ingredient,
  bun: Ingredient,
  toppings: Ingredient[],
  sauce: Ingredient,
  chefSkillAvg: number // 店舗の平均調理師スキル (1-10)
): number {
  const factors = GAME_CONFIG.menu.tasteScoreFactors;

  // 食材品質スコア (各食材のtasteBonusの合計を正規化)
  const totalTasteBonus = patty.tasteBonus + bun.tasteBonus
    + toppings.reduce((sum, t) => sum + t.tasteBonus, 0)
    + sauce.tasteBonus;
  const ingredientScore = Math.min(100, totalTasteBonus * 2);

  // レシピ完成度 (トッピング数とバランスでボーナス)
  const varietyBonus = Math.min(1, toppings.length / 3); // 3種以上で最大
  const qualityAvg = (patty.quality + bun.quality + sauce.quality
    + toppings.reduce((s, t) => s + t.quality, 0))
    / (3 + toppings.length);
  const recipeScore = (varietyBonus * 50 + qualityAvg * 10);

  // シェフスキル
  const chefScore = (chefSkillAvg / 10) * 100;

  const rawScore =
    ingredientScore * factors.ingredients
    + recipeScore * factors.recipe
    + chefScore * factors.chefSkill;

  return Math.round(Math.max(0, Math.min(100, rawScore)));
}

// 食材から原価を計算
export function calcMenuCost(
  patty: Ingredient,
  bun: Ingredient,
  toppings: Ingredient[],
  sauce: Ingredient
): number {
  return Math.round(
    (patty.cost + bun.cost + sauce.cost
      + toppings.reduce((s, t) => s + t.cost, 0)) * 100
  ) / 100;
}

// 食材から調理時間を計算 (分)
export function calcCookTime(
  toppings: Ingredient[]
): number {
  const baseTime = 5; // パティ調理の基本時間
  const toppingTime = toppings.length * 0.5;
  return Math.round(baseTime + toppingTime);
}

// 人気度を計算 (味スコアと価格のバランス)
export function calcPopularity(tasteScore: number, price: number, cost: number): number {
  const valueRatio = tasteScore / (price * 5); // コスパ感
  const marginRatio = (price - cost) / price;  // 利益率が高すぎると人気低下
  const penaltyForHighMargin = marginRatio > 0.7 ? (marginRatio - 0.7) * 100 : 0;

  return Math.round(Math.max(0, Math.min(100,
    valueRatio * 60 + tasteScore * 0.3 - penaltyForHighMargin
  )));
}

// バーガーメニューを作成してGameStateに追加
export function buildBurger(state: GameState, input: BuildBurgerInput): GameState {
  const { pattyId, bunId, toppingIds, sauceId, name, price } = input;

  // 食材の存在チェック
  const patty = state.ingredients[pattyId];
  const bun = state.ingredients[bunId];
  const sauce = state.ingredients[sauceId];
  const toppings = toppingIds.map(id => state.ingredients[id]).filter(Boolean);

  if (!patty || !bun || !sauce) {
    throw new Error("必要な食材が見つかりません");
  }
  if (patty.category !== "patty") throw new Error("パティを選んでください");
  if (bun.category !== "bun") throw new Error("バンズを選んでください");
  if (sauce.category !== "sauce") throw new Error("ソースを選んでください");

  // メニュー数上限チェック
  const currentMenuCount = Object.keys(state.menu).length;
  if (currentMenuCount >= GAME_CONFIG.menu.maxMenuItems) {
    throw new Error(`メニューは最大${GAME_CONFIG.menu.maxMenuItems}品までです`);
  }

  // コスト計算
  const cost = calcMenuCost(patty, bun, toppings, sauce);
  const devCost = GAME_CONFIG.menu.developmentCostRange[0]
    + (patty.quality + bun.quality + sauce.quality) * 80;

  if (state.finances.cash < devCost) {
    throw new Error(`開発資金が不足しています (必要: $${devCost})`);
  }

  // 平均シェフスキル
  const cooks = Object.values(state.staff).filter(s => s.role === "cook");
  const avgSkill = cooks.length > 0
    ? cooks.reduce((s, c) => s + c.skillLevel, 0) / cooks.length
    : 3; // デフォルト

  const tasteScore = calcTasteScore(patty, bun, toppings, sauce, avgSkill);
  const cookTime = calcCookTime(toppings);
  const popularity = calcPopularity(tasteScore, price, cost);

  const recipe: Recipe = {
    id: `recipe-${Date.now()}`,
    name,
    patty: pattyId,
    bun: bunId,
    toppings: toppingIds,
    sauce: sauceId,
  };

  const menuItem: MenuItem = {
    id: `menu-${Date.now()}`,
    name,
    category: "burger",
    recipe,
    price,
    cost,
    tags: [patty.subType, bun.subType],
    tasteScore,
    popularity,
    cookTime,
    developmentTurns: 1,
  };

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash - devCost,
    },
    menu: {
      ...state.menu,
      [menuItem.id]: menuItem,
    },
  };
}

// 食材をゲームに追加（初期化用）
export function initializeIngredients(state: GameState): GameState {
  const ingredients = { ...state.ingredients };

  for (const ingredient of DEFAULT_INGREDIENTS) {
    const id = `ing-${ingredient.category}-${ingredient.subType}-${ingredient.quality}`;
    if (!ingredients[id]) {
      ingredients[id] = { ...ingredient, id };
    }
  }

  return { ...state, ingredients };
}
