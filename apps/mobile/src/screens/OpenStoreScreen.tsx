import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { fetchCityStatus, type City } from "../services/api";
import { C } from "../theme";

const SLOT_ID = 1;

const STORE_TYPES = [
  { key: "food_truck",    label: "Food Truck",    icon: "FT",  capacity: 40,  rent: 800,   desc: "Low cost, mobile" },
  { key: "street",        label: "Street Shop",   icon: "ST",  capacity: 100, rent: 2500,  desc: "Standard storefront" },
  { key: "mall",          label: "Mall Store",    icon: "ML",  capacity: 150, rent: 4000,  desc: "High traffic" },
  { key: "drive_through", label: "Drive-Through", icon: "DT",  capacity: 200, rent: 3500,  desc: "Suburban, car-friendly" },
] as const;

const CITY_TYPE_LABELS: Record<string, string> = {
  downtown: "Downtown",
  suburb: "Suburb",
  tech_hub: "Tech Hub",
  tourist_zone: "Tourist",
  industrial: "Industrial",
  college_town: "College",
};

export default function OpenStoreScreen({ onClose }: { onClose: () => void }) {
  const { openStore, game, userId } = useGameStore();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedType, setSelectedType] = useState(STORE_TYPES[1]); // default: street

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCityStatus(userId, SLOT_ID);
        setCities(data);
        const unlocked = data.find((c) => c.isUnlocked);
        if (unlocked) setSelectedCity(unlocked);
      } catch {
        // フォールバック: デフォルト都市
      }
      setLoading(false);
    })();
  }, []);

  const rentMultiplier = selectedCity?.rentMultiplier ?? 1;
  const adjustedRent = Math.round(selectedType.rent * rentMultiplier);
  const openCost = adjustedRent * 2; // 2ヶ月分
  const canAfford = game.finances.cash >= openCost;

  const handleOpen = () => {
    if (!name.trim()) return Alert.alert("Error", "Enter a store name");
    if (!selectedCity) return Alert.alert("Error", "Select a city");
    if (!canAfford) return Alert.alert("Error", "Insufficient funds");

    try {
      openStore({
        name: name.trim(),
        city: selectedCity.id,
        type: selectedType.key,
        rent: adjustedRent,
        capacity: selectedType.capacity,
      });
      Alert.alert("Store Opened!", `${name} is now open in ${selectedCity.name}`);
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  const unlockedCities = cities.filter((c) => c.isUnlocked);
  const lockedCities = cities.filter((c) => !c.isUnlocked);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Store</Text>
      <View style={styles.cashRow}>
        <Text style={styles.cashLabel}>Cash</Text>
        <Text style={styles.cashValue}>${game.finances.cash.toLocaleString()}</Text>
      </View>

      {/* Store Name */}
      <Text style={styles.sectionLabel}>STORE NAME</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Midvale Central"
        placeholderTextColor={C.textMuted}
      />

      {/* City Selection */}
      <Text style={styles.sectionLabel}>SELECT CITY</Text>
      {unlockedCities.map((city) => {
        const selected = selectedCity?.id === city.id;
        return (
          <TouchableOpacity
            key={city.id}
            style={[styles.cityCard, selected && styles.cityCardSelected]}
            onPress={() => setSelectedCity(city)}
          >
            <View style={styles.cityHeader}>
              <View>
                <Text style={[styles.cityName, selected && { color: C.teal }]}>{city.name}</Text>
                <Text style={styles.cityType}>{CITY_TYPE_LABELS[city.type] ?? city.type}</Text>
              </View>
              <View style={styles.rentBadge}>
                <Text style={styles.rentBadgeText}>×{city.rentMultiplier.toFixed(1)}</Text>
              </View>
            </View>
            {/* Demographics bar */}
            <View style={styles.demoRow}>
              {[
                { key: "thriftyWorker", label: "Budget", color: C.green },
                { key: "qualityHunter", label: "Quality", color: C.amber },
                { key: "trendChaser", label: "Trend", color: C.teal },
                { key: "familyCrew", label: "Family", color: C.accent },
              ].map((seg) => {
                const val = (city.demographics as any)[seg.key] as number;
                return (
                  <View key={seg.key} style={styles.demoItem}>
                    <View style={[styles.demoDot, { backgroundColor: seg.color }]} />
                    <Text style={styles.demoLabel}>{seg.label}</Text>
                    <Text style={[styles.demoVal, { color: seg.color }]}>{Math.round(val * 100)}%</Text>
                  </View>
                );
              })}
            </View>
            {city.notes && <Text style={styles.cityNotes}>{city.notes}</Text>}
          </TouchableOpacity>
        );
      })}

      {/* Locked cities preview */}
      {lockedCities.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>LOCKED</Text>
          {lockedCities.map((city) => (
            <View key={city.id} style={[styles.cityCard, styles.cityLocked]}>
              <View style={styles.cityHeader}>
                <View>
                  <Text style={[styles.cityName, { color: C.textMuted }]}>{city.name}</Text>
                  <Text style={styles.cityType}>{CITY_TYPE_LABELS[city.type] ?? city.type}</Text>
                </View>
              </View>
              {city.unlockProgress && (
                <View style={styles.unlockRow}>
                  {city.unlockProgress.brandScore.required > 0 && (
                    <View style={[styles.unlockItem, city.unlockProgress.brandScore.ok && styles.unlockOk]}>
                      <Text style={styles.unlockText}>
                        Brand {city.unlockProgress.brandScore.current}/{city.unlockProgress.brandScore.required}
                      </Text>
                    </View>
                  )}
                  {city.unlockProgress.storeCount.required > 0 && (
                    <View style={[styles.unlockItem, city.unlockProgress.storeCount.ok && styles.unlockOk]}>
                      <Text style={styles.unlockText}>
                        Stores {city.unlockProgress.storeCount.current}/{city.unlockProgress.storeCount.required}
                      </Text>
                    </View>
                  )}
                  {city.unlockProgress.cash.required > 0 && (
                    <View style={[styles.unlockItem, city.unlockProgress.cash.ok && styles.unlockOk]}>
                      <Text style={styles.unlockText}>
                        Cash ${city.unlockProgress.cash.current.toLocaleString()}/${city.unlockProgress.cash.required.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* Store Type */}
      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>STORE TYPE</Text>
      <View style={styles.typeGrid}>
        {STORE_TYPES.map((st) => {
          const sel = selectedType.key === st.key;
          return (
            <TouchableOpacity
              key={st.key}
              style={[styles.typeCard, sel && styles.typeCardSelected]}
              onPress={() => setSelectedType(st)}
            >
              <Text style={[styles.typeIcon, sel && { color: C.accent }]}>{st.icon}</Text>
              <Text style={[styles.typeLabel, sel && { color: C.text }]}>{st.label}</Text>
              <Text style={styles.typeDesc}>{st.desc}</Text>
              <Text style={styles.typeCap}>Cap: {st.capacity}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cost Summary */}
      <View style={styles.costCard}>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Monthly Rent</Text>
          <Text style={styles.costValue}>${adjustedRent.toLocaleString()}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Opening Cost (2 months)</Text>
          <Text style={[styles.costValue, !canAfford && { color: C.red }]}>${openCost.toLocaleString()}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Capacity</Text>
          <Text style={styles.costValue}>{selectedType.capacity} seats</Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={[styles.openBtn, !canAfford && styles.openBtnDisabled]}
        onPress={handleOpen}
        disabled={!canAfford || !name.trim() || !selectedCity}
      >
        <Text style={styles.openBtnText}>
          {!canAfford ? "INSUFFICIENT FUNDS" : "OPEN STORE"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 14, paddingTop: 50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },

  title: { fontSize: 22, fontWeight: "900", color: C.text, marginBottom: 4 },
  cashRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  cashLabel: { color: C.textMuted, fontSize: 13, fontWeight: "600" },
  cashValue: { color: C.green, fontSize: 15, fontWeight: "800" },

  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },

  input: { backgroundColor: C.card, color: C.text, padding: 14, borderRadius: 10, fontSize: 15, borderWidth: 1, borderColor: C.border, marginBottom: 16 },

  // City cards
  cityCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  cityCardSelected: { borderColor: C.teal, backgroundColor: C.teal + "10" },
  cityLocked: { opacity: 0.5 },
  cityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cityName: { color: C.text, fontSize: 15, fontWeight: "800" },
  cityType: { color: C.textDim, fontSize: 11, marginTop: 2 },
  cityNotes: { color: C.textMuted, fontSize: 10, marginTop: 6, fontStyle: "italic" },
  rentBadge: { backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rentBadgeText: { color: C.amber, fontSize: 12, fontWeight: "800" },

  // Demographics
  demoRow: { flexDirection: "row", marginTop: 10, gap: 4 },
  demoItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 3 },
  demoDot: { width: 6, height: 6, borderRadius: 3 },
  demoLabel: { color: C.textMuted, fontSize: 8, fontWeight: "600" },
  demoVal: { fontSize: 9, fontWeight: "800" },

  // Unlock progress
  unlockRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  unlockItem: { backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: C.red + "40" },
  unlockOk: { borderColor: C.green + "40" },
  unlockText: { color: C.textDim, fontSize: 10, fontWeight: "600" },

  // Store type grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  typeCard: { width: "48%" as any, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  typeCardSelected: { borderColor: C.accent, backgroundColor: C.accent + "10" },
  typeIcon: { fontSize: 18, fontWeight: "900", color: C.textMuted },
  typeLabel: { color: C.textDim, fontSize: 13, fontWeight: "700", marginTop: 4 },
  typeDesc: { color: C.textMuted, fontSize: 10, marginTop: 2 },
  typeCap: { color: C.teal, fontSize: 10, fontWeight: "700", marginTop: 4 },

  // Cost summary
  costCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  costRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  costLabel: { color: C.textDim, fontSize: 13 },
  costValue: { color: C.text, fontSize: 13, fontWeight: "800" },

  // Buttons
  openBtn: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  openBtnDisabled: { backgroundColor: C.border },
  openBtnText: { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 1 },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelText: { color: C.textMuted, fontSize: 14 },
});
