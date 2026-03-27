import type { GameState, Store, MenuItem, Staff, Ingredient, IngredientId } from "../models/types";
import { GAME_CONFIG, DEFAULT_INGREDIENTS } from "@burger-inc/shared";

// 新規店舗の入力型（必須フィールドのみ要求、残りはデフォルト値）
type OpenStoreInput = Pick<Store, "name" | "city" | "rent" | "capacity"> &
  Partial<Pick<Store, "type" | "cleanliness" | "reputation">>;

// 新規店舗を出店
export function openStore(state: GameState, input: OpenStoreInput): GameState {
  const id = `store-${Date.now()}`;
  const openCost = input.rent * GAME_CONFIG.store.openingCostMonths;

  if (state.finances.cash < openCost) {
    throw new Error("資金不足です");
  }

  const store: Store = {
    id,
    name: input.name,
    city: input.city,
    type: input.type ?? "street",
    rent: input.rent,
    capacity: input.capacity,
    staffIds: [],
    menuItemIds: [],
    isOpen: true,
    cleanliness: input.cleanliness ?? 80,
    reputation: input.reputation ?? 50,
  };

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash - openCost,
    },
    stores: {
      ...state.stores,
      [id]: store,
    },
  };
}

// スタッフ採用の入力型
type HireStaffInput = Pick<Staff, "name" | "role" | "skillLevel" | "salary"> &
  Partial<Pick<Staff, "satisfaction" | "loyalty">>;

// スタッフを採用
export function hireStaff(state: GameState, input: HireStaffInput): GameState {
  const id = `staff-${Date.now()}`;
  const hiringCost = input.salary * 0.5;

  if (state.finances.cash < hiringCost) {
    throw new Error("資金不足です");
  }

  const staff: Staff = {
    id,
    name: input.name,
    role: input.role,
    skillLevel: input.skillLevel,
    salary: input.salary,
    satisfaction: input.satisfaction ?? 70,
    loyalty: input.loyalty ?? 50,
    turnsEmployed: 0,
  };

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash - hiringCost,
    },
    staff: {
      ...state.staff,
      [id]: staff,
    },
  };
}

// スタッフを店舗に配置
export function assignStaffToStore(
  state: GameState,
  staffId: string,
  storeId: string
): GameState {
  const store = state.stores[storeId];
  if (!store) throw new Error("店舗が見つかりません");
  if (!state.staff[staffId]) throw new Error("スタッフが見つかりません");
  if (store.staffIds.includes(staffId)) return state;

  return {
    ...state,
    stores: {
      ...state.stores,
      [storeId]: {
        ...store,
        staffIds: [...store.staffIds, staffId],
      },
    },
  };
}

// サイドメニュー・ドリンクを追加（バーガーは buildBurger を使用）
type AddMenuInput = Pick<MenuItem, "name" | "category" | "price" | "cost" | "tasteScore"> &
  Partial<Pick<MenuItem, "tags" | "popularity" | "cookTime" | "developmentTurns">>;

export function addMenuItem(state: GameState, input: AddMenuInput): GameState {
  const id = `menu-${Date.now()}`;
  const devCost = 500 + input.tasteScore * 20;

  if (state.finances.cash < devCost) {
    throw new Error("資金不足です");
  }

  const item: MenuItem = {
    id,
    name: input.name,
    category: input.category,
    price: input.price,
    cost: input.cost,
    tags: input.tags ?? [],
    tasteScore: input.tasteScore,
    popularity: input.popularity ?? 50,
    cookTime: input.cookTime ?? 3,
    developmentTurns: input.developmentTurns ?? 1,
  };

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash - devCost,
    },
    menu: {
      ...state.menu,
      [id]: item,
    },
  };
}

// メニューを店舗に追加
export function addMenuToStore(
  state: GameState,
  menuItemId: string,
  storeId: string
): GameState {
  const store = state.stores[storeId];
  if (!store) throw new Error("店舗が見つかりません");
  if (!state.menu[menuItemId]) throw new Error("メニューが見つかりません");
  if (store.menuItemIds.includes(menuItemId)) return state;

  return {
    ...state,
    stores: {
      ...state.stores,
      [storeId]: {
        ...store,
        menuItemIds: [...store.menuItemIds, menuItemId],
      },
    },
  };
}
