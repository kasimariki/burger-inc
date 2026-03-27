import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import type { GameState } from "../game/models/types";

const C = {
  bg: "#0d1117",
  card: "#161b22",
  border: "#21262d",
  text: "#e6edf3",
  textDim: "#7d8590",
  textMuted: "#484f58",
  accent: "#e05c5c",
  green: "#5ce0b8",
  red: "#e05c5c",
  teal: "#5bb8d0",
  amber: "#e8a838",
};

interface Props {
  visible: boolean;
  currentGame: GameState;
  prevGame: GameState;
  onClose: () => void;
}

export default function TurnResultModal({
  visible,
  currentGame,
  prevGame,
  onClose,
}: Props) {
  const revenue = currentGame.finances.weeklyRevenue;
  const expenses = currentGame.finances.weeklyExpenses;
  const profit = revenue - expenses;

  const brandDelta = currentGame.brandScore - prevGame.brandScore;

  // 新しく発生したイベント（前のターンにはなかったもの）
  const prevEventIds = new Set(prevGame.activeEvents.map((e) => e.id));
  const newEvents = currentGame.activeEvents.filter(
    (e) => !prevEventIds.has(e.id)
  );

  const profitIsPositive = profit >= 0;
  const profitColor = profitIsPositive ? C.green : C.red;
  const profitBg = profitIsPositive ? "#14352a" : "#351a1a";

  const formatDelta = (n: number) =>
    n === 0 ? "±0" : n > 0 ? `+${n}` : `${n}`;

  const severityColor = (s: string) => {
    if (s === "major") return C.red;
    if (s === "moderate") return C.amber;
    return C.green;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.weekLabel}>WEEK {currentGame.turn}</Text>
            <Text style={styles.title}>Weekly Report</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            {/* P&L Summary */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>THIS WEEK'S P&L</Text>

              <View style={styles.plRow}>
                <View style={styles.plItem}>
                  <Text style={styles.plLabel}>Revenue</Text>
                  <Text style={styles.plGreen}>
                    ${revenue.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.plDivider} />
                <View style={styles.plItem}>
                  <Text style={styles.plLabel}>Expenses</Text>
                  <Text style={styles.plRed}>
                    ${expenses.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.plDivider} />
                <View style={styles.plItem}>
                  <Text style={styles.plLabel}>Profit</Text>
                  <Text style={[styles.plProfit, { color: profitColor }]}>
                    {profit >= 0 ? "+" : ""}${profit.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Profit highlight bar */}
              <View style={[styles.profitBar, { backgroundColor: profitBg }]}>
                <Text style={[styles.profitBarText, { color: profitColor }]}>
                  {profitIsPositive
                    ? `Earned $${profit.toLocaleString()} this week`
                    : `Lost $${Math.abs(profit).toLocaleString()} this week`}
                </Text>
              </View>
            </View>

            {/* Brand Score */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>BRAND SCORE</Text>
              <View style={styles.brandRow}>
                <Text style={styles.brandScore}>
                  {currentGame.brandScore}
                  <Text style={styles.brandMax}>/100</Text>
                </Text>
                <View
                  style={[
                    styles.deltaBadge,
                    {
                      backgroundColor:
                        brandDelta >= 0 ? "#14352a" : "#351a1a",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.deltaText,
                      { color: brandDelta >= 0 ? C.green : C.red },
                    ]}
                  >
                    {formatDelta(brandDelta)}
                  </Text>
                </View>
              </View>
              <View style={styles.brandBarBg}>
                <View
                  style={[
                    styles.brandBarFill,
                    { width: `${currentGame.brandScore}%` as any },
                  ]}
                />
              </View>
            </View>

            {/* New Events */}
            {newEvents.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>
                  NEW EVENTS ({newEvents.length})
                </Text>
                {newEvents.map((ev) => (
                  <View key={ev.id} style={styles.eventRow}>
                    <View
                      style={[
                        styles.evDot,
                        { backgroundColor: severityColor(ev.severity) },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.evTitle}>{ev.title}</Text>
                      <Text style={styles.evDesc}>{ev.description}</Text>
                      <Text style={styles.evDuration}>
                        Lasts {ev.duration} week
                        {ev.duration !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {newEvents.length === 0 && (
              <View style={styles.quietCard}>
                <Text style={styles.quietText}>No new events this week</Text>
              </View>
            )}

            {/* Cash status */}
            <View style={styles.cashRow}>
              <Text style={styles.cashLabel}>Current Cash</Text>
              <Text style={styles.cashValue}>
                ${currentGame.finances.cash.toLocaleString()}
              </Text>
            </View>
          </ScrollView>

          {/* Next button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.nextText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: "85%",
    overflow: "hidden",
  },

  header: {
    backgroundColor: C.card,
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: { color: C.text, fontSize: 22, fontWeight: "900" },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // P&L
  plRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  plItem: { flex: 1, alignItems: "center" },
  plDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  plLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  plGreen: { fontSize: 16, fontWeight: "900", color: C.green },
  plRed: { fontSize: 16, fontWeight: "900", color: C.red },
  plProfit: { fontSize: 18, fontWeight: "900" },

  profitBar: {
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  profitBarText: { fontSize: 13, fontWeight: "800" },

  // Brand
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  brandScore: { color: C.text, fontSize: 32, fontWeight: "900" },
  brandMax: { color: C.textMuted, fontSize: 16, fontWeight: "700" },
  deltaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deltaText: { fontSize: 14, fontWeight: "800" },
  brandBarBg: {
    height: 6,
    backgroundColor: C.bg,
    borderRadius: 3,
    overflow: "hidden",
  },
  brandBarFill: {
    height: "100%",
    backgroundColor: C.accent,
    borderRadius: 3,
  },

  // Events
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  evDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  evTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  evDesc: { color: C.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 },
  evDuration: { color: C.textDim, fontSize: 10, marginTop: 4, fontWeight: "600" },

  // Quiet
  quietCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  quietText: { color: C.textMuted, fontSize: 13 },

  // Cash
  cashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cashLabel: { color: C.textDim, fontSize: 13 },
  cashValue: { color: C.green, fontSize: 18, fontWeight: "900" },

  // Footer
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.card,
  },
  nextBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 2 },
});
