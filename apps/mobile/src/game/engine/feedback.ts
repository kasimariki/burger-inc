import type { GameState, Store } from "../models/types";

export interface ReputationBreakdown {
  foodQuality: number;    // 0-100: 配置メニューの平均tasteScore
  serviceSpeed: number;   // 0-100: スタッフ数・スキルから算出
  cleanliness: number;    // 0-100: store.cleanliness
  valueForMoney: number;  // 0-100: tasteScore / price 比
}

export interface StoreWarning {
  storeId: string;
  storeName: string;
  message: string;
}

export function calcStoreBreakdown(store: Store, game: GameState): ReputationBreakdown {
  const menuItems = store.menuItemIds.map(id => game.menu[id]).filter(Boolean);
  const staffMembers = store.staffIds.map(id => game.staff[id]).filter(Boolean);

  // 料理品質: 配置メニューの平均tasteScore
  const foodQuality = menuItems.length === 0 ? 0
    : Math.round(menuItems.reduce((sum, m) => sum + m.tasteScore, 0) / menuItems.length);

  // 接客速度: スタッフ数 × ベース + スキルボーナス
  const staffCount = staffMembers.length;
  const avgSkill = staffCount === 0 ? 0
    : staffMembers.reduce((sum, s) => sum + s.skillLevel, 0) / staffCount;
  const baseSpeed = staffCount === 0 ? 0 : staffCount === 1 ? 50 : staffCount === 2 ? 70 : 85;
  const serviceSpeed = Math.min(100, Math.round(baseSpeed + avgSkill * 1.5));

  // 清潔さ: そのまま使用
  const cleanliness = store.cleanliness;

  // コスパ: tasteScore / avgPrice * 10 で正規化
  const avgPrice = menuItems.length === 0 ? 0
    : menuItems.reduce((sum, m) => sum + m.price, 0) / menuItems.length;
  const valueForMoney = avgPrice === 0 ? 0
    : Math.min(100, Math.round(foodQuality / avgPrice * 10));

  return { foodQuality, serviceSpeed, cleanliness, valueForMoney };
}

export function calcAllWarnings(game: GameState): StoreWarning[] {
  const warnings: StoreWarning[] = [];
  for (const store of Object.values(game.stores)) {
    if (!store.isOpen) continue;
    const b = calcStoreBreakdown(store, game);
    if (b.valueForMoney < 50) {
      warnings.push({
        storeId: store.id,
        storeName: store.name,
        message: "コスパが低い（メニュー価格を見直して）",
      });
    }
    if (b.cleanliness < 60) {
      warnings.push({
        storeId: store.id,
        storeName: store.name,
        message: "清潔度が低下中",
      });
    }
    if (b.serviceSpeed < 40) {
      warnings.push({
        storeId: store.id,
        storeName: store.name,
        message: "スタッフが不足している",
      });
    }
  }
  return warnings;
}
