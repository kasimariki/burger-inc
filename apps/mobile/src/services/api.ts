import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://162.43.25.95:3020";
const TOKEN_KEY = "burger-inc-jwt";

// ============================================================
// Auth Token Management
// ============================================================

let cachedToken: string | null = null;

async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

async function setToken(token: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

async function clearToken(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** 認証付きfetch。401の場合は自動再登録を試みる */
async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  let token = await getToken();

  // トークンがなければ自動登録
  if (!token) {
    token = await autoRegister();
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers ?? {}) },
  });

  // 401なら再登録してリトライ
  if (res.status === 401) {
    token = await autoRegister();
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...authHeaders(token), ...(init?.headers ?? {}) },
    });
  }

  return res;
}

// ============================================================
// Auth API
// ============================================================

export async function register(username: string, email: string, password: string): Promise<{ token: string; userId: string }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (data.token) await setToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; userId: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) await setToken(data.token);
  return data;
}

export async function getMe(): Promise<{ userId: string; name: string; email: string } | null> {
  try {
    const res = await authFetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    // サーバーは { id, name, email } を返すので userId にマッピング
    return { userId: data.id, name: data.name, email: data.email };
  } catch {
    return null;
  }
}

/** トークンがない場合にデフォルトユーザーで自動登録/ログイン */
async function autoRegister(): Promise<string> {
  // まずログインを試行
  try {
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "player@burger-inc.local", password: "burger-inc-2026" }),
    });
    const loginData = await loginRes.json();
    if (loginData.token) {
      await setToken(loginData.token);
      return loginData.token;
    }
  } catch { /* login failed, try register */ }

  // ログイン失敗なら新規登録
  const regRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "プレイヤー1", email: "player@burger-inc.local", password: "burger-inc-2026" }),
  });
  const regData = await regRes.json();
  if (regData.token) {
    await setToken(regData.token);
    return regData.token;
  }

  throw new Error("Auto-register failed");
}

export async function logout(): Promise<void> {
  await clearToken();
}

export { getToken };

// ============================================================
// Core — Save / Load / Rankings
// ============================================================

export async function saveGame(userId: string, userName: string, gameState: object, slotId = 1) {
  const res = await authFetch("/api/save", {
    method: "POST",
    body: JSON.stringify({ userId, userName, gameState, slotId }),
  });
  return res.json();
}

export async function loadGame(userId: string, slotId?: number) {
  const path = slotId ? `/api/save/${userId}/${slotId}` : `/api/save/${userId}`;
  const res = await authFetch(path);
  if (!res.ok) return null;
  return res.json();
}

export async function getRankings(sort?: string) {
  const qs = sort ? `?sort=${sort}` : "";
  const res = await fetch(`${API_BASE}/api/rankings${qs}`);
  return res.json();
}

export async function getStats(userId: string) {
  const res = await authFetch(`/api/stats/${userId}`);
  if (!res.ok) return null;
  return res.json();
}

// ============================================================
// Campaigns
// ============================================================

export interface CampaignType {
  id: string;
  name: string;
  description: string;
  cost: number;
  reach: number;
  brandImpact: number;
  customerBoostPct: number;
  durationWeeks: number;
  icon: string;
}

export interface Campaign {
  id: number;
  type: string;
  name: string;
  icon: string;
  budget: number;
  reach: number;
  brandImpact: number;
  customerBoostPct: number;
  startTurn: number;
  remainingWeeks: number;
  startedAt: string;
}

export async function fetchCampaignTypes(): Promise<CampaignType[]> {
  const res = await fetch(`${API_BASE}/api/campaigns/types`);
  const data = await res.json();
  return data.types;
}

export async function startCampaign(userId: string, slotId: number, campaignType: string, currentTurn: number) {
  const res = await authFetch(`/api/campaigns/${userId}/start`, {
    method: "POST",
    body: JSON.stringify({ slotId, type: campaignType, turn: currentTurn }),
  });
  return res.json();
}

export async function fetchActiveCampaigns(userId: string, slotId: number): Promise<Campaign[]> {
  const res = await authFetch(`/api/campaigns/${userId}/active?slotId=${slotId}`);
  const data = await res.json();
  return data.activeCampaigns ?? [];
}

