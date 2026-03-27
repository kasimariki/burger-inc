import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useGameStore } from "../store/gameStore";
import type { Ingredient } from "../game/models/types";

type Step = "patty" | "bun" | "toppings" | "sauce" | "confirm";

export default function MenuLabScreen({ onClose }: { onClose: () => void }) {
  const { game, buildBurger } = useGameStore();
  const ingredients = Object.values(game.ingredients);

  const [step, setStep] = useState<Step>("patty");
  const [selectedPatty, setSelectedPatty] = useState<string | null>(null);
  const [selectedBun, setSelectedBun] = useState<string | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedSauce, setSelectedSauce] = useState<string | null>(null);

  const patties = ingredients.filter(i => i.category === "patty");
  const buns = ingredients.filter(i => i.category === "bun");
  const toppings = ingredients.filter(i => i.category === "topping");
  const sauces = ingredients.filter(i => i.category === "sauce");

  const totalCost = useMemo(() => {
    let cost = 0;
    if (selectedPatty) cost += game.ingredients[selectedPatty]?.cost ?? 0;
    if (selectedBun) cost += game.ingredients[selectedBun]?.cost ?? 0;
    selectedToppings.forEach(id => { cost += game.ingredients[id]?.cost ?? 0; });
    if (selectedSauce) cost += game.ingredients[selectedSauce]?.cost ?? 0;
    return Math.round(cost * 100) / 100;
  }, [selectedPatty, selectedBun, selectedToppings, selectedSauce, game.ingredients]);

  const toggleTopping = (id: string) => {
    setSelectedToppings(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBuild = () => {
    if (!selectedPatty || !selectedBun || !selectedSauce) {
      return Alert.alert("エラー", "パティ・バンズ・ソースを選んでください");
    }
    const pattyName = game.ingredients[selectedPatty]?.name ?? "";
    const bunName = game.ingredients[selectedBun]?.name ?? "";
    const name = `${pattyName.replace("パティ", "")}${bunName.replace("バンズ", "")}バーガー`;
    const suggestedPrice = Math.ceil(totalCost * 3);

    try {
      buildBurger({
        name,
        pattyId: selectedPatty,
        bunId: selectedBun,
        toppingIds: selectedToppings,
        sauceId: selectedSauce,
        price: suggestedPrice,
      });
      Alert.alert("開発成功！", `「${name}」を開発しました！\n販売価格: $${suggestedPrice}`);
      onClose();
    } catch (e: any) {
      Alert.alert("エラー", e.message);
    }
  };

  const renderIngredientList = (
    items: Ingredient[],
    selected: string | string[] | null,
    onSelect: (id: string) => void,
    multi = false
  ) => (
    <View style={styles.grid}>
      {items.map(item => {
        const isSelected = multi
          ? (selected as string[]).includes(item.id)
          : selected === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.ingredientCard, isSelected && styles.ingredientSelected]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={styles.ingredientName}>{item.name}</Text>
            <Text style={styles.ingredientDetail}>
              原価: ${item.cost} | 品質: {"★".repeat(item.quality)}
            </Text>
            <Text style={styles.ingredientDetail}>味+{item.tasteBonus}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const steps: { key: Step; label: string }[] = [
    { key: "patty", label: "パティ" },
    { key: "bun", label: "バンズ" },
    { key: "toppings", label: "トッピング" },
    { key: "sauce", label: "ソース" },
    { key: "confirm", label: "確認" },
  ];
  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>メニュー開発ラボ</Text>
      <Text style={styles.cash}>所持金: ${game.finances.cash.toLocaleString()}</Text>

      {/* ステップインジケーター */}
      <View style={styles.stepRow}>
        {steps.map((s, i) => (
          <View key={s.key} style={[styles.stepDot, i <= currentIdx && styles.stepDotActive]}>
            <Text style={styles.stepLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 原価表示 */}
      <Text style={styles.costLabel}>原価合計: ${totalCost}</Text>

      {step === "patty" && (
        <>
          <Text style={styles.sectionTitle}>パティを選んでください</Text>
          {renderIngredientList(patties, selectedPatty, setSelectedPatty)}
          <TouchableOpacity
            style={[styles.nextBtn, !selectedPatty && styles.btnDisabled]}
            onPress={() => selectedPatty && setStep("bun")}
          >
            <Text style={styles.btnText}>次へ: バンズ選択</Text>
          </TouchableOpacity>
        </>
      )}

      {step === "bun" && (
        <>
          <Text style={styles.sectionTitle}>バンズを選んでください</Text>
          {renderIngredientList(buns, selectedBun, setSelectedBun)}
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep("patty")}>
              <Text style={styles.btnText}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedBun && styles.btnDisabled]}
              onPress={() => selectedBun && setStep("toppings")}
            >
              <Text style={styles.btnText}>次へ</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === "toppings" && (
        <>
          <Text style={styles.sectionTitle}>トッピング（複数選択可）</Text>
          {renderIngredientList(toppings, selectedToppings, toggleTopping, true)}
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep("bun")}>
              <Text style={styles.btnText}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep("sauce")}>
              <Text style={styles.btnText}>次へ</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === "sauce" && (
        <>
          <Text style={styles.sectionTitle}>ソースを選んでください</Text>
          {renderIngredientList(sauces, selectedSauce, setSelectedSauce)}
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep("toppings")}>
              <Text style={styles.btnText}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedSauce && styles.btnDisabled]}
              onPress={() => selectedSauce && setStep("confirm")}
            >
              <Text style={styles.btnText}>確認へ</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === "confirm" && (
        <>
          <Text style={styles.sectionTitle}>レシピ確認</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLine}>パティ: {selectedPatty && game.ingredients[selectedPatty]?.name}</Text>
            <Text style={styles.summaryLine}>バンズ: {selectedBun && game.ingredients[selectedBun]?.name}</Text>
            <Text style={styles.summaryLine}>トッピング: {selectedToppings.map(id => game.ingredients[id]?.name).join(", ") || "なし"}</Text>
            <Text style={styles.summaryLine}>ソース: {selectedSauce && game.ingredients[selectedSauce]?.name}</Text>
            <Text style={styles.summaryCost}>原価: ${totalCost} → 販売価格: ${Math.ceil(totalCost * 3)}</Text>
          </View>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep("sauce")}>
              <Text style={styles.btnText}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buildBtn} onPress={handleBuild}>
              <Text style={styles.btnText}>開発する！</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
        <Text style={styles.cancelText}>キャンセル</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  cash: { fontSize: 14, color: "#4ecca3", marginBottom: 12 },
  costLabel: { fontSize: 14, color: "#e94560", marginBottom: 12 },
  stepRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  stepDot: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, backgroundColor: "#16213e" },
  stepDotActive: { backgroundColor: "#e94560" },
  stepLabel: { color: "#fff", fontSize: 11 },
  sectionTitle: { fontSize: 16, color: "#fff", fontWeight: "bold", marginBottom: 12 },
  grid: { gap: 8, marginBottom: 16 },
  ingredientCard: { padding: 12, backgroundColor: "#16213e", borderRadius: 10, borderWidth: 2, borderColor: "transparent" },
  ingredientSelected: { borderColor: "#e94560", backgroundColor: "#1f2b47" },
  ingredientName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  ingredientDetail: { color: "#888", fontSize: 12, marginTop: 2 },
  navRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  nextBtn: { flex: 1, padding: 16, backgroundColor: "#e94560", borderRadius: 12, alignItems: "center", marginTop: 8 },
  backBtn: { flex: 1, padding: 16, backgroundColor: "#0f3460", borderRadius: 12, alignItems: "center" },
  buildBtn: { flex: 1, padding: 16, backgroundColor: "#4ecca3", borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  summaryCard: { padding: 16, backgroundColor: "#16213e", borderRadius: 12, marginBottom: 16 },
  summaryLine: { color: "#fff", fontSize: 14, marginBottom: 4 },
  summaryCost: { color: "#4ecca3", fontSize: 16, fontWeight: "bold", marginTop: 8 },
  cancelBtn: { marginTop: 12, padding: 14, alignItems: "center", marginBottom: 40 },
  cancelText: { color: "#888", fontSize: 16 },
});
