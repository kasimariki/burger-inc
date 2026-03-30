import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { fetchSuppliers, signSupplierContract } from "../services/api";
import type { ActiveSupplier } from "@burger-inc/shared";
import { C } from "../theme";

const USER_ID = "user-001";
const SLOT_ID = "1";

function costLabel(multiplier: number): string {
  const delta = Math.round((multiplier - 1) * 100);
  return delta === 0 ? "±0%" : delta > 0 ? `+${delta}%` : `${delta}%`;
}

function costColor(multiplier: number): string {
  if (multiplier < 1) return C.green;
  if (multiplier > 1) return C.amber;
  return C.textDim;
}

function StatBar({
  label,
  fillPct,
  valueLabel,
  color,
}: {
  label: string;
  fillPct: number;
  valueLabel: string;
  color: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarBg}>
        <View
          style={[
            styles.statBarFill,
            { width: `${Math.max(0, Math.min(100, fillPct))}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.statValue, { color }]}>{valueLabel}</Text>
    </View>
  );
}

export default function SupplierScreen() {
  const { game, contractSupplier } = useGameStore();
  const [suppliers, setSuppliers] = useState<ActiveSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [contracting, setContracting] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers().then((data) => {
      if (Array.isArray(data)) setSuppliers(data);
      setLoading(false);
    });
  }, []);

  const handleContract = async (supplier: ActiveSupplier) => {
    if (game.activeSupplier?.id === supplier.id) return;
    setContracting(supplier.id);
    const result = await signSupplierContract(USER_ID, SLOT_ID, supplier.id);
    if (result !== null) {
      contractSupplier(supplier);
      Alert.alert("契約完了", `${supplier.name} との契約が完了しました。`);
    } else {
      Alert.alert("エラー", "契約に失敗しました。再度お試しください。");
    }
    setContracting(null);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* 現在のサプライヤー */}
      {game.activeSupplier ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerLabel}>CURRENT SUPPLIER</Text>
          <Text style={styles.activeBannerName}>{game.activeSupplier.name}</Text>
          <Text style={styles.activeBannerSub}>
            コスト {costLabel(game.activeSupplier.costMultiplier)} ／
            品質 {game.activeSupplier.qualityBonus >= 0 ? `+${game.activeSupplier.qualityBonus}` : game.activeSupplier.qualityBonus}pts
          </Text>
        </View>
      ) : (
        <View style={[styles.activeBanner, styles.activeBannerNone]}>
          <Text style={[styles.activeBannerLabel, { color: C.amber }]}>NO SUPPLIER</Text>
          <Text style={[styles.activeBannerName, { color: C.amber }]}>デフォルト食材を使用中</Text>
          <Text style={[styles.activeBannerSub, { color: C.textMuted }]}>
            サプライヤーと契約するとコスト・品質が変わります
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.teal} size="large" />
          <Text style={styles.loadingText}>サプライヤーを読み込み中...</Text>
        </View>
      ) : suppliers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>サプライヤー情報を取得できませんでした</Text>
        </View>
      ) : (
        suppliers.map((supplier) => {
          const isActive = game.activeSupplier?.id === supplier.id;
          const isContracting = contracting === supplier.id;
          const reliabilityColor =
            supplier.reliability >= 80 ? C.green
            : supplier.reliability >= 60 ? C.amber
            : C.red;
          const qualityPct = Math.max(0, Math.min(100, 50 + supplier.qualityBonus * 2.5));
          // costMultiplier 0.7〜1.3 → バー幅 0〜100%（1.0 = 50%）
          const costPct = Math.max(0, Math.min(100, supplier.costMultiplier * 70));

          return (
            <View
              key={supplier.id}
              style={[styles.card, isActive && styles.cardActive]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplierName}>{supplier.name}</Text>
                  <Text style={styles.supplierDesc} numberOfLines={2}>
                    {supplier.description}
                  </Text>
                </View>
                {isActive && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>CONTRACTED</Text>
                  </View>
                )}
              </View>

              <StatBar
                label="食材コスト"
                fillPct={costPct}
                valueLabel={costLabel(supplier.costMultiplier)}
                color={costColor(supplier.costMultiplier)}
              />
              <StatBar
                label="品質ボーナス"
                fillPct={qualityPct}
                valueLabel={supplier.qualityBonus >= 0 ? `+${supplier.qualityBonus}` : `${supplier.qualityBonus}`}
                color={C.teal}
              />
              <StatBar
                label="信頼性"
                fillPct={supplier.reliability}
                valueLabel={`${supplier.reliability}`}
                color={reliabilityColor}
              />

              {!isActive && (
                <TouchableOpacity
                  style={[styles.contractBtn, isContracting && styles.contractBtnLoading]}
                  onPress={() => handleContract(supplier)}
                  disabled={contracting !== null}
                  activeOpacity={0.8}
                >
                  <Text style={styles.contractBtnText}>
                    {isContracting ? "契約中..." : "CONTRACT"}
                  </Text>
                </TouchableOpacity>
              )}
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

  activeBanner: {
    backgroundColor: "#14352a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#5ce0b840",
  },
  activeBannerNone: {
    backgroundColor: "#352a14",
    borderColor: "#e8a83840",
  },
  activeBannerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: C.green,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  activeBannerName: {
    fontSize: 18,
    fontWeight: "900",
    color: C.text,
    marginBottom: 2,
  },
  activeBannerSub: {
    fontSize: 12,
    color: C.textDim,
  },

  loadingBox: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: C.textMuted, fontSize: 13 },

  emptyBox: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyText: { color: C.textMuted, fontSize: 13 },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardActive: {
    borderColor: "#5ce0b860",
    backgroundColor: "#0d1f18",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
  },
  supplierName: {
    fontSize: 15,
    fontWeight: "900",
    color: C.text,
    marginBottom: 3,
  },
  supplierDesc: {
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 16,
  },
  activePill: {
    backgroundColor: "#14352a",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#5ce0b840",
  },
  activePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: C.green,
    letterSpacing: 0.8,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  statLabel: {
    width: 64,
    fontSize: 11,
    color: C.textDim,
    fontWeight: "700",
  },
  statBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: C.bg,
    borderRadius: 3,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%" as any,
    borderRadius: 3,
  },
  statValue: {
    width: 36,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    color: C.textDim,
  },

  contractBtn: {
    marginTop: 12,
    backgroundColor: C.teal,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  contractBtnLoading: {
    opacity: 0.6,
  },
  contractBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
