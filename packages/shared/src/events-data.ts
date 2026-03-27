// ========================================
// Burger Inc. — イベントテンプレート
// ========================================

import type { GameEventType, EventSeverity, EventImpact } from "./types";

export interface EventTemplate {
  type: GameEventType;
  severity: EventSeverity;
  title: string;
  description: string;
  impact: EventImpact;
  duration: number;
  minTurn: number;       // このターン以降に発生可能
  minStores: number;     // 最低店舗数
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  // --- 経済イベント ---
  {
    type: "economic", severity: "moderate",
    title: "原材料費の高騰",
    description: "牛肉の国際価格が急騰。仕入れコストが上昇しています。",
    impact: { expenses: 1.2 },
    duration: 4, minTurn: 1, minStores: 1,
  },
  {
    type: "economic", severity: "major",
    title: "経済危機",
    description: "金融市場の混乱により消費者の財布のひもが固くなっています。",
    impact: { customerFlow: 0.7, revenue: 0.8 },
    duration: 8, minTurn: 20, minStores: 1,
  },
  {
    type: "economic", severity: "minor",
    title: "消費税減税",
    description: "政府が消費刺激策を発表。外食需要が増加しています。",
    impact: { customerFlow: 1.15, revenue: 1.1 },
    duration: 6, minTurn: 1, minStores: 1,
  },

  // --- スタッフイベント ---
  {
    type: "staff", severity: "minor",
    title: "スタッフの士気向上",
    description: "チームワークが良好で、スタッフのモチベーションが上がっています。",
    impact: { staffSatisfaction: 10 },
    duration: 3, minTurn: 5, minStores: 1,
  },
  {
    type: "staff", severity: "moderate",
    title: "人手不足",
    description: "業界全体で人手不足が深刻化。採用コストが上昇しています。",
    impact: { expenses: 1.1, staffSatisfaction: -10 },
    duration: 6, minTurn: 10, minStores: 2,
  },

  // --- メニューイベント ---
  {
    type: "menu", severity: "minor",
    title: "SNSでバズ！",
    description: "あなたのバーガーがSNSで話題に！来客数が増加しています。",
    impact: { customerFlow: 1.3, brandScore: 5 },
    duration: 2, minTurn: 3, minStores: 1,
  },
  {
    type: "menu", severity: "major",
    title: "フードトレンド到来",
    description: "バーガーがフードトレンドの中心に。業界全体が活況です。",
    impact: { customerFlow: 1.25, revenue: 1.15, brandScore: 3 },
    duration: 8, minTurn: 15, minStores: 1,
  },

  // --- 店舗イベント ---
  {
    type: "store", severity: "moderate",
    title: "設備故障",
    description: "グリル機器が故障。修理費用が発生し、一時的に提供スピードが低下。",
    impact: { cash: -5000, customerFlow: 0.85 },
    duration: 2, minTurn: 5, minStores: 1,
  },
  {
    type: "store", severity: "minor",
    title: "近隣にイベント開催",
    description: "店舗周辺でフェスティバルが開催。通行量が増加しています。",
    impact: { customerFlow: 1.4 },
    duration: 1, minTurn: 1, minStores: 1,
  },

  // --- サプライチェーンイベント ---
  {
    type: "supply_chain", severity: "major",
    title: "食品安全問題",
    description: "仕入先で食品安全問題が発覚。ブランドイメージに影響。",
    impact: { brandScore: -15, customerFlow: 0.6 },
    duration: 4, minTurn: 10, minStores: 2,
  },
  {
    type: "supply_chain", severity: "minor",
    title: "新しい仕入先を発見",
    description: "品質の良い食材を安く仕入れられる新しいサプライヤーが見つかりました。",
    impact: { expenses: 0.9 },
    duration: 8, minTurn: 8, minStores: 1,
  },

  // --- マーケティングイベント ---
  {
    type: "marketing", severity: "minor",
    title: "グルメレビュー高評価",
    description: "有名グルメレビュアーが高評価。ブランド力が向上しています。",
    impact: { brandScore: 8, customerFlow: 1.2 },
    duration: 3, minTurn: 5, minStores: 1,
  },
  {
    type: "marketing", severity: "moderate",
    title: "競合チェーンの大規模キャンペーン",
    description: "競合が価格攻勢を仕掛けてきました。来客数に影響。",
    impact: { customerFlow: 0.8 },
    duration: 4, minTurn: 10, minStores: 2,
  },

  // --- ランダムイベント ---
  {
    type: "random", severity: "minor",
    title: "猛暑日",
    description: "記録的な猛暑。冷たいドリンクの売上が急増しています。",
    impact: { revenue: 1.1 },
    duration: 1, minTurn: 1, minStores: 1,
  },
  {
    type: "random", severity: "moderate",
    title: "大雪",
    description: "大雪で客足が激減。配送にも影響が出ています。",
    impact: { customerFlow: 0.5, expenses: 1.1 },
    duration: 1, minTurn: 1, minStores: 1,
  },
  {
    type: "random", severity: "major",
    title: "食中毒発生",
    description: "店舗で食中毒が発生。営業停止と信頼回復が急務です。",
    impact: { cash: -20000, brandScore: -20, customerFlow: 0.3 },
    duration: 3, minTurn: 10, minStores: 1,
  },
];
