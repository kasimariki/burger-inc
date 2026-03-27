const API_BASE = "http://162.43.25.95:3020";

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
