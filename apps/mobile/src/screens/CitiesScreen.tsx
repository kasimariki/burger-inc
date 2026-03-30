import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import type { CityStatus, CityType } from "../game/models/types";
import type { StoresStackParamList } from "../navigation/types";
import { C } from "../theme";

type NavProp = NativeStackNavigationProp<StoresStackParamList, "CitiesScreen">;

// ---- 都市タイプのスタイル設定 ----

const CITY_TYPE_META: Record<CityType, { label: string; color: string; bg: string }> = {
  downtown:      { label: "DOWNTOWN",     color: "#e05c5c", bg: "#351a1a" },
  suburb:        { label: "SUBURB",       color: "#5ce0b8", bg: "#14352a" },
  tech_hub:      { label: "TECH HUB",     color: "#5bb8d0", bg: "#14303a" },
  tourist_zone:  { label: "TOURIST",      color: "#e8a838", bg: "#352a14" },
  industrial:    { label: "INDUSTRIAL",   color: "#9b9b9b", bg: "#1a1a1a" },
  college_town:  { label: "COLLEGE",      color: "#8e44ad", bg: "#1e1228" },
};

// ---- デモグラフィクスバー ----

function DemographicBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={demoStyles.row}>
      <Text style={demoStyles.label}>{label}</Text>
      <View style={demoStyles.barBg}>
        <View
          style={[
            demoStyles.barFill,
            { width: `${Math.max(0, Math.min(100, value))}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[demoStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const demoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5, gap: 6 },
  label: { width: 52, fontSize: 10, color: C.textMuted, fontWeight: "600" },
  barBg: {
    flex: 1,
    height: 5,
    backgroundColor: C.bg,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  value: { width: 26, fontSize: 10, fontWeight: "800", textAlign: "right" },
});

// ---- 解禁進捗バー ----

function UnlockProgressBar({
  label,
  current,
  required,
  ok,
}: {
  label: string;
  current: number;
  required: number;
  ok: boolean;
}) {
  const pct = Math.min(100, (current / required) * 100);
  return (
    <View style={progressStyles.row}>
      <Text style={progressStyles.label}>{label}</Text>
      <View style={progressStyles.barBg}>
        <View
          style={[
            progressStyles.barFill,
            { width: `${pct}%` as any, backgroundColor: ok ? C.green : C.amber },
          ]}
        />
      </View>
      <Text style={[progressStyles.status, { color: ok ? C.green : C.textMuted }]}>
        {ok ? "✓" : `${current}/${required}`}
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },
  label: { width: 60, fontSize: 10, color: C.textMuted, fontWeight: "600" },
  barBg: {
    flex: 1,
    height: 5,
    backgroundColor: C.bg,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  status: { width: 44, fontSize: 10, fontWeight: "800", textAlign: "right" },
});

// ---- 都市カード ----

function CityCard({
  city,
  onOpenStore,
  onUnlock,
  isUnlocking,
}: {
  city: CityStatus;
  onOpenStore: () => void;
  onUnlock: () => void;
  isUnlocking: boolean;
}) {
  const typeMeta = CITY_TYPE_META[city.type] ?? CITY_TYPE_META.downtown;

  return (
    <View style={[
      styles.card,
      city.isUnlocked && styles.cardUnlocked,
      !city.isUnlocked && !city.canUnlock && styles.cardLocked,
    ]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeMeta.bg, borderColor: typeMeta.color + "50" }]}>
              <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
            </View>
            {city.hasSeasonal && (
              <View style={styles.seasonalBadge}>
                <Text style={styles.seasonalText}>季節変動</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cityName, !city.isUnlocked && { color: C.textMuted }]}>
            {city.name}
          </Text>
        </View>

        {/* Status badge */}
        {city.isUnlocked ? (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedBadgeText}>OPEN</Text>
          </View>
        ) : city.canUnlock ? (
          <View style={styles.canUnlockBadge}>
            <Text style={styles.canUnlockBadgeText}>READY</Text>
          </View>
        ) : (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>LOCKED</Text>
          </View>
        )}
      </View>

      {/* Rent multiplier */}
      <View style={styles.rentRow}>
        <Text style={styles.rentLabel}>賃料倍率</Text>
        <Text style={[styles.rentValue, {
          color: city.rentMultiplier > 1.2 ? C.red : city.rentMultiplier < 0.9 ? C.green : C.textDim
        }]}>
          ×{city.rentMultiplier.toFixed(1)}
        </Text>
        {city.notes && (
          <Text style={styles.notes} numberOfLines={1}>{city.notes}</Text>
        )}
      </View>

      {/* Demographics */}
      <Text style={styles.demoTitle}>顧客セグメント</Text>
      <DemographicBar label="Thrifty"  value={city.demographics.thriftyWorker} color="#5ce0b8" />
      <DemographicBar label="Quality"  value={city.demographics.qualityHunter} color="#5bb8d0" />
      <DemographicBar label="Trend"    value={city.demographics.trendChaser}   color="#e8a838" />
      <DemographicBar label="Family"   value={city.demographics.familyCrew}    color="#8e44ad" />

      {/* Unlock progress (locked only) */}
      {!city.isUnlocked && city.unlockProgress && (
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>解禁条件</Text>
          <UnlockProgressBar
            label="Brand"
            current={city.unlockProgress.brandScore.current}
            required={city.unlockProgress.brandScore.required}
            ok={city.unlockProgress.brandScore.ok}
          />
          <UnlockProgressBar
            label="Stores"
            current={city.unlockProgress.storeCount.current}
            required={city.unlockProgress.storeCount.required}
            ok={city.unlockProgress.storeCount.ok}
          />
          <UnlockProgressBar
            label="Cash"
            current={city.unlockProgress.cash.current}
            required={city.unlockProgress.cash.required}
            ok={city.unlockProgress.cash.ok}
          />
        </View>
      )}

      {/* Action button */}
      {city.isUnlocked ? (
        <TouchableOpacity style={styles.openBtn} onPress={onOpenStore} activeOpacity={0.8}>
          <Text style={styles.openBtnText}>+ 出店する</Text>
        </TouchableOpacity>
      ) : city.canUnlock ? (
        <TouchableOpacity
          style={[styles.unlockBtn, isUnlocking && { opacity: 0.6 }]}
          onPress={onUnlock}
          disabled={isUnlocking}
          activeOpacity={0.8}
        >
          <Text style={styles.unlockBtnText}>{isUnlocking ? "解禁中..." : "今すぐ解禁"}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ---- メインスクリーン ----

export default function CitiesScreen() {
  const navigation = useNavigation<NavProp>();
  const { cityStatuses, refreshCityStatus, checkAndUnlockCities } = useGameStore();
  const [loading, setLoading] = useState(cityStatuses.length === 0);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => {
    if (cityStatuses.length === 0) {
      refreshCityStatus().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleUnlock = async (city: CityStatus) => {
    setUnlockingId(city.id);
    const newlyUnlocked = await checkAndUnlockCities();
    setUnlockingId(null);
    if (newlyUnlocked.includes(city.id)) {
      Alert.alert("解禁完了！", `${city.name} への出店が可能になりました。`);
    } else {
      Alert.alert("解禁できません", "条件を確認してください。");
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>都市一覧</Text>
      <Text style={styles.pageSubtitle}>
        出店可能な都市を確認・解禁できます。各都市の顧客層に合わせてメニューを最適化しましょう。
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.teal} size="large" />
          <Text style={styles.loadingText}>都市情報を読み込み中...</Text>
        </View>
      ) : cityStatuses.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>都市情報を取得できませんでした</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setLoading(true); refreshCityStatus().finally(() => setLoading(false)); }}
          >
            <Text style={styles.retryBtnText}>再試行</Text>
          </TouchableOpacity>
        </View>
      ) : (
        cityStatuses.map(city => (
          <CityCard
            key={city.id}
            city={city}
            isUnlocking={unlockingId === city.id}
            onOpenStore={() => navigation.navigate("StoreDetailScreen", { storeId: "__new__" })}
            onUnlock={() => handleUnlock(city)}
          />
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ---- スタイル ----

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  pageTitle: { fontSize: 22, fontWeight: "900", color: C.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: C.textMuted, lineHeight: 18, marginBottom: 16 },

  loadingBox: { paddingVertical: 48, alignItems: "center", gap: 12 },
  loadingText: { color: C.textMuted, fontSize: 13 },

  emptyBox: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  emptyText: { color: C.textMuted, fontSize: 13 },
  retryBtn: { backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryBtnText: { color: C.textDim, fontSize: 13, fontWeight: "700" },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardUnlocked: { borderColor: "#5ce0b840" },
  cardLocked: { opacity: 0.75 },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  seasonalBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "#14303a",
    borderWidth: 1,
    borderColor: "#5bb8d040",
  },
  seasonalText: { fontSize: 9, fontWeight: "700", color: "#5bb8d0" },
  cityName: { fontSize: 20, fontWeight: "900", color: C.text },

  // Status badges
  unlockedBadge: {
    backgroundColor: "#14352a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#5ce0b840",
  },
  unlockedBadgeText: { fontSize: 10, fontWeight: "800", color: C.green },
  canUnlockBadge: {
    backgroundColor: "#352a14",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e8a83840",
  },
  canUnlockBadgeText: { fontSize: 10, fontWeight: "800", color: C.amber },
  lockedBadge: {
    backgroundColor: C.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  lockedBadgeText: { fontSize: 10, fontWeight: "800", color: C.textMuted },

  // Rent
  rentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rentLabel: { fontSize: 11, color: C.textMuted, fontWeight: "600" },
  rentValue: { fontSize: 14, fontWeight: "900" },
  notes: { flex: 1, fontSize: 10, color: C.textMuted, fontStyle: "italic" },

  // Demographics
  demoTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  // Unlock progress
  progressSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  progressTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  // Action buttons
  openBtn: {
    marginTop: 12,
    backgroundColor: C.teal,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  openBtnText: { color: "#fff", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  unlockBtn: {
    marginTop: 12,
    backgroundColor: C.amber,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  unlockBtnText: { color: "#000", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
});
