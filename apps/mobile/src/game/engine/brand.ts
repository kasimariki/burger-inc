import type { GameState } from "../models/types";
import type { BrandPositioning } from "@burger-inc/shared";

interface PositioningRange {
  minTaste: number; maxTaste: number;
  minPrice: number; maxPrice: number;
}

const POSITIONING_RANGES: Record<BrandPositioning, PositioningRange> = {
  value:             { minTaste: 0,  maxTaste: 50,  minPrice: 3,  maxPrice: 7  },
  standard:          { minTaste: 40, maxTaste: 70,  minPrice: 6,  maxPrice: 12 },
  premium_fast_food: { minTaste: 60, maxTaste: 90,  minPrice: 10, maxPrice: 18 },
  gourmet:           { minTaste: 75, maxTaste: 100, minPrice: 14, maxPrice: 30 },
};

/** ポジショニングとメニューの一致度（0〜100）を計算 */
export function calcBrandConsistency(
  positioning: BrandPositioning,
  menus: { tasteScore: number; price: number }[]
): number {
  if (menus.length === 0) return 100;
  const range = POSITIONING_RANGES[positioning];
  const consistent = menus.filter(m =>
    m.tasteScore >= range.minTaste && m.tasteScore <= range.maxTaste &&
    m.price >= range.minPrice && m.price <= range.maxPrice
  ).length;
  return Math.round((consistent / menus.length) * 100);
}

/** ブランドスコアの週次変化量を計算 */
export function calcBrandScoreDelta(
  consistency: number,
  avgRating: number,  // 1.0〜5.0（store.reputation / 20）
  adSpend: number     // 広告費（0 = なし）
): number {
  const base = (avgRating - 1) * 2.5;
  const adBonus = Math.min(adSpend / 100, 5);
  const mod = consistency / 100;
  return Math.max(0, Math.round((base + adBonus) * mod));
}

/** ターン終了時にブランドプロファイルを更新して返す */
export function applyBrandScoreToState(
  state: GameState,
  avgRating: number,
  adSpend: number
) {
  const profile = state.brandProfile ?? {
    positioning: "standard" as BrandPositioning,
    brandScore: 0,
    brandConsistency: 100,
    weeklyScoreDelta: 0,
  };

  const menus = Object.values(state.menu).map(m => ({
    tasteScore: m.tasteScore,
    price: m.price,
  }));

  const consistency = calcBrandConsistency(profile.positioning, menus);
  const delta = calcBrandScoreDelta(consistency, avgRating, adSpend);

  return {
    ...profile,
    brandScore: Math.min(1000, profile.brandScore + delta),
    brandConsistency: consistency,
    weeklyScoreDelta: delta,
  };
}

/** ブランドスコアに応じたアンロック状態を返す */
export function getBrandUnlocks(brandScore: number) {
  return {
    risingBrandBadge:    brandScore >= 100,
    franchiseUnlocked:   brandScore >= 250,
    loanRateImproved:    brandScore >= 500,
    rareExecutiveMarket: brandScore >= 750,
    brandEmpireRoute:    brandScore >= 1000,
  };
}

export const BRAND_MILESTONES = [
  { score: 100,  label: "Rising Brand バッジ",  description: "マーケティングキャンペーン解放" },
  { score: 250,  label: "フランチャイズ解禁",    description: "フランチャイズ展開が可能に" },
  { score: 500,  label: "金利改善",              description: "株式上場の条件を満たした" },
  { score: 750,  label: "希少幹部出現",          description: "グローバルブランドに到達" },
  { score: 1000, label: "ブランド帝国",          description: "ブランド帝国ルート到達" },
] as const;

export const POSITIONING_META: Record<BrandPositioning, { label: string; emoji: string; desc: string }> = {
  value:              { label: "Value",             emoji: "💰", desc: "低価格・手軽さが売り。価格帯 $3〜7" },
  standard:           { label: "Standard",          emoji: "🍔", desc: "バランス型。価格帯 $6〜12" },
  premium_fast_food:  { label: "Premium Fast Food", emoji: "⭐", desc: "高品質・適正価格。価格帯 $10〜18" },
  gourmet:            { label: "Gourmet",           emoji: "👑", desc: "最高品質・高価格。価格帯 $14+" },
};

export const POSITIONING_LABELS: Record<BrandPositioning, string> = {
  value:             "バリュー（安くて早い）",
  standard:          "スタンダード（バランス型）",
  premium_fast_food: "プレミアムFF（速くて美味しい）",
  gourmet:           "グルメ（最高品質）",
};

export const POSITIONING_PRICE_GUIDE: Record<BrandPositioning, string> = {
  value:             "推奨価格: $3〜$7",
  standard:          "推奨価格: $6〜$12",
  premium_fast_food: "推奨価格: $10〜$18",
  gourmet:           "推奨価格: $14〜$30",
};
