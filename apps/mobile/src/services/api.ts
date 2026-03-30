const API_BASE = "http://162.43.25.95:3020";

// ---- Core ----

export async function saveGame(userId: string, userName: string, gameState: object) {
  const res = await fetch(`${API_BASE}/api/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, userName, gameState }),
  });
  return res.json();
}

export async function loadGame(userId: string) {
  const res = await fetch(`${API_BASE}/api/save/${userId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getRankings() {
  const res = await fetch(`${API_BASE}/api/rankings`);
  return res.json();
}

// ---- Campaigns ----

export interface CampaignType {
  type: string;
  name: string;
  cost: number;
  reach: number;
  brandImpact: number;
  customerBoostPct: number;
  durationWeeks: number;
  icon: string;
}

export interface Campaign {
  id: number;
  userId: string;
  slotId: number;
  type: string;
  budget: number;
  reach: number;
  brandImpact: number;
  customerBoostPct: number;
  startTurn: number;
  remainingWeeks: number;
  isActive: boolean;
  startedAt: string;
}

export async function fetchCampaignTypes(): Promise<CampaignType[]> {
  const res = await fetch(`${API_BASE}/api/campaigns/types`);
  const data = await res.json();
  return data.types;
}

export async function startCampaign(userId: string, slotId: number, campaignType: string, currentTurn: number) {
  const res = await fetch(`${API_BASE}/api/campaigns/${userId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId, type: campaignType, currentTurn }),
  });
  return res.json();
}

export async function fetchActiveCampaigns(userId: string, slotId: number): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/api/campaigns/${userId}/active?slotId=${slotId}`);
  const data = await res.json();
  return data.campaigns;
}

export async function fetchCampaignHistory(userId: string, slotId: number): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/api/campaigns/${userId}/history?slotId=${slotId}`);
  const data = await res.json();
  return data.campaigns;
}

export async function cancelCampaign(userId: string, campaignId: number) {
  const res = await fetch(`${API_BASE}/api/campaigns/${userId}/${campaignId}`, {
    method: "DELETE",
  });
  return res.json();
}

// ---- HQ / Executives ----

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
  const res = await fetch(`${API_BASE}/api/hq/${userId}`);
  return res.json();
}

export async function createDepartment(userId: string, department: string, staffCount?: number) {
  const res = await fetch(`${API_BASE}/api/hq/department`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, department, staffCount }),
  });
  return res.json();
}

export async function hireExecutive(userId: string, role: string, name: string, salary: number, skill?: number) {
  const res = await fetch(`${API_BASE}/api/executives/hire`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role, name, salary, skill }),
  });
  return res.json();
}

// ---- Financial Reports ----

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
  const res = await fetch(`${API_BASE}/api/finance/${userId}/reports`);
  const data = await res.json();
  return data.reports;
}

// ---- Turn History ----

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
  const res = await fetch(`${API_BASE}/api/game/${userId}/${slotId}/history`);
  const data = await res.json();
  return data.turns;
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
  const res = await fetch(`${API_BASE}/api/game/${userId}/${slotId}/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
  return res.json();
}

// ---- Suppliers ----

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
  return data.suppliers;
}

export async function contractSupplier(userId: string, supplierId: string, pricePerUnit: number, durationWeeks?: number) {
  const res = await fetch(`${API_BASE}/api/suppliers/contract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, supplierId, pricePerUnit, durationWeeks }),
  });
  return res.json();
}
