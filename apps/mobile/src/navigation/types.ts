import type { Store } from "../game/models/types";

// ---- Stack params ----

export type DashboardStackParamList = {
  DashboardScreen: undefined;
  OpenStoreScreen: undefined;
  MenuLabScreen: undefined;
  HireScreen: undefined;
  CampaignScreen: undefined;
  HQScreen: undefined;
};

export type StoresStackParamList = {
  StoreListScreen: undefined;
  StoreDetailScreen: { storeId: string };
};

export type MenuStackParamList = {
  MenuListScreen: undefined;
};

export type StaffStackParamList = {
  StaffListScreen: undefined;
};

export type FinanceStackParamList = {
  FinanceScreen: undefined;
  HistoryScreen: undefined;
};

// ---- Bottom Tab params ----

export type RootTabParamList = {
  DashboardTab: undefined;
  StoresTab: undefined;
  MenuTab: undefined;
  StaffTab: undefined;
  FinanceTab: undefined;
};
