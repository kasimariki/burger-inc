// ========================================
// Burger Inc. — 食材マスタデータ
// ========================================

import type { Ingredient } from "./types";

export const DEFAULT_INGREDIENTS: Omit<Ingredient, "id">[] = [
  // --- パティ ---
  { name: "レギュラービーフパティ",   category: "patty", subType: "beef",        cost: 1.5, quality: 2, tasteBonus: 12 },
  { name: "プレミアムビーフパティ",   category: "patty", subType: "beef",        cost: 3.0, quality: 4, tasteBonus: 22 },
  { name: "チキンパティ",            category: "patty", subType: "chicken",     cost: 1.2, quality: 2, tasteBonus: 10 },
  { name: "グリルドチキンパティ",     category: "patty", subType: "chicken",     cost: 2.5, quality: 4, tasteBonus: 18 },
  { name: "フィッシュパティ",        category: "patty", subType: "fish",        cost: 2.0, quality: 3, tasteBonus: 14 },
  { name: "プラントベースパティ",     category: "patty", subType: "plant_based", cost: 2.8, quality: 3, tasteBonus: 13 },

  // --- バンズ ---
  { name: "レギュラーバンズ",        category: "bun", subType: "regular",     cost: 0.3, quality: 2, tasteBonus: 3 },
  { name: "ブリオッシュバンズ",       category: "bun", subType: "brioche",     cost: 0.8, quality: 4, tasteBonus: 8 },
  { name: "全粒粉バンズ",           category: "bun", subType: "whole_grain", cost: 0.5, quality: 3, tasteBonus: 5 },
  { name: "ライスバンズ",           category: "bun", subType: "rice",        cost: 0.6, quality: 3, tasteBonus: 6 },

  // --- トッピング ---
  { name: "レタス",     category: "topping", subType: "lettuce",  cost: 0.2, quality: 2, tasteBonus: 2 },
  { name: "トマト",     category: "topping", subType: "tomato",   cost: 0.3, quality: 2, tasteBonus: 3 },
  { name: "チーズ",     category: "topping", subType: "cheese",   cost: 0.5, quality: 3, tasteBonus: 6 },
  { name: "ベーコン",   category: "topping", subType: "bacon",    cost: 0.8, quality: 3, tasteBonus: 8 },
  { name: "アボカド",   category: "topping", subType: "avocado",  cost: 1.0, quality: 4, tasteBonus: 7 },
  { name: "目玉焼き",   category: "topping", subType: "egg",      cost: 0.4, quality: 2, tasteBonus: 5 },
  { name: "オニオン",   category: "topping", subType: "onion",    cost: 0.2, quality: 2, tasteBonus: 3 },
  { name: "ピクルス",   category: "topping", subType: "pickle",   cost: 0.2, quality: 2, tasteBonus: 4 },
  { name: "ハラペーニョ", category: "topping", subType: "jalapeno", cost: 0.3, quality: 2, tasteBonus: 5 },

  // --- ソース ---
  { name: "ケチャップ",   category: "sauce", subType: "ketchup",  cost: 0.1, quality: 2, tasteBonus: 3 },
  { name: "マスタード",   category: "sauce", subType: "mustard",  cost: 0.1, quality: 2, tasteBonus: 3 },
  { name: "マヨネーズ",   category: "sauce", subType: "mayo",     cost: 0.15, quality: 2, tasteBonus: 3 },
  { name: "特製ソース",   category: "sauce", subType: "special",  cost: 0.5, quality: 4, tasteBonus: 10 },
  { name: "テリヤキソース", category: "sauce", subType: "teriyaki", cost: 0.3, quality: 3, tasteBonus: 7 },
  { name: "BBQソース",    category: "sauce", subType: "bbq",      cost: 0.2, quality: 3, tasteBonus: 6 },
  { name: "チリソース",   category: "sauce", subType: "chili",    cost: 0.2, quality: 2, tasteBonus: 5 },
];
