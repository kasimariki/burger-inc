import type { GameState, Store, MenuItem, Staff } from "../models/types";

// 新規店舗を出店
export function openStore(state: GameState, store: Omit<Store, "id">): GameState {
  const id = `store-${Date.now()}`;
  const openCost = store.rent * 3; // 初期費用=家賃3ヶ月分

  if (state.finances.cash < openCost) {
    throw new Error("資金不足です");
  }

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash - openCost,
    },
    stores: {
      ...state.stores,
      [id]: { ...store, id },
    },
  };
}

// スタッフを採用
export function hireStaff(state: GameState, staff: Omit<Staff, "id">): GameState {
  const id = `staff-${Date.now()}`;
  const hiringCost = staff.salary * 0.5; // 採用コスト=月給の半分

  if (state.finances.cash < hiringCost) {
    throw new Error("資金不足です");
  }

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash - hiringCost,
    },
    staff: {
      ...state.staff,
      [id]: { ...staff, id },
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

// メニューを追加
export function addMenuItem(state: GameState, item: Omit<MenuItem, "id">): GameState {
  const id = `menu-${Date.now()}`;
  const devCost = 500 + item.tasteScore * 20; // 品質が高いほど開発コスト大

  if (state.finances.cash < devCost) {
    throw new Error("資金不足です");
  }

  return {
    ...state,
    finances: {
      ...state.finances,
      cash: state.finances.cash - devCost,
    },
    menu: {
      ...state.menu,
      [id]: { ...item, id },
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