export async function fetchCampaignHistory(userId: string, slotId: number): Promise<Campaign[]> {
  const res = await authFetch(`/api/campaigns/${userId}/history?slotId=${slotId}`);
  const data = await res.json();
  return data.history ?? [];
}

export async function cancelCampaign(userId: string, campaignId: number) {
  const res = await authFetch(`/api/campaigns/${userId}/${campaignId}`, {
    method: "DELETE",
  });
  return res.json();
}

// ============================================================
// HQ / Executives
// ============================================================

export interface Department {
  id: number;
  userId: string;
  department: string;
  level: number;
  staffCount: number;
  efficiency: number;
  createdAt: string;
}

export interface Executive {
  id: number;
  userId: string;
  role: string;
  name: string;
  skill: number;
  salary: number;
  hiredAt: string;
}

export async function fetchHQ(userId: string): Promise<{ departments: Department[]; executives: Executive[] }> {
  const res = await authFetch(`/api/hq/${userId}`);
  return res.json();
}

export async function createDepartment(userId: string, department: string, staffCount?: number) {
  const res = await authFetch("/api/hq/department", {
    method: "POST",
    body: JSON.stringify({ userId, department, staffCount }),
  });
  return res.json();
}

export async function hireExecutive(userId: string, role: string, name: string, salary: number, skill?: number) {
  const res = await authFetch("/api/executives/hire", {
    method: "POST",
    body: JSON.stringify({ userId, role, name, salary, skill }),
  });
  return res.json();
}

// ============================================================
// Financial Reports
// ============================================================

export interface FinancialReport {
  id: number;
  userId: string;
  quarter: number;
  year: number;
  revenue: number;
  expenses: number;
  netProfit: number;
  assets: number;
  liabilities: number;
  cashFlow: number;
  createdAt: string;
}

export async function fetchFinancialReports(userId: string): Promise<FinancialReport[]> {
  const res = await authFetch(`/api/finance/${userId}/reports`);
  const data = await res.json();
  return data.reports ?? [];
}

// ============================================================
// Turn History / Snapshots
// ============================================================

export interface TurnSnapshot {
  turnNumber: number;
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  netProfit: number;
  avgReputation: number;
  storeCount: number;
  brandScore: number;
  recordedAt: string;
}

export async function fetchTurnHistory(userId: string, slotId: number): Promise<TurnSnapshot[]> {
  const res = await authFetch(`/api/game/${userId}/${slotId}/history`);
  const data = await res.json();
  return data.turns ?? [];
}

export async function saveTurnSnapshot(userId: string, slotId: number, snapshot: {
  turnNumber: number;
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  netProfit: number;
  avgReputation: number;
  storeCount: number;
  brandScore: number;
}) {
  const res = await authFetch(`/api/game/${userId}/${slotId}/snapshot`, {
    method: "POST",
    body: JSON.stringify(snapshot),
  });
  return res.json();
}

// ============================================================
// Suppliers
// ============================================================

