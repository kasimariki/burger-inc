// ========================================
// ランダムイベントシステム
// 毎ターン一定確率でイベントが発生し、ゲームに影響を与える
// ========================================

import type { GameState, GameEvent, EventImpact } from "../models/types";
import { GAME_CONFIG, EVENT_TEMPLATES } from "@burger-inc/shared";
import type { EventTemplate } from "@burger-inc/shared";

// 毎ターンのイベント判定
export function rollForEvents(state: GameState): GameEvent[] {
  const config = GAME_CONFIG.events;
  const newEvents: GameEvent[] = [];

  // アクティブイベント数が上限に達している場合はスキップ
  if (state.activeEvents.length >= config.maxActiveEvents) {
    return [];
  }

  // 確率判定
  if (Math.random() > config.chancePerTurn) {
    return [];
  }

  // 発生可能なイベントをフィルタ
  const storeCount = Object.keys(state.stores).length;
  const eligible = EVENT_TEMPLATES.filter(
    t => state.turn >= t.minTurn && storeCount >= t.minStores
  );

  if (eligible.length === 0) return [];

  // 重大度で重み付けして選択
  const selected = weightedRandomSelect(eligible);
  if (!selected) return [];

  // 同じタイプのイベントが既にアクティブなら重複を避ける
  const alreadyActive = state.activeEvents.some(e => e.title === selected.title);
  if (alreadyActive) return [];

  const event: GameEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    turn: state.turn,
    type: selected.type,
    severity: selected.severity,
    title: selected.title,
    description: selected.description,
    impact: { ...selected.impact },
    duration: selected.duration,
    resolved: false,
  };

  newEvents.push(event);
  return newEvents;
}

// 重み付きランダム選択
function weightedRandomSelect(templates: EventTemplate[]): EventTemplate | null {
  const weights = GAME_CONFIG.events.severityWeights;
  const weighted = templates.map(t => ({
    template: t,
    weight: weights[t.severity],
  }));

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * totalWeight;

  for (const w of weighted) {
    r -= w.weight;
    if (r <= 0) return w.template;
  }

  return weighted[weighted.length - 1]?.template ?? null;
}

// アクティブイベントの影響を集計して倍率を返す
export function getActiveEventModifiers(activeEvents: GameEvent[]): EventImpact {
  const combined: EventImpact = {
    cash: 0,
    revenue: 1.0,
    expenses: 1.0,
    brandScore: 0,
    customerFlow: 1.0,
    staffSatisfaction: 0,
  };

  for (const event of activeEvents) {
    const impact = event.impact;
    if (impact.cash) combined.cash! += impact.cash;
    if (impact.revenue) combined.revenue! *= impact.revenue;
    if (impact.expenses) combined.expenses! *= impact.expenses;
    if (impact.brandScore) combined.brandScore! += impact.brandScore;
    if (impact.customerFlow) combined.customerFlow! *= impact.customerFlow;
    if (impact.staffSatisfaction) combined.staffSatisfaction! += impact.staffSatisfaction;
  }

  return combined;
}

// processTurn から呼ばれるイベント処理
export function processEvents(state: GameState): GameState {
  // 新しいイベントを判定
  const newEvents = rollForEvents(state);

  // activeEvents に追加
  const activeEvents = [...state.activeEvents, ...newEvents];

  // イベントの影響を適用
  const modifiers = getActiveEventModifiers(activeEvents);
  let { brandScore } = state;

  // ブランドスコアへの即座の影響
  if (modifiers.brandScore) {
    brandScore = Math.max(0, Math.min(100, brandScore + modifiers.brandScore));
  }

  // キャッシュへの即座の影響（設備故障等の一時コスト）
  let cashDelta = 0;
  for (const event of newEvents) {
    if (event.impact.cash) {
      cashDelta += event.impact.cash;
    }
  }

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash + cashDelta,
    },
    brandScore,
    events: [...state.events, ...newEvents].slice(-50),
    activeEvents,
  };
}
