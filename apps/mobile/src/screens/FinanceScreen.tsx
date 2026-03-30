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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Segment tabs */}
      <View style={styles.segmentRow}>
        <View style={[styles.segmentBtn, styles.segmentActive]}>
          <Text style={styles.segmentTextActive}>P&L</Text>
        </View>
        <View style={styles.segmentBtn}>
          <Text style={styles.segmentText}>Balance</Text>
        </View>
        <View style={styles.segmentBtn}>
          <Text style={styles.segmentText}>Cash Flow</Text>
        </View>
      </View>

      {/* Big numbers */}
      <View style={styles.finBigRow}>
        <View style={styles.finBigCard}>
          <Text style={styles.finBigLabel}>Total Revenue</Text>
          <Text style={styles.finBigGreen}>${game.finances.totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={styles.finBigCard}>
          <Text style={styles.finBigLabel}>Net Profit</Text>
          <Text style={[styles.finBigGreen, game.finances.netProfit < 0 && { color: "#e05c5c" }]}>
            ${game.finances.netProfit.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Detail table */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>INCOME</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Weekly Revenue</Text>
          <Text style={styles.tblValue}>${game.finances.weeklyRevenue.toLocaleString()}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Total Revenue</Text>
          <Text style={styles.tblValueBold}>${game.finances.totalRevenue.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>EXPENSES</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Weekly Expenses</Text>
          <Text style={styles.tblValue}>${game.finances.weeklyExpenses.toLocaleString()}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Total Expenses</Text>
          <Text style={styles.tblValueBold}>${game.finances.totalExpenses.toLocaleString()}</Text>
        </View>
      </View>

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
        <View style={styles.tableRow}>
          <Text style={styles.tblLabel}>Net Profit</Text>
          <Text style={[styles.tblValueBold, { color: game.finances.netProfit >= 0 ? "#5ce0b8" : "#e05c5c" }]}>
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

  segmentRow: { flexDirection: "row", backgroundColor: C.card, borderRadius: 10, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: C.teal },
  segmentText: { color: C.textMuted, fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: "#fff", fontSize: 12, fontWeight: "700" },

  finBigRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  finBigCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  finBigLabel: { fontSize: 10, color: C.textMuted, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  finBigGreen: { fontSize: 20, fontWeight: "900", color: C.green, marginTop: 6 },

  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  tblLabel: { fontSize: 13, color: C.textDim },
  tblValue: { fontSize: 13, color: C.textDim },
  tblValueBold: { fontSize: 13, color: C.text, fontWeight: "800" },

  historyBtn: { backgroundColor: C.teal, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  historyBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
});
