import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import { fetchBrandProfile, type BrandProfile } from "../services/api";
import TurnResultModal from "./TurnResultModal";
import type { DashboardStackParamList } from "../navigation/types";
import { C } from "../theme";

const PHASE_STYLE = {
  boom:       { label: "BOOM",       color: "#5ce0b8", bg: "#14352a" },
  recovery:   { label: "RECOVERY",   color: "#5bb8d0", bg: "#14303a" },
  recession:  { label: "RECESSION",  color: "#e8a838", bg: "#352a14" },
  depression: { label: "DEPRESSION", color: "#e05c5c", bg: "#351a1a" },
};

type NavProp = NativeStackNavigationProp<DashboardStackParamList, "DashboardScreen">;

const POSITIONING_LABELS: Record<string, { label: string; color: string }> = {
  value: { label: "VALUE", color: C.green },
  standard: { label: "STANDARD", color: C.teal },
  premium_fast_food: { label: "PREMIUM", color: C.amber },
  gourmet: { label: "GOURMET", color: C.accent },
};

export default function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { game, prevGame, processTurn, save, load, isSaving, userId } = useGameStore();
  const [showTurnResult, setShowTurnResult] = useState(false);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  useEffect(() => {
    fetchBrandProfile(userId, 1).then(setBrandProfile).catch(() => undefined);
  }, [game.turn]);

  const stores = Object.values(game.stores);
  const menus = Object.values(game.menu);
  const staffList = Object.values(game.staff);
  const phase = PHASE_STYLE[game.economy.phase];
  const weeklyProfit = game.finances.weeklyRevenue - game.finances.weeklyExpenses;
  const maxBar = Math.max(game.finances.weeklyRevenue, game.finances.weeklyExpenses, 1);

  const advisorMessage = (() => {
    if (stores.length === 0) {
      return "Welcome, Boss! Let's open your first store to start your burger empire.";
    }
    if (menus.length === 0) {
      return "You have a store! Head to Menu Lab to develop your signature burger.";
    }
    if (staffList.length === 0) {
      return "Great menu! Now hire some staff — your store needs a crew to operate.";
    }
    const hasStoreWithMenu = stores.some(s => s.menuItemIds.length > 0);
    if (!hasStoreWithMenu) {
      return "Go to the Stores tab and add your menu items to a store so customers can order!";
    }
    const hasStoreWithStaff = stores.some(s => s.staffIds.length > 0);
    if (!hasStoreWithStaff) {
      return "Go to the Stores tab and assign staff to a store so it can operate!";
    }
    const unassignedStaff = staffList.filter(
      st => !stores.some(s => s.staffIds.includes(st.id))
    );
    if (unassignedStaff.length > 0) {
      return `${unassignedStaff.length} staff member(s) are unassigned. Head to Stores tab to place them!`;
    }
    if (game.finances.weeklyRevenue === 0) {
      return "Everything is set! Tap NEXT WEEK to start generating sales.";
    }
    if (weeklyProfit > 1000) {
      return `Outstanding! $${weeklyProfit.toLocaleString()} profit this week. Time to open another store!`;
    }
    if (weeklyProfit > 0) {
      return `Nice work! You made $${weeklyProfit.toLocaleString()} profit this week. Keep expanding!`;
    }
    if (weeklyProfit < 0) {
      return "We're losing money this week. Check your expenses and menu pricing.";
    }
    return "Business is steady. Consider new menu items or expanding to boost revenue.";
  })();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* NPC Advisor Bubble */}
      <View style={styles.advisorBubble}>
        <View style={styles.advisorAvatar}>
          <Text style={styles.advisorAvatarText}>A</Text>
        </View>
        <View style={styles.bubbleBox}>
          <Text style={styles.bubbleText}>{advisorMessage}</Text>
        </View>
      </View>

      {/* Finance Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>WEEKLY P&L</Text>
          <View style={[styles.plBadge, { backgroundColor: weeklyProfit >= 0 ? "#14352a" : "#351a1a" }]}>
            <Text style={[styles.plBadgeText, { color: weeklyProfit >= 0 ? "#5ce0b8" : "#e05c5c" }]}>
              {weeklyProfit >= 0 ? "+" : ""}{weeklyProfit.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Mini bar chart */}
        <View style={styles.chartArea}>
          <View style={styles.barGroup}>
            <Text style={styles.barLabel}>Revenue</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, styles.barGreen, { width: `${(game.finances.weeklyRevenue / maxBar) * 100}%` as any }]} />
            </View>
            <Text style={styles.barValue}>${game.finances.weeklyRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.barGroup}>
            <Text style={styles.barLabel}>Expenses</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, styles.barRed, { width: `${(game.finances.weeklyExpenses / maxBar) * 100}%` as any }]} />
            </View>
            <Text style={styles.barValue}>${game.finances.weeklyExpenses.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.finSummaryRow}>
          <View style={styles.finSummaryItem}>
            <Text style={styles.finLabel}>Total Revenue</Text>
            <Text style={styles.finValueGreen}>${game.finances.totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finSummaryItem}>
            <Text style={styles.finLabel}>Total Expenses</Text>
            <Text style={styles.finValueRed}>${game.finances.totalExpenses.toLocaleString()}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finSummaryItem}>
            <Text style={styles.finLabel}>Net Profit</Text>
            <Text style={[styles.finValueGreen, game.finances.netProfit < 0 && styles.finValueRed]}>
              ${game.finances.netProfit.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Economy */}
      <View style={[styles.card, { backgroundColor: phase.bg, borderColor: phase.color + "30" }]}>
        <View style={styles.econRow}>
          <View>
            <Text style={styles.cardLabel}>ECONOMY</Text>
            <Text style={[styles.econPhase, { color: phase.color }]}>{phase.label}</Text>
          </View>
          <View style={styles.econStats}>
            <View style={styles.econStat}>
              <Text style={styles.econStatNum}>{Math.round(game.economy.consumerConfidence)}</Text>
              <Text style={styles.econStatLbl}>Conf.</Text>
            </View>
            <View style={styles.econStat}>
              <Text style={styles.econStatNum}>{(game.economy.interestRate * 100).toFixed(1)}%</Text>
              <Text style={styles.econStatLbl}>Rate</Text>
            </View>
            <View style={styles.econStat}>
              <Text style={styles.econStatNum}>{(game.economy.inflationRate * 100).toFixed(1)}%</Text>
              <Text style={styles.econStatLbl}>Infl.</Text>
            </View>
          </View>
        </View>
        <View style={styles.confBarBg}>
          <View style={[styles.confBarFill, { width: `${game.economy.consumerConfidence}%` as any, backgroundColor: phase.color }]} />
        </View>
      </View>

      {/* Events */}
      {game.activeEvents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ACTIVE EVENTS</Text>
          {game.activeEvents.map(ev => (
            <View key={ev.id} style={styles.eventRow}>
              <View style={[styles.evDot, {
                backgroundColor: ev.severity === "major" ? "#e05c5c" : ev.severity === "moderate" ? "#e8a838" : "#5ce0b8"
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.evTitle}>{ev.title}</Text>
                <Text style={styles.evDesc}>{ev.description}</Text>
              </View>
              <Text style={styles.evDuration}>{ev.duration}w</Text>
            </View>
          ))}
        </View>
      )}

      {/* Brand */}
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <Text style={styles.cardLabel}>BRAND POWER</Text>
          <Text style={styles.brandNum}>{brandProfile?.brandScore ?? game.brandScore}</Text>
        </View>
        <View style={styles.brandBarBg}>
          <View style={[styles.brandBarFill, { width: `${Math.min(100, (brandProfile?.brandScore ?? game.brandScore) / 10)}%` as any }]} />
        </View>
        {brandProfile && (
          <View style={styles.brandDetails}>
            <View style={styles.brandDetailItem}>
              <Text style={[styles.brandDetailVal, { color: POSITIONING_LABELS[brandProfile.positioning]?.color ?? C.teal }]}>
                {POSITIONING_LABELS[brandProfile.positioning]?.label ?? brandProfile.positioning}
              </Text>
              <Text style={styles.brandDetailLabel}>Position</Text>
            </View>
            <View style={styles.brandDetailItem}>
              <Text style={[styles.brandDetailVal, { color: brandProfile.brandConsistency >= 60 ? C.green : C.red }]}>
                {brandProfile.brandConsistency}%
              </Text>
              <Text style={styles.brandDetailLabel}>Consistency</Text>
            </View>
            <View style={styles.brandDetailItem}>
              <Text style={[styles.brandDetailVal, { color: brandProfile.weeklyScoreDelta >= 0 ? C.green : C.red }]}>
                {brandProfile.weeklyScoreDelta >= 0 ? "+" : ""}{brandProfile.weeklyScoreDelta}
              </Text>
              <Text style={styles.brandDetailLabel}>Weekly</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#e05c5c" }]}
          onPress={() => navigation.navigate("OpenStoreScreen")}
        >
          <Text style={styles.actIcon}>+</Text>
          <Text style={styles.actLabel}>Open Store</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#e8a838" }]}
          onPress={() => navigation.navigate("MenuLabScreen")}
        >
          <Text style={styles.actIcon}>R&D</Text>
          <Text style={styles.actLabel}>Menu Lab</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#5bb8d0" }]}
          onPress={() => navigation.navigate("HireScreen")}
        >
          <Text style={styles.actIcon}>HR</Text>
          <Text style={styles.actLabel}>Hire Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Strategy Actions */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#5bb8d0" }]}
          onPress={() => navigation.navigate("CampaignScreen")}
        >
          <Text style={styles.actIcon}>AD</Text>
          <Text style={styles.actLabel}>Marketing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#a78bfa" }]}
          onPress={() => navigation.navigate("HQScreen")}
        >
          <Text style={styles.actIcon}>HQ</Text>
          <Text style={styles.actLabel}>Headquarters</Text>
        </TouchableOpacity>
      </View>

      {/* Turn */}
      <TouchableOpacity
        style={styles.turnBtn}
        onPress={() => { processTurn(); setShowTurnResult(true); }}
        activeOpacity={0.85}
      >
        <Text style={styles.turnText}>NEXT WEEK</Text>
      </TouchableOpacity>

      {/* Save/Load */}
      <View style={styles.saveRow}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={async () => { await save(); Alert.alert("Saved!"); }}
          disabled={isSaving}
        >
          <Text style={styles.saveTxt}>{isSaving ? "SAVING..." : "SAVE"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loadBtn}
          onPress={async () => { await load(); Alert.alert("Loaded!"); }}
        >
          <Text style={styles.saveTxt}>LOAD</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* TurnResultModal — グローバル表示 */}
      {showTurnResult && prevGame && (
        <TurnResultModal
          visible={showTurnResult}
          currentGame={game}
          prevGame={prevGame}
          onClose={() => setShowTurnResult(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  // Advisor
  advisorBubble: { flexDirection: "row", gap: 10, marginBottom: 14 },
  advisorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.teal, alignItems: "center", justifyContent: "center" },
  advisorAvatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  bubbleBox: { flex: 1, backgroundColor: C.card, borderRadius: 12, borderTopLeftRadius: 2, padding: 12, borderWidth: 1, borderColor: C.border },
  bubbleText: { color: C.textDim, fontSize: 13, lineHeight: 18 },

  // Card
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 },

  // PL badge
  plBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  plBadgeText: { fontSize: 13, fontWeight: "800" },

  // Chart bars
  chartArea: { marginBottom: 14, gap: 8 },
  barGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 65, fontSize: 11, color: C.textMuted, fontWeight: "600" },
  barTrack: { flex: 1, height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barGreen: { backgroundColor: C.green },
  barRed: { backgroundColor: C.red },
  barValue: { width: 70, fontSize: 11, color: C.textDim, fontWeight: "700", textAlign: "right" },

  // Finance summary
  finSummaryRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  finSummaryItem: { flex: 1, alignItems: "center" },
  finDivider: { width: 1, backgroundColor: C.border },
  finLabel: { fontSize: 9, color: C.textMuted, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  finValueGreen: { fontSize: 14, fontWeight: "800", color: C.green, marginTop: 4 },
  finValueRed: { fontSize: 14, fontWeight: "800", color: C.red, marginTop: 4 },

  // Economy
  econRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  econPhase: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  econStats: { flexDirection: "row", gap: 14 },
  econStat: { alignItems: "center" },
  econStatNum: { fontSize: 15, color: C.text, fontWeight: "800" },
  econStatLbl: { fontSize: 9, color: C.textMuted, marginTop: 1 },
  confBarBg: { height: 4, backgroundColor: C.bg, borderRadius: 2, marginTop: 12, overflow: "hidden" },
  confBarFill: { height: "100%", borderRadius: 2 },

  // Events
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  evDot: { width: 8, height: 8, borderRadius: 4 },
  evTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  evDesc: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  evDuration: { color: C.textDim, fontSize: 11, fontWeight: "700" },

  // Brand
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandNum: { fontSize: 15, fontWeight: "800", color: C.accent },
  brandBarBg: { height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden" },
  brandBarFill: { height: "100%", backgroundColor: C.accent, borderRadius: 3 },
  brandDetails: { flexDirection: "row", marginTop: 10, gap: 8 },
  brandDetailItem: { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 8, alignItems: "center" },
  brandDetailVal: { fontSize: 13, fontWeight: "800" },
  brandDetailLabel: { fontSize: 8, color: C.textMuted, fontWeight: "600", marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" },

  // Actions
  actionGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  actionCard: { flex: 1, paddingVertical: 18, borderRadius: 14, alignItems: "center" },
  actIcon: { fontSize: 16, fontWeight: "900", color: "#fff" },
  actLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginTop: 4, letterSpacing: 0.5 },

  // Turn
  turnBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 18, alignItems: "center", marginBottom: 10 },
  turnText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 2 },

  // Save/Load
  saveRow: { flexDirection: "row", gap: 8 },
  saveBtn: { flex: 1, paddingVertical: 12, backgroundColor: C.border, borderRadius: 10, alignItems: "center" },
  loadBtn: { flex: 1, paddingVertical: 12, backgroundColor: C.card, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: C.border },
  saveTxt: { color: C.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
});
