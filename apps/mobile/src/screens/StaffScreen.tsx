import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useGameStore } from "../store/gameStore";
import type { StaffRole } from "@burger-inc/shared";

export default function StaffScreen({ onClose }: { onClose: () => void }) {
  const { game, hireStaff, assignStaffToStore } = useGameStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("cook");
  const [salary, setSalary] = useState("2000");

  const staffList = Object.values(game.staff);
  const stores = Object.values(game.stores);

  const roles: { key: StaffRole; label: string; icon: string }[] = [
    { key: "cook", label: "調理師", icon: "👨‍🍳" },
    { key: "cashier", label: "接客", icon: "🧑‍💼" },
    { key: "manager", label: "マネージャー", icon: "👔" },
  ];

  const handleHire = () => {
    if (!name.trim()) return Alert.alert("エラー", "名前を入力してください");
    const sal = Number(salary);
    if (sal < 1800 || sal > 4500) return Alert.alert("エラー", "給与は$1,800〜$4,500の範囲で設定してください");

    const hiringCost = sal * 0.5;
    if (game.finances.cash < hiringCost) {
      return Alert.alert("エラー", `資金不足です (採用コスト: $${hiringCost})`);
    }

    try {
      const skillLevel = Math.floor(Math.random() * 4) + 2; // 2-5のランダム
      hireStaff({ name, role, skillLevel, salary: sal });
      Alert.alert("採用成功！", `${name}を${roles.find(r => r.key === role)?.label}として採用しました`);
      setName("");
    } catch (e: any) {
      Alert.alert("エラー", e.message);
    }
  };

  const handleAssign = (staffId: string, storeId: string) => {
    try {
      assignStaffToStore(staffId, storeId);
      Alert.alert("配置完了", "スタッフを店舗に配置しました");
    } catch (e: any) {
      Alert.alert("エラー", e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>人事管理</Text>
      <Text style={styles.cash}>所持金: ${game.finances.cash.toLocaleString()}</Text>

      {/* 採用フォーム */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>新規採用</Text>

        <Text style={styles.label}>名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="スタッフ名"
          placeholderTextColor="#555"
        />

        <Text style={styles.label}>職種</Text>
        <View style={styles.roleRow}>
          {roles.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
              onPress={() => setRole(r.key)}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>月給 ($1,800〜$4,500)</Text>
        <TextInput
          style={styles.input}
          value={salary}
          onChangeText={setSalary}
          keyboardType="numeric"
          placeholderTextColor="#555"
        />
        <Text style={styles.sub}>採用コスト: ${(Number(salary) * 0.5).toLocaleString()}</Text>

        <TouchableOpacity style={styles.hireBtn} onPress={handleHire}>
          <Text style={styles.btnText}>採用する</Text>
        </TouchableOpacity>
      </View>

      {/* スタッフ一覧 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>スタッフ一覧 ({staffList.length}名)</Text>
        {staffList.length === 0 ? (
          <Text style={styles.sub}>まだスタッフがいません</Text>
        ) : (
          staffList.map(staff => {
            const assignedStore = stores.find(s => s.staffIds.includes(staff.id));
            return (
              <View key={staff.id} style={styles.staffItem}>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {roles.find(r => r.key === staff.role)?.icon} {staff.name}
                  </Text>
                  <Text style={styles.sub}>
                    Lv.{staff.skillLevel} | ${staff.salary}/月 | 満足度: {Math.round(staff.satisfaction)}%
                  </Text>
                  <Text style={styles.sub}>
                    配属: {assignedStore?.name ?? "未配属"}
                  </Text>
                </View>
                {!assignedStore && stores.length > 0 && (
                  <View style={styles.assignBtns}>
                    {stores.map(store => (
                      <TouchableOpacity
                        key={store.id}
                        style={styles.assignBtn}
                        onPress={() => handleAssign(staff.id, store.id)}
                      >
                        <Text style={styles.assignText}>{store.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
        <Text style={styles.cancelText}>閉じる</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  cash: { fontSize: 14, color: "#4ecca3", marginBottom: 16 },
  card: { backgroundColor: "#16213e", borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#e94560", marginBottom: 12 },
  label: { fontSize: 13, color: "#aaa", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#0f3460", color: "#fff", padding: 14, borderRadius: 10, fontSize: 16 },
  sub: { fontSize: 12, color: "#888", marginTop: 4 },
  roleRow: { flexDirection: "row", gap: 8 },
  roleBtn: { flex: 1, padding: 12, backgroundColor: "#0f3460", borderRadius: 10, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  roleBtnActive: { borderColor: "#e94560" },
  roleIcon: { fontSize: 24 },
  roleLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  roleLabelActive: { color: "#fff", fontWeight: "bold" },
  hireBtn: { marginTop: 16, padding: 16, backgroundColor: "#4ecca3", borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  staffItem: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#0f3460" },
  staffInfo: { marginBottom: 6 },
  staffName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  assignBtns: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  assignBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#0f3460", borderRadius: 8 },
  assignText: { color: "#4ecca3", fontSize: 12 },
  cancelBtn: { marginTop: 12, padding: 14, alignItems: "center", marginBottom: 40 },
  cancelText: { color: "#888", fontSize: 16 },
});
