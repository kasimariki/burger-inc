// ========================================
// Burger Inc. — 型定義
// ========================================

// --- ID型 ---
export type MenuItemId = string;
export type StoreId = string;
export type StaffId = string;
export type IngredientId = string;
export type RecipeId = string;
export type EventId = string;

// --- 食材システム ---
export type PattyType = "beef" | "chicken" | "fish" | "plant_based";
export type BunType = "regular" | "brioche" | "whole_grain" | "rice";
export type ToppingType =
  | "lettuce" | "tomato" | "cheese" | "bacon"
  | "avocado" | "egg" | "onion" | "pickle" | "jalapeno";
export type SauceType =
  | "ketchup" | "mustard" | "mayo" | "special" | "teriyaki" | "bbq" | "chili";

export interface Ingredient {
  id: IngredientId;
  name: string;
  category: "patty" | "bun" | "topping" | "sauce";
  subType: PattyType | BunType | ToppingType | SauceType;
  cost: number;
  quality: number;        // 1-5 (グレード)
  tasteBonus: number;     // 味スコアへの寄与
}

export interface Recipe {
  id: RecipeId;
  name: string;
  patty: IngredientId;
  bun: IngredientId;
  toppings: IngredientId[];
  sauce: IngredientId;
}

// --- メニュー ---
export interface MenuItem {
  id: MenuItemId;
  name: string;
  category: "burger" | "side" | "drink";
  recipe?: Recipe;         // バーガーの場合のみ
  price: number;
  cost: number;
  tags: string[];
  tasteScore: number;      // 0-100
  popularity: number;      // 0-100
  cookTime: number;        // 分
  developmentTurns: number; // 開発に要したターン数
}

// --- スタッフ ---
export type StaffRole = "cook" | "cashier" | "manager";
export type HqRole = "marketing" | "rnd" | "finance" | "hr" | "logistics";
export type CSuiteRole = "coo" | "cfo" | "cmo" | "cto";

export interface Staff {
  id: StaffId;
  name: string;
  role: StaffRole;
  skillLevel: number;      // 1-10
  salary: number;
  satisfaction: number;    // 0-100
  loyalty: number;         // 0-100
  turnsEmployed: number;
}

// --- 店舗 ---
export type StoreType = "street" | "mall" | "drive_through" | "food_truck";

export interface Store {
  id: StoreId;
  name: string;
  city: string;
  type: StoreType;
  rent: number;
  capacity: number;        // 最大客数/日
  staffIds: StaffId[];
  menuItemIds: MenuItemId[];
  isOpen: boolean;
  cleanliness: number;     // 0-100
  reputation: number;      // 0-100
}

// --- 財務 ---
export interface Finances {
  cash: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
}

// --- マクロ経済 ---
export type EconomyPhase = "boom" | "recession" | "depression" | "recovery";

export interface MacroEconomy {
  phase: EconomyPhase;
  interestRate: number;    // 0.005 - 0.08
  inflationRate: number;   // 0.005 - 0.06
  consumerConfidence: number; // 0-100
  turnsInPhase: number;
}

// --- イベント ---
export type GameEventType =
  | "economic" | "staff" | "menu" | "store"
  | "supply_chain" | "marketing" | "random";

export type EventSeverity = "minor" | "moderate" | "major";

export interface GameEvent {
  id: EventId;
  turn: number;
  type: GameEventType;
  severity: EventSeverity;
  title: string;
  description: string;
  impact: EventImpact;
  duration: number;        // 影響が続くターン数
  resolved: boolean;
}

export interface EventImpact {
  cash?: number;
  revenue?: number;        // 売上倍率 (1.0 = 変化なし)
  expenses?: number;       // コスト倍率
  brandScore?: number;
  customerFlow?: number;   // 来客数倍率
  staffSatisfaction?: number;
}

// --- ゲーム状態 ---
export interface GameState {
  turn: number;
  finances: Finances;
  stores: Record<StoreId, Store>;
  staff: Record<StaffId, Staff>;
  menu: Record<MenuItemId, MenuItem>;
  ingredients: Record<IngredientId, Ingredient>;
  economy: MacroEconomy;
  brandScore: number;       // 0-100
  events: GameEvent[];
  activeEvents: GameEvent[]; // 現在影響中のイベント
}

// --- API ---
export interface SaveData {
  userId: string;
  userName: string;
  gameState: GameState;
  savedAt: string;
}

export interface RankingEntry {
  userId: string;
  userName: string;
  cash: number;
  storeCount: number;
  turn: number;
}
