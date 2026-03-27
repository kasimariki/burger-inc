// モバイル側の型定義 — @burger-inc/shared から再エクスポート
// 既存コードとの互換性を維持しつつ、shared パッケージに移行

export type {
  MenuItemId,
  StoreId,
  StaffId,
  IngredientId,
  RecipeId,
  EventId,
  Ingredient,
  Recipe,
  MenuItem,
  Staff,
  Store,
  Finances,
  MacroEconomy,
  EconomyPhase,
  GameEvent,
  GameEventType,
  EventSeverity,
  EventImpact,
  GameState,
} from "@burger-inc/shared";
