import type { Store, MenuItem, Staff, MacroEconomy } from "../models/types";

// メニュー数による来客ボーナス
function calcMenuCountMultiplier(menuItemCount: number): number {
  if (menuItemCount >= 3) return 1.0;
  if (menuItemCount === 2) return 0.85;
  if (menuItemCount === 1) return 0.7;
  return 0; // メニュー0品は来客なし
}

// スタッフ数によるサービスボーナス
function calcStaffServiceMultiplier(staffCount: number): number {
  if (staffCount >= 3) return 1.0;
  if (staffCount === 2) return 0.9;
  if (staffCount === 1) return 0.7;
  return 0; // スタッフなしは営業不可
}

// 1ターン（1週間）の来客数を計算
export function calcWeeklyCustomers(
  store: Store,
  menu: Record<string, MenuItem>,
  economy: MacroEconomy,
  supplierQualityBonus: number = 0
): number {
  const rawTaste = calcAvgTasteScore(store, menu);
  const avgTaste = Math.min(100, rawTaste + supplierQualityBonus);
  const economyMultiplier = getEconomyMultiplier(economy);
  const baseCustomers = store.capacity * 0.5; // 基本50%稼働

  const menuItemCount = store.menuItemIds.filter(id => menu[id]).length;
  const menuMultiplier = calcMenuCountMultiplier(menuItemCount);

  const staffCount = store.staffIds.length;
  const staffMultiplier = calcStaffServiceMultiplier(staffCount);

  const tasteBonus = (avgTaste / 100) * store.capacity * 0.3;
  return Math.floor((baseCustomers + tasteBonus) * economyMultiplier * menuMultiplier * staffMultiplier);
}

// 1ターンの売上を計算
export function calcWeeklyRevenue(
  store: Store,
  menu: Record<string, MenuItem>,
  economy: MacroEconomy,
  supplierQualityBonus: number = 0
): number {
  const customers = calcWeeklyCustomers(store, menu, economy, supplierQualityBonus);
  const avgPrice = calcAvgMenuPrice(store, menu);
  return Math.round(customers * avgPrice);
}

// 1ターンのコストを計算
export function calcWeeklyExpenses(
  store: Store,
  staff: Record<string, Staff>,
  menu: Record<string, MenuItem>,
  economy: MacroEconomy,
  supplierCostMultiplier: number = 1,
  supplierQualityBonus: number = 0
): number {
  const weeklyRent = store.rent / 4;
  const weeklySalaries = store.staffIds
    .map(id => staff[id]?.salary ?? 0)
    .reduce((a, b) => a + b, 0) / 4;
  const customers = calcWeeklyCustomers(store, menu, economy, supplierQualityBonus);
  const avgCost = calcAvgMenuCost(store, menu);
  const foodCost = customers * avgCost * supplierCostMultiplier;
  const inflationMultiplier = 1 + economy.inflationRate;

  return Math.round((weeklyRent + weeklySalaries + foodCost) * inflationMultiplier);
}

// --- ヘルパー関数 ---

function calcAvgTasteScore(store: Store, menu: Record<string, MenuItem>): number {
  const items = store.menuItemIds.map(id => menu[id]).filter(Boolean);
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + item.tasteScore, 0) / items.length;
}

function calcAvgMenuPrice(store: Store, menu: Record<string, MenuItem>): number {
  const items = store.menuItemIds.map(id => menu[id]).filter(Boolean);
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + item.price, 0) / items.length;
}

function calcAvgMenuCost(store: Store, menu: Record<string, MenuItem>): number {
  const items = store.menuItemIds.map(id => menu[id]).filter(Boolean);
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + item.cost, 0) / items.length;
}

function getEconomyMultiplier(economy: MacroEconomy): number {
  const base = economy.consumerConfidence / 100;
  switch (economy.phase) {
    case "boom":       return base * 1.3;
    case "recovery":   return base * 1.1;
    case "recession":  return base * 0.85;
    case "depression": return base * 0.65;
  }
}
