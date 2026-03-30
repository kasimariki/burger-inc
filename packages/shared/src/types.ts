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

// --- 都市 ---
export type CityType = "downtown" | "suburb" | "tech_hub" | "tourist_zone" | "industrial" | "college_town";

export interface CityDemographics {
  thriftyWorker: number;   // 節約志向
  qualityHunter: number;   // 品質重視
  trendChaser: number;     // トレンド重視
  familyCrew: number;      // ファミリー層
}

export interface CityStatus {
  id: string;
  name: string;
  type: CityType;
  rentMultiplier: number;
  demographics: CityDemographics;
  hasSeasonal: boolean;
  notes: string | null;
  isUnlocked: boolean;
  canUnlock: boolean;
  unlockProgress: {
    brandScore: { current: number; required: number; ok: boolean };
    storeCount: { current: number; required: number; ok: boolean };
    cash:       { current: number; required: number; ok: boolean };
  } | null;
}

// --- 店舗 ---
export type StoreType = "street" | "mall" | "drive_through" | "food_truck";

export interface Store {
  id: StoreId;
  name: string;
  city: string;
  cityId?: string;         // 都市ID（デフォルト: "midvale"）
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

// --- ブランド ---

export type BrandPositioning = "value" | "standard" | "premium_fast_food" | "gourmet";

export interface BrandProfile {
  positioning: BrandPositioning;
  brandScore: number;        // 0〜1000
  brandConsistency: number;  // 0〜100
  weeklyScoreDelta: number;
}

// --- サプライヤー ---

export interface ActiveSupplier {
  id: string;
  name: string;
  description: string;
  costMultiplier: number;  // 食材コスト倍率（0.7 = 30%安, 1.3 = 30%高）
  qualityBonus: number;    // tasteScore への加算（-10〜+20）
  reliability: number;     // 0-100 サプライチェーン安定性
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
  brandScore: number;       // 0-100（イベントシステム用・既存互換）
  brandProfile: BrandProfile;
  events: GameEvent[];
  activeEvents: GameEvent[]; // 現在影響中のイベント
  activeSupplier?: ActiveSupplier | null;
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
