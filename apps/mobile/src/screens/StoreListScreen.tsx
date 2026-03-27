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
import type { StoresStackParamList } from "../navigation/types";
import { C } from "../theme";

type NavProp = NativeStackNavigationProp<StoresStackParamList, "StoreListScreen">;

export default function StoreListScreen() {
  const navigation = useNavigation<NavProp>();
  const { game } = useGameStore();
  const stores = Object.values(game.stores);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity
        style={styles.addStoreBtn}
        onPress={() => navigation.navigate("StoreDetailScreen", { storeId: "__new__" })}
      >
        <Text style={styles.addStorePlus}>+</Text>
        <Text style={styles.addStoreText}>Open New Store</Text>
      </TouchableOpacity>

      {stores.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Stores Yet</Text>
          <Text style={styles.emptyHint}>Tap above to open your first burger shop!</Text>
        </View>
      ) : (
        stores.map(s => (
          <TouchableOpacity
            key={s.id}
            style={styles.storeCard}
            onPress={() => navigation.navigate("StoreDetailScreen", { storeId: s.id })}
            activeOpacity={0.8}
          >
            <View style={styles.storeTop}>
              <View>
                <Text style={styles.storeName}>{s.name}</Text>
                <Text style={styles.storeAddr}>{s.city} | {s.type}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: s.isOpen ? "#14352a" : "#351a1a" }]}>
                <Text style={[styles.statusText, { color: s.isOpen ? "#5ce0b8" : "#e05c5c" }]}>
                  {s.isOpen ? "OPEN" : "CLOSED"}
                </Text>
              </View>
            </View>
            <View style={styles.reviewRow}>
              <View>
                <Text style={styles.reviewScore}>{(s.reputation / 20).toFixed(1)}</Text>
                <Text style={styles.reviewStars}>{"*".repeat(Math.round(s.reputation / 20))}</Text>
              </View>
              <View style={styles.reviewDetails}>
                <View style={styles.reviewItem}><Text style={styles.rvLabel}>Rent</Text><Text style={styles.rvValue}>${s.rent.toLocaleString()}/mo</Text></View>
                <View style={styles.reviewItem}><Text style={styles.rvLabel}>Capacity</Text><Text style={styles.rvValue}>{s.capacity}/day</Text></View>
                <View style={styles.reviewItem}><Text style={styles.rvLabel}>Staff</Text><Text style={styles.rvValue}>{s.staffIds.length}</Text></View>
                <View style={styles.reviewItem}><Text style={styles.rvLabel}>Menu</Text><Text style={styles.rvValue}>{s.menuItemIds.length}</Text></View>
              </View>
            </View>
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to manage</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  addStoreBtn: { backgroundColor: C.accent, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  addStorePlus: { color: "#fff", fontSize: 20, fontWeight: "900" },
  addStoreText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  emptyBox: { backgroundColor: C.card, borderRadius: 14, padding: 40, alignItems: "center", borderWidth: 1, borderColor: C.border, borderStyle: "dashed" },
  emptyTitle: { color: C.textDim, fontSize: 16, fontWeight: "700" },
  emptyHint: { color: C.textMuted, fontSize: 12, marginTop: 4 },

  storeCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  storeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  storeName: { color: C.text, fontSize: 16, fontWeight: "800" },
  storeAddr: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  reviewRow: { flexDirection: "row", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 16 },
  reviewScore: { fontSize: 28, fontWeight: "900", color: C.text },
  reviewStars: { color: C.amber, fontSize: 16 },
  reviewDetails: { flex: 1, gap: 4 },
  reviewItem: { flexDirection: "row", justifyContent: "space-between" },
  rvLabel: { fontSize: 12, color: C.textMuted },
  rvValue: { fontSize: 12, color: C.textDim, fontWeight: "700" },
  tapHint: { marginTop: 8, alignItems: "flex-end" },
  tapHintText: { fontSize: 10, color: C.textMuted, fontStyle: "italic" },
});
