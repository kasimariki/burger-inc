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
import type { MenuStackParamList } from "../navigation/types";
import { C } from "../theme";

type NavProp = NativeStackNavigationProp<MenuStackParamList, "MenuListScreen">;

export default function MenuListScreen() {
  const { game } = useGameStore();
  const menus = Object.values(game.menu);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {menus.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Menu Items</Text>
          <Text style={styles.emptyHint}>Create your first burger in the Menu Lab!</Text>
        </View>
      ) : (
        menus.map(m => (
          <View key={m.id} style={styles.menuCard}>
            <View style={styles.menuTop}>
              <Text style={styles.menuName}>{m.name}</Text>
              <Text style={styles.menuPrice}>${m.price}</Text>
            </View>
            <View style={styles.menuStats}>
              <View style={styles.menuStat}>
                <Text style={styles.msLabel}>Taste</Text>
                <View style={styles.msBarBg}>
                  <View style={[styles.msFill, { width: `${m.tasteScore}%` as any, backgroundColor: "#e8a838" }]} />
                </View>
                <Text style={styles.msVal}>{m.tasteScore}</Text>
              </View>
              <View style={styles.menuStat}>
                <Text style={styles.msLabel}>Popular</Text>
                <View style={styles.msBarBg}>
                  <View style={[styles.msFill, { width: `${m.popularity}%` as any, backgroundColor: "#5ce0b8" }]} />
                </View>
                <Text style={styles.msVal}>{m.popularity}</Text>
              </View>
            </View>
            <View style={styles.menuMeta}>
              <Text style={styles.metaText}>
                Cost: ${m.cost} | Margin: {Math.round(((m.price - m.cost) / m.price) * 100)}% | {m.cookTime}min
              </Text>
            </View>
          </View>
        ))
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

  menuCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  menuTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  menuName: { color: C.text, fontSize: 15, fontWeight: "800" },
  menuPrice: { color: C.green, fontSize: 18, fontWeight: "900" },
  menuStats: { marginTop: 12, gap: 8 },
  menuStat: { flexDirection: "row", alignItems: "center", gap: 8 },
  msLabel: { width: 55, fontSize: 11, color: C.textMuted },
  msBarBg: { flex: 1, height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden" },
  msFill: { height: "100%", borderRadius: 3 },
  msVal: { width: 30, fontSize: 11, color: C.textDim, fontWeight: "700", textAlign: "right" },
  menuMeta: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  metaText: { fontSize: 11, color: C.textMuted },
});
