import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import {
  fetchCampaignTypes,
  fetchActiveCampaigns,
  fetchCampaignHistory,
  startCampaign,
  cancelCampaign,
  type CampaignType,
  type Campaign,
} from "../services/api";
import { C } from "../theme";

const SLOT_ID = 1;
const MAX_ACTIVE = 2;

export default function CampaignScreen() {
  const { game, userId } = useGameStore();
  const [types, setTypes] = useState<CampaignType[]>([]);
  const [active, setActive] = useState<Campaign[]>([]);
  const [history, setHistory] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"launch" | "active" | "history">("launch");

  const reload = async () => {
    setLoading(true);
    const [t, a, h] = await Promise.all([
      fetchCampaignTypes(),
      fetchActiveCampaigns(userId, SLOT_ID),
      fetchCampaignHistory(userId, SLOT_ID),
    ]);
    setTypes(t ?? []);
    setActive(a ?? []);
    setHistory(h ?? []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const totalBoost = active.reduce((sum, c) => sum + (c.customerBoostPct ?? 0), 0);
  const boostCapped = Math.min(totalBoost * 100, 60);

  const handleLaunch = async (ct: CampaignType) => {
    if (active.length >= MAX_ACTIVE) {
      Alert.alert("Limit Reached", `Max ${MAX_ACTIVE} campaigns at a time.`);
      return;
    }
    if (game.finances.cash < ct.cost) {
      Alert.alert("Not Enough Cash", `Need $${ct.cost.toLocaleString()}.`);
      return;
    }
    await startCampaign(userId, SLOT_ID, ct.id, game.turn);
    await reload();
  };

  const handleCancel = async (c: Campaign) => {
    Alert.alert("Cancel Campaign?", "No refund will be given.", [
      { text: "Keep", style: "cancel" },
      { text: "Cancel It", style: "destructive", onPress: async () => {
        await cancelCampaign(userId, c.id);
        await reload();
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Boost summary */}
      <View style={styles.boostCard}>
        <Text style={styles.boostLabel}>CAMPAIGN BOOST</Text>
        <Text style={styles.boostValue}>+{boostCapped.toFixed(0)}%</Text>
        <View style={styles.boostBarBg}>
          <View style={[styles.boostBarFill, { width: `${boostCapped}%` as any }]} />
        </View>
        <Text style={styles.boostSub}>
          {active.length}/{MAX_ACTIVE} active | Max boost: 60%
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.segmentRow}>
        {(["launch", "active", "history"] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.segmentBtn, tab === t && styles.segmentActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t === "launch" ? "Launch" : t === "active" ? `Active (${active.length})` : "History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Launch tab */}
      {tab === "launch" && types.map(ct => {
        const alreadyActive = active.some(a => a.type === ct.id);
        const canAfford = game.finances.cash >= ct.cost;
        const disabled = alreadyActive || !canAfford || active.length >= MAX_ACTIVE;

        return (
          <View key={ct.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardIcon}>{ct.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{ct.name}</Text>
                <Text style={styles.cardSub}>
                  {ct.durationWeeks}w | Reach: {ct.reach.toLocaleString()} | Brand +{ct.brandImpact}
                </Text>
              </View>
              <View style={styles.costBadge}>
                <Text style={styles.costText}>${ct.cost.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>+{(ct.customerBoostPct * 100).toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Customers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{ct.reach.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Reach</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>+{ct.brandImpact}</Text>
                <Text style={styles.statLabel}>Brand</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.launchBtn, disabled && styles.launchBtnDisabled]}
              onPress={() => handleLaunch(ct)}
              disabled={disabled}
            >
              <Text style={styles.launchBtnText}>
                {alreadyActive ? "ALREADY ACTIVE" : !canAfford ? "INSUFFICIENT FUNDS" : "LAUNCH"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Active tab */}
      {tab === "active" && (active.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active campaigns</Text>
        </View>
      ) : active.map(c => (
        <View key={c.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.type.toUpperCase()}</Text>
              <Text style={styles.cardSub}>
                {c.remainingWeeks}w remaining | +{(c.customerBoostPct * 100).toFixed(0)}% customers
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${Math.max(0, (1 - c.remainingWeeks / 4) * 100)}%` as any
            }]} />
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(c)}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )))}

      {/* History tab */}
      {tab === "history" && (history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No campaign history</Text>
        </View>
      ) : history.map(c => (
        <View key={c.id} style={[styles.card, { opacity: 0.7 }]}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.type.toUpperCase()}</Text>
              <Text style={styles.cardSub}>
                Week {c.startTurn} | Budget: ${c.budget.toLocaleString()} | {c.isActive ? "Active" : "Completed"}
              </Text>
            </View>
          </View>
        </View>
      )))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  boostCard: { backgroundColor: "#1a2332", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.teal + "40" },
  boostLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5 },
  boostValue: { fontSize: 28, fontWeight: "900", color: C.teal, marginTop: 4 },
  boostBarBg: { height: 6, backgroundColor: C.bg, borderRadius: 3, marginTop: 10, overflow: "hidden" },
  boostBarFill: { height: "100%", backgroundColor: C.teal, borderRadius: 3 },
  boostSub: { fontSize: 11, color: C.textMuted, marginTop: 6 },

  segmentRow: { flexDirection: "row", backgroundColor: C.card, borderRadius: 10, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: C.teal },
  segmentText: { color: C.textMuted, fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: "#fff", fontSize: 12, fontWeight: "700" },

  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { fontSize: 28 },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "800" },
  cardSub: { color: C.textDim, fontSize: 11, marginTop: 2 },

  costBadge: { backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  costText: { color: C.amber, fontSize: 13, fontWeight: "800" },

  statsRow: { flexDirection: "row", marginTop: 14, gap: 8 },
  statItem: { flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 10, alignItems: "center" },
  statNum: { color: C.text, fontSize: 15, fontWeight: "800" },
  statLabel: { color: C.textMuted, fontSize: 9, fontWeight: "600", marginTop: 2, letterSpacing: 0.5 },

  launchBtn: { backgroundColor: C.teal, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  launchBtnDisabled: { backgroundColor: C.border },
  launchBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  progressBarBg: { height: 4, backgroundColor: C.bg, borderRadius: 2, marginTop: 12, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: C.green, borderRadius: 2 },

  cancelBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.red + "60", alignItems: "center" },
  cancelBtnText: { color: C.red, fontSize: 11, fontWeight: "700", letterSpacing: 1 },

  emptyCard: { backgroundColor: C.card, borderRadius: 14, padding: 30, alignItems: "center", borderWidth: 1, borderColor: C.border },
  emptyText: { color: C.textMuted, fontSize: 13 },
});
