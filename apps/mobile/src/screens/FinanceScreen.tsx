import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import { C } from "../theme";
import type { FinanceStackParamList } from "../navigation/types";

type NavProp = NativeStackNavigationProp<FinanceStackParamList, "FinanceScreen">;

export default function FinanceScreen() {
  const navigation = useNavigation<NavProp>();
  const { game } = useGameStore();

  // 経費内訳をゲーム状態から計算
  const inflationMult = 1 + game.economy.inflationRate;
  const openStores = Object.values(game.stores).filter(s => s.isOpen);

  const weeklyRent = Math.round(
    openStores.reduce((sum, s) => sum + s.rent / 4, 0) * inflationMult
  );
  const weeklySalary = Math.round(
    Object.values(game.staff).reduce((sum, s) => sum + s.salary / 4, 0) * inflationMult
  );
  const weeklyFoodCost = Math.max(0, game.finances.weeklyExpenses - weeklyRent - weeklySalary);

  const totalBreakdown = weeklyRent + weeklySalary + weeklyFoodCost;
  const rentPct   = totalBreakdown === 0 ? 0 : Math.round((weeklyRent / totalBreakdown) * 100);
  const salaryPct = totalBreakdown === 0 ? 0 : Math.round((weeklySalary / totalBreakdown) * 100);
  const foodPct   = totalBreakdown === 0 ? 0 : Math.round((weeklyFoodCost / totalBreakdown) * 100);

  const supplier = game.activeSupplier ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Big numbers */}
      <View style={styles.finBigRow}>
        <View style={styles.finBigCard}>
          <Text style={styles.finBigLabel}>Total Revenue</Text>
          <Text style={styles.finBigGreen}>${game.finances.totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={styles.finBigCard}>
          <Text style={styles.finBigLabel}>Net Profit</Text>
          <Text style={[styles.finBigGreen, game.finances.netProfit < 0 && { color: C.red }]}>
            ${game.finances.netProfit.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Income */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>INCOME</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Weekly Revenue (after tax)</Text>
          <Text style={styles.tblValue}>${game.finances.weeklyRevenue.toLocaleString()}</Text>
        </View>
        <View style={[styles.tableRow, styles.tableRowLast]}>
          <Text style={styles.tblLabel}>Total Revenue (gross)</Text>
          <Text style={styles.tblValueBold}>${game.finances.totalRevenue.toLocaleString()}</Text>
        </View>
      </View>

      {/* Expense breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>WEEKLY EXPENSES BREAKDOWN</Text>

        {[
          { label: "家賃 (Rent)",   value: weeklyRent,     pct: rentPct,   color: C.red },
          { label: "給与 (Salary)", value: weeklySalary,   pct: salaryPct, color: C.amber },
          { label: "食材 (Food)",   value: weeklyFoodCost, pct: foodPct,   color: C.teal },
        ].map(({ label, value, pct, color }) => (
          <View key={label} style={styles.breakdownRow}>
            <View style={styles.breakdownTop}>
              <Text style={styles.tblLabel}>{label}</Text>
              <Text style={[styles.tblValueBold, { color }]}>${value.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownBarBg}>
              <View
                style={[
                  styles.breakdownBarFill,
                  { width: `${pct}%` as any, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={[styles.breakdownPct, { color }]}>{pct}%</Text>
          </View>
        ))}

        <View style={[styles.tableRow, styles.tableRowLast, { marginTop: 4 }]}>
          <Text style={styles.tblLabel}>Total Expenses</Text>
          <Text style={styles.tblValueBold}>${game.finances.weeklyExpenses.toLocaleString()}/wk</Text>
        </View>
      </View>

      {/* Supplier card */}
      <View style={styles.card}>
        <View style={styles.supplierHeader}>
          <Text style={styles.cardLabel}>SUPPLIER</Text>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate("SupplierScreen")}
            activeOpacity={0.8}
          >
            <Text style={styles.manageBtnText}>Manage →</Text>
          </TouchableOpacity>
        </View>

        {supplier ? (
          <>
            <Text style={styles.supplierName}>{supplier.name}</Text>
            <View style={styles.supplierStatRow}>
              <View style={styles.supplierStat}>
                <Text style={styles.supplierStatLabel}>食材コスト</Text>
                <Text style={[
                  styles.supplierStatValue,
                  { color: supplier.costMultiplier < 1 ? C.green : supplier.costMultiplier > 1 ? C.amber : C.textDim }
                ]}>
                  {supplier.costMultiplier < 1
                    ? `-${Math.round((1 - supplier.costMultiplier) * 100)}%`
                    : supplier.costMultiplier > 1
                    ? `+${Math.round((supplier.costMultiplier - 1) * 100)}%`
                    : "±0%"}
                </Text>
              </View>
              <View style={styles.supplierStat}>
                <Text style={styles.supplierStatLabel}>品質ボーナス</Text>
                <Text style={[styles.supplierStatValue, { color: C.teal }]}>
                  {supplier.qualityBonus >= 0 ? `+${supplier.qualityBonus}` : supplier.qualityBonus}pts
                </Text>
              </View>
              <View style={styles.supplierStat}>
                <Text style={styles.supplierStatLabel}>信頼性</Text>
                <Text style={styles.supplierStatValue}>{supplier.reliability}</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noSupplierText}>
            サプライヤー未契約。「Manage」から最適な仕入れ先を選択してください。
          </Text>
        )}
      </View>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>SUMMARY</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Starting Cash</Text>
          <Text style={styles.tblValue}>$50,000</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Current Cash</Text>
          <Text style={styles.tblValueBold}>${game.finances.cash.toLocaleString()}</Text>
        </View>
        <View style={[styles.tableRow, styles.tableRowLast]}>
          <Text style={styles.tblLabel}>Cumulative Net Profit</Text>
          <Text style={[styles.tblValueBold, { color: game.finances.netProfit >= 0 ? C.green : C.red }]}>
            ${game.finances.netProfit.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* History link */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate("HistoryScreen")}
      >
        <Text style={styles.historyBtnText}>VIEW TURN HISTORY</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  finBigRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  finBigCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  finBigLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  finBigGreen: { fontSize: 20, fontWeight: "900", color: C.green, marginTop: 6 },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tblLabel: { fontSize: 13, color: C.textDim },
  tblValue: { fontSize: 13, color: C.textDim },
  tblValueBold: { fontSize: 13, color: C.text, fontWeight: "800" },

  historyBtn: { backgroundColor: C.teal, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  historyBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  // Expense breakdown
  breakdownRow: { marginBottom: 10 },
  breakdownTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  breakdownBarBg: {
    height: 6,
    backgroundColor: C.bg,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 2,
  },
  breakdownBarFill: {
    height: "100%" as any,
    borderRadius: 3,
  },
  breakdownPct: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    color: C.textMuted,
  },

  // Supplier
  supplierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  manageBtn: {
    backgroundColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  manageBtnText: { color: C.teal, fontSize: 12, fontWeight: "700" },
  supplierName: {
    fontSize: 16,
    fontWeight: "900",
    color: C.text,
    marginBottom: 10,
  },
  supplierStatRow: { flexDirection: "row", gap: 8 },
  supplierStat: { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 10, alignItems: "center" },
  supplierStatLabel: { fontSize: 9, color: C.textMuted, fontWeight: "600", letterSpacing: 0.8, marginBottom: 4 },
  supplierStatValue: { fontSize: 16, fontWeight: "900", color: C.text },
  noSupplierText: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },
});
