import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { fetchTurnHistory, type TurnSnapshot } from "../services/api";
import { C } from "../theme";

const USER_ID = "user-001";
const SLOT_ID = 1;
const SCREEN_W = Dimensions.get("window").width - 28; // padding
const CHART_H = 160;
const CHART_W = SCREEN_W - 60; // label space

type Metric = "cash" | "weeklyRevenue" | "netProfit" | "avgReputation" | "brandScore";

const METRICS: { key: Metric; label: string; color: string; format: (v: number) => string }[] = [
  { key: "cash",           label: "Cash",       color: C.green, format: v => `$${v.toLocaleString()}` },
  { key: "weeklyRevenue",  label: "Revenue",    color: C.teal,  format: v => `$${v.toLocaleString()}` },
  { key: "netProfit",      label: "Profit",     color: C.amber, format: v => `$${v.toLocaleString()}` },
  { key: "avgReputation",  label: "Reputation", color: "#a78bfa", format: v => v.toFixed(1) },
  { key: "brandScore",     label: "Brand",      color: C.accent, format: v => v.toFixed(0) },
];

function MiniChart({ data, metric }: { data: TurnSnapshot[]; metric: typeof METRICS[number] }) {
  if (data.length < 2) {
    return (
      <View style={[styles.chartBox, { height: CHART_H, justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.noData}>Need at least 2 turns of data</Text>
      </View>
    );
  }

  const values = data.map(d => d[metric.key] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const barW = Math.max(2, Math.min(12, CHART_W / data.length - 1));

  return (
    <View style={styles.chartBox}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Text style={styles.yLabel}>{metric.format(max)}</Text>
        <Text style={styles.yLabel}>{metric.format((max + min) / 2)}</Text>
        <Text style={styles.yLabel}>{metric.format(min)}</Text>
      </View>

      {/* Bars */}
      <View style={styles.chartArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsContainer}>
          {values.map((v, i) => {
            const h = ((v - min) / range) * (CHART_H - 30) + 4;
            return (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: h, backgroundColor: metric.color, width: barW }]} />
                {i % Math.ceil(data.length / 6) === 0 && (
                  <Text style={styles.xLabel}>W{data[i].turnNumber}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<TurnSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(0);

  useEffect(() => {
    (async () => {
      const data = await fetchTurnHistory(USER_ID, SLOT_ID);
      setHistory(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  const metric = METRICS[selectedMetric];
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Metric selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricScroll}>
        {METRICS.map((m, i) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.metricChip, selectedMetric === i && { backgroundColor: m.color + "20", borderColor: m.color }]}
            onPress={() => setSelectedMetric(i)}
          >
            <View style={[styles.metricDot, { backgroundColor: m.color }]} />
            <Text style={[styles.metricChipText, selectedMetric === i && { color: m.color }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current value card */}
      {latest && (
        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>{metric.label}</Text>
          <Text style={[styles.valueBig, { color: metric.color }]}>{metric.format(latest[metric.key] as number)}</Text>
          {prev && (
            <Text style={styles.valueDelta}>
              {(() => {
                const curr = latest[metric.key] as number;
                const p = prev[metric.key] as number;
                const delta = curr - p;
                const sign = delta >= 0 ? "+" : "";
                return `${sign}${metric.format(delta)} from last week`;
              })()}
            </Text>
          )}
        </View>
      )}

      {/* Chart */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{metric.label.toUpperCase()} TREND</Text>
        <MiniChart data={history} metric={metric} />
      </View>

      {/* Data table */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>RECENT TURNS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, { width: 50 }]}>Week</Text>
          <Text style={[styles.thText, { flex: 1 }]}>Cash</Text>
          <Text style={[styles.thText, { flex: 1 }]}>Revenue</Text>
          <Text style={[styles.thText, { flex: 1 }]}>Profit</Text>
        </View>
        {[...history].reverse().slice(0, 10).map(t => (
          <View key={t.turnNumber} style={styles.tableRow}>
            <Text style={[styles.tdText, { width: 50 }]}>W{t.turnNumber}</Text>
            <Text style={[styles.tdText, { flex: 1 }]}>${t.cash.toLocaleString()}</Text>
            <Text style={[styles.tdText, { flex: 1 }]}>${t.weeklyRevenue.toLocaleString()}</Text>
            <Text style={[styles.tdText, { flex: 1, color: t.netProfit >= 0 ? C.green : C.red }]}>
              ${t.netProfit.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  metricScroll: { marginBottom: 14 },
  metricChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginRight: 8 },
  metricDot: { width: 8, height: 8, borderRadius: 4 },
  metricChipText: { color: C.textMuted, fontSize: 12, fontWeight: "700" },

  valueCard: { backgroundColor: C.card, borderRadius: 14, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  valueLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5 },
  valueBig: { fontSize: 32, fontWeight: "900", marginTop: 6 },
  valueDelta: { fontSize: 12, color: C.textDim, marginTop: 4 },

  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, marginBottom: 12 },

  chartBox: { flexDirection: "row", height: CHART_H },
  yAxis: { width: 55, justifyContent: "space-between", paddingVertical: 4 },
  yLabel: { fontSize: 9, color: C.textMuted, textAlign: "right" },
  chartArea: { flex: 1 },
  barsContainer: { flexDirection: "row", alignItems: "flex-end", gap: 2, paddingBottom: 16 },
  barCol: { alignItems: "center" },
  bar: { borderRadius: 2 },
  xLabel: { fontSize: 8, color: C.textMuted, marginTop: 3 },
  noData: { color: C.textMuted, fontSize: 12 },

  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 8, marginBottom: 4 },
  thText: { fontSize: 10, fontWeight: "700", color: C.textMuted, letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border + "40" },
  tdText: { fontSize: 12, color: C.textDim },
});
