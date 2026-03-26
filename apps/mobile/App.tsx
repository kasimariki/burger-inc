import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useGameStore } from "./src/store/gameStore";

export default function App() {
  const { game, processTurn } = useGameStore();
  const stores = Object.values(game.stores);

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />

      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>🍔 Burger Inc.</Text>
        <Text style={styles.turn}>Week {game.turn}</Text>
      </View>

      {/* 財務サマリー */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>財務状況</Text>
        <Text style={styles.money}>${game.finances.cash.toLocaleString()}</Text>
        <Text style={styles.sub}>総売上: ${game.finances.totalRevenue.toLocaleString()}</Text>
        <Text style={styles.sub}>総支出: ${game.finances.totalExpenses.toLocaleString()}</Text>
      </View>

      {/* 経済状況 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>マクロ経済</Text>
        <Text style={styles.phase}>{game.economy.phase.toUpperCase()}</Text>
        <Text style={styles.sub}>消費者信頼度: {Math.round(game.economy.consumerConfidence)}</Text>
        <Text style={styles.sub}>金利: {(game.economy.interestRate * 100).toFixed(1)}%</Text>
        <Text style={styles.sub}>インフレ: {(game.economy.inflationRate * 100).toFixed(1)}%</Text>
      </View>

      {/* 店舗一覧 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>店舗 ({stores.length})</Text>
        {stores.length === 0 ? (
          <Text style={styles.sub}>まだ店舗がありません</Text>
        ) : (
          stores.map((store) => (
            <View key={store.id} style={styles.storeItem}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.sub}>{store.city} | スタッフ: {store.staffIds.length}</Text>
            </View>
          ))
        )}
      </View>

      {/* ターン進行ボタン */}
      <TouchableOpacity style={styles.button} onPress={processTurn}>
        <Text style={styles.buttonText}>次のターンへ →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { padding: 24, paddingTop: 60, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  turn: { fontSize: 14, color: "#aaa", marginTop: 4 },
  card: { margin: 12, padding: 16, backgroundColor: "#16213e", borderRadius: 12 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#e94560", marginBottom: 8 },
  money: { fontSize: 32, fontWeight: "bold", color: "#4ecca3" },
  phase: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#888", marginTop: 2 },
  storeItem: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#0f3460" },
  storeName: { fontSize: 15, color: "#fff", fontWeight: "600" },
  button: { margin: 16, padding: 18, backgroundColor: "#e94560", borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