export interface Supplier {
  id: string;
  name: string;
  category: string;
  quality: number;
  costMultiplier: number;
  reliability: number;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${API_BASE}/api/suppliers`);
  const data = await res.json();
  return data.suppliers ?? [];
}

export async function contractSupplier(userId: string, supplierId: string, pricePerUnit: number, durationWeeks?: number) {
  const res = await authFetch("/api/suppliers/contract", {
    method: "POST",
    body: JSON.stringify({ userId, supplierId, pricePerUnit, durationWeeks }),
  });
  return res.json();
}

// ============================================================
// Cities (Phase 3A)
// ============================================================

export interface City {
  id: string;
  name: string;
  type: string;
  rentMultiplier: number;
  demographics: {
    thriftyWorker: number;
    qualityHunter: number;
    trendChaser: number;
    familyCrew: number;
  };
  hasSeasonal: boolean;
  notes: string | null;
  isUnlocked: boolean;
  canUnlock: boolean;
  unlockProgress: {
    brandScore: { current: number; required: number; ok: boolean };
    storeCount: { current: number; required: number; ok: boolean };
    cash: { current: number; required: number; ok: boolean };
  } | null;
}

export async function fetchCities(): Promise<City[]> {
  const res = await fetch(`${API_BASE}/api/cities`);
  const data = await res.json();
  return data.cities ?? [];
}

export async function fetchCityStatus(userId: string, slotId: number): Promise<City[]> {
  const res = await authFetch(`/api/cities/${userId}/status?slotId=${slotId}`);
  const data = await res.json();
  return data.cities ?? [];
}

export async function fetchUnlockedCities(userId: string, slotId: number): Promise<string[]> {
  const res = await authFetch(`/api/cities/${userId}/unlocked?slotId=${slotId}`);
  const data = await res.json();
  return data.unlockedCities ?? [];
}

export interface RevenuePreview {
  cityId: string;
  cityName: string;
  storeType: string;
  positioning: string;
  segmentCompatibility: number;
  seasonalModifier: number;
  weeklyCustomers: number;
  weeklyRevenue: number;
  estimatedWeeklyRent: number;
  estimatedNetWeekly: number;
  demographics: { thriftyWorker: number; qualityHunter: number; trendChaser: number; familyCrew: number };
  tip: string | null;
}

export async function fetchRevenuePreview(params: {
  cityId: string;
  storeType: string;
  positioning: string;
  capacity: number;
  avgMenuPrice: number;
  avgTasteScore: number;
  staffCount: number;
  turn: number;
  economyPhase?: string;
}): Promise<RevenuePreview> {
  const res = await fetch(`${API_BASE}/api/cities/revenue-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

// ============================================================
// Brand (Phase 2C)
// ============================================================

export type BrandPositioning = "value" | "standard" | "premium_fast_food" | "gourmet";

export interface BrandProfile {
  userId: string;
  slotId: number;
  positioning: BrandPositioning;
  brandScore: number;
  brandConsistency: number;
  weeklyScoreDelta: number;
  unlocks: {
    risingBrandBadge: boolean;
    franchiseUnlocked: boolean;
    loanRateImproved: boolean;
    rareExecutiveMarket: boolean;
    brandEmpireRoute: boolean;
  };
  warning?: string | null;
}

export async function fetchBrandProfile(userId: string, slotId: number): Promise<BrandProfile> {
  const res = await authFetch(`/api/game/${userId}/brand?slotId=${slotId}`);
  return res.json();
}

export async function updateBrandProfile(userId: string, params: {
  slotId?: number;
  positioning?: BrandPositioning;
  brandScore?: number;
  avgRating?: number;
  adSpend?: number;
  menus?: { tasteScore: number; price: number }[];
}): Promise<BrandProfile> {
  const res = await authFetch(`/api/game/${userId}/brand`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.json();
}

// ============================================================
// Feedback (WeeklyFeedbackSummary)
// ============================================================

export interface StoreMetricsInput {
  storeId: string;
  staffCount: number;
  capacity: number;
  avgSkillLevel: number;
  cleanliness: number;
  avgTasteScore: number;
  avgMenuPrice: number;
  currentReputation: number;
}

export interface StoreFeedback {
  storeId: string;
  metrics: {
    foodQuality: number;
    serviceSpeed: number;
    cleanlinessLevel: number;
    valueForMoney: number;
  };
  derivedReputation: number;
  reputationDelta: number;
  topIssue: "slow_service" | "low_quality" | "overpriced" | "dirty" | null;
  averageRating: number;
}

export interface FeedbackResponse {
  userId: string;
  slotId: number;
  turn: number;
  feedback: StoreFeedback[];
  summary: {
    avgReputation: number;
    avgRating: number;
    criticalIssues: { storeId: string; issue: string }[];
  };
}

export async function submitWeeklyFeedback(
  userId: string,
  slotId: number,
  turn: number,
  stores: StoreMetricsInput[]
): Promise<FeedbackResponse> {
  const res = await authFetch(`/api/game/${userId}/${slotId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ turn, stores }),
  });
  return res.json();
}

export async function fetchLatestFeedback(userId: string, slotId: number) {
  const res = await authFetch(`/api/game/${userId}/${slotId}/feedback/latest`);
  if (!res.ok) return null;
  return res.json();
}
