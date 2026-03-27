import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useGameStore } from "../store/gameStore";

export default function OpenStoreScreen({ onClose }: { onClose: () => void }) {
  const { openStore, game } = useGameStore();
  const [name, setName] = useState("");
  const [city, setCity] = useState("東京");
  const [rent, setRent] = useState("4000");
  const [capacity, setCapacity] = useState("200");

  const cities = ["東京", "大阪", "名古屋", "福岡", "札幌", "ニューヨーク", "ロンドン", "バンコク"];
  const openCost = Number(rent) * 3;

  const handleOpen = () => {
    if (!name.trim()) return Alert.alert("エラー", "店舗名を入力してください");
    if (game.finances.cash < openCost) {
      return Alert.alert("エラー", "資金不足です");
    }
    try {
      openStore({
        name,
        city,
        rent: Number(rent),
        capacity: Number(capacity),
      });
      Alert.alert("出店成功！", `${city}に${name}をオープンしました`);
      onClose();
    } catch (e: any) {
      Alert.alert("エラー", e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏪 新規出店</Text>
      <Text style={styles.cash}>所持金: ${game.finances.cash.toLocaleString()}</Text>
      <Text style={styles.cost}>出店コスト: ${openCost.toLocaleString()}</Text>

      <Text style={styles.label}>店舗名</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="例: 渋谷1号店"
        placeholderTextColor="#555"
      />

      <Text style={styles.label}>都市</Text>
      <View style={styles.cityGrid}>
        {cities.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.cityBtn, city === c && styles.cityBtnActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[styles.cityText, city === c && styles.cityTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>月額家賃 ($)</Text>
      <TextInput
        style={styles.input}
        value={rent}
        onChangeText={setRent}
        keyboardType="numeric"
        placeholderTextColor="#555"
      />

      <Text style={styles.label}>最大客数/日</Text>
      <TextInput
        style={styles.input}
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
        placeholderTextColor="#555"
      />

      <TouchableOpacity style={styles.button} onPress={handleOpen}>
        <Text style={styles.buttonText}>出店する</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
        <Text style={styles.cancelText}>キャンセル</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  cash: { fontSize: 14, color: "#4ecca3", marginBottom: 4 },
  cost: { fontSize: 14, color: "#e94560", marginBottom: 24 },
  label: { fontSize: 13, color: "#aaa", marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: "#16213e", color: "#fff", padding: 14, borderRadius: 10, fontSize: 16 },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "#16213e", borderRadius: 8 },
  cityBtnActive: { backgroundColor: "#e94560" },
  cityText: { color: "#888", fontSize: 13 },
  cityTextActive: { color: "#fff", fontWeight: "bold" },
  button: { marginTop: 32, padding: 18, backgroundColor: "#e94560", borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cancelBtn: { marginTop: 12, padding: 14, alignItems: "center" },
  cancelText: { color: "#888", fontSize: 16 },
});
