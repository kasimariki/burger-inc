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
import type { StaffStackParamList } from "../navigation/types";
import { C } from "../theme";

type NavProp = NativeStackNavigationProp<StaffStackParamList, "StaffListScreen">;

export default function StaffListScreen() {
  const navigation = useNavigation<NavProp>();
  const { game } = useGameStore();
  const staffList = Object.values(game.staff);
  const stores = Object.values(game.stores);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {staffList.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Staff</Text>
          <Text style={styles.emptyHint}>Hire cooks, cashiers and managers!</Text>
        </View>
      ) : (
        staffList.map(st => {
          const assigned = stores.find(s => s.staffIds.includes(st.id));
          return (
            <View key={st.id} style={styles.staffCard}>
              <View style={styles.staffTop}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>
                    {st.role === "cook" ? "C" : st.role === "cashier" ? "R" : "M"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{st.name}</Text>
                  <Text style={styles.staffRole}>{st.role.toUpperCase()} | Lv.{st.skillLevel}</Text>
                </View>
                <Text style={styles.staffSalary}>${st.salary}/mo</Text>
              </View>
              <View style={styles.staffBars}>
                <View style={styles.staffBarItem}>
                  <Text style={styles.sbLabel}>Satisfaction</Text>
                  <View style={styles.sbTrack}>
                    <View style={[styles.sbFill, { width: `${st.satisfaction}%` as any, backgroundColor: "#5ce0b8" }]} />
                  </View>
                  <Text style={styles.sbVal}>{Math.round(st.satisfaction)}%</Text>
                </View>
                <View style={styles.staffBarItem}>
                  <Text style={styles.sbLabel}>Loyalty</Text>
                  <View style={styles.sbTrack}>
                    <View style={[styles.sbFill, { width: `${st.loyalty}%` as any, backgroundColor: "#5bb8d0" }]} />
                  </View>
                  <Text style={styles.sbVal}>{Math.round(st.loyalty)}%</Text>
                </View>
              </View>
              <Text style={styles.staffAssign}>
                {assigned ? `Assigned: ${assigned.name}` : "Unassigned"}
              </Text>
            </View>
          );
        })
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  emptyBox: { backgroundColor: C.card, borderRadius: 14, padding: 40, alignItems: "center", borderWidth: 1, borderColor: C.border, borderStyle: "dashed" },
  emptyTitle: { color: C.textDim, fontSize: 16, fontWeight: "700" },
  emptyHint: { color: C.textMuted, fontSize: 12, marginTop: 4 },

  staffCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  staffTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  staffAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  staffAvatarText: { color: C.textDim, fontWeight: "800", fontSize: 14 },
  staffName: { color: C.text, fontSize: 14, fontWeight: "800" },
  staffRole: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  staffSalary: { color: C.amber, fontSize: 14, fontWeight: "800" },
  staffBars: { marginTop: 10, gap: 6 },
  staffBarItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  sbLabel: { width: 75, fontSize: 10, color: C.textMuted },
  sbTrack: { flex: 1, height: 5, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden" },
  sbFill: { height: "100%", borderRadius: 3 },
  sbVal: { width: 35, fontSize: 10, color: C.textDim, fontWeight: "700", textAlign: "right" },
  staffAssign: { marginTop: 8, fontSize: 11, color: C.textMuted, fontStyle: "italic" },
});
