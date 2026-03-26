// ゲームの基本型定義

export type MenuItemId = string;
export type StoreId = string;
export type StaffId = string;

export interface MenuItem {
  id: MenuItemId;
  name: string;
  price: number;
  cost: number;
  tags: string[];
  tasteScore: number;      // 0-100
  cookTime: number;        // 分
}

export interface Staff {
  id: StaffId;
  name: string;
  role: "cook" | "cashier" | "manager";
  skillLevel: number;      // 1-10
  salary: number;
  satisfaction: number;    // 0-100
}

export interface Store {
  id: StoreId;
  name: string;
  city: string;
  rent: number;
  capacity: number;        // 最大客数/日
  staffIds: StaffId[];
  menuItemIds: MenuItemId[];
  isOpen: boolean;
}

export interface Finances {
  cash: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface MacroEconomy {
  phase: "boom" | "recession" | "depression" | "recovery";
  interestRate: number;    // 0.005 - 0.08
  inflationRate: number;   // 0.005 - 0.06
  consumerConfidence: number; // 0-100
  turnsInPhase: number;
}

export interface GameState {
  turn: number;             // 1ターン = 1週間
  finances: Finances;
  stores: Record<StoreId, Store>;
  staff: Record<StaffId, Staff>;
  menu: Record<MenuItemId, MenuItem>;
  economy: MacroEconomy;
  brandScore: number;       // 0-100
  events: GameEvent[];
}

export interface GameEvent {
  id: string;
  turn: number;
  type: "economic" | "staff" | "menu" | "store" | "random";
  title: string;
  description: string;
  impact: Partial<Finances>;
}
