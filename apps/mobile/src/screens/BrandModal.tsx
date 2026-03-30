import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import {
  BRAND_MILESTONES,
  POSITIONING_META,
  POSITIONING_LABELS,
  POSITIONING_PRICE_GUIDE,
  calcBrandConsistency,
  getBrandUnlocks,
} from "../game/engine/brand";
import type { BrandPositioning } from "../game/models/types";
import { C } from "../theme";
import { useState } from "react";

const POSITIONING_ORDER: BrandPositioning[] = ["value", "standard", "premium_fast_food", "gourmet"];

export default function BrandModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { game, setBrandPositioning } = useGameStore();
  const { brandProfile } = game;
  const { brandScore, positioning, brandConsistency, weeklyScoreDelta } = brandProfile;
  const [preview, setPreview] = useState<BrandPositioning | null>(null);

  const menus = Object.values(game.menu).map(m => ({ tasteScore: m.tasteScore, price: m.price }));
  const previewPos = preview ?? positioning;
  const previewConsistency = calcBrandConsistency(previewPos, menus);
  const unlocks = getBrandUnlocks(brandScore);

  const barWidth = `${Math.min(100, (brandScore / 1000) * 100)}%` as any;

  const handleApply = () => {
    if (!preview || preview === positioning) return;
    if (previewConsistency < 60) {
      Alert.alert(
        "Brand Confusion リスク",
        `このポジションだとメニューとの一致度が ${previewConsistency}% です。60% 未満ではブランドスコアが伸びなくなります。\nそれでも変更しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "変更する",
            onPress: () => {
              setBrandPositioning(preview);
              setPreview(null);
              onClose();
            },
          },
        ]
      );
    } else {
      setBrandPositioning(preview);
      setPreview(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Brand Strategy</Text>
            <TouchableOpacity onPress={() => { setPreview(null); onClose(); }} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Brand Score card */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>BRAND SCORE</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>{brandScore}</Text>
                <Text style={styles.scoreMax}> / 1000</Text>
                {weeklyScoreDelta > 0 && (
                  <Text style={styles.scoreDelta}> ▲+{weeklyScoreDelta}</Text>
                )}
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: barWidth }]} />
              </View>

              {/* Milestone dots */}
              <View style={styles.milestoneRow}>
                {BRAND_MILESTONES.map(m => {
                  const reached = brandScore >= m.score;
                  return (
                    <View key={m.score} style={[styles.pip, reached && styles.pipReached]}>
                      <Text style={[styles.pipLabel, reached && styles.pipLabelReached]}>
                        {m.score >= 1000 ? "1K" : m.score}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>CONSISTENCY</Text>
                  <Text style={[styles.statValue, {
                    color: brandConsistency >= 70 ? C.green : brandConsistency >= 60 ? C.amber : C.red
                  }]}>
                    {brandConsistency}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>WEEKLY Δ</Text>
                  <Text style={[styles.statValue, { color: weeklyScoreDelta >= 0 ? C.green : C.red }]}>
                    {weeklyScoreDelta >= 0 ? `+${weeklyScoreDelta}` : weeklyScoreDelta}
                  </Text>
                </View>
              </View>
            </View>

            {/* Milestones */}
            <Text style={styles.sectionLabel}>MILESTONES</Text>
            {[
              { score: 100,  label: "Rising Brand バッジ", done: unlocks.risingBrandBadge },
              { score: 250,  label: "フランチャイズ解禁",  done: unlocks.franchiseUnlocked },
              { score: 500,  label: "金利改善",            done: unlocks.loanRateImproved },
              { score: 750,  label: "希少幹部出現",        done: unlocks.rareExecutiveMarket },
              { score: 1000, label: "ブランド帝国",        done: unlocks.brandEmpireRoute },
            ].map(m => (
              <View key={m.score} style={[styles.milestoneItem, m.done && styles.milestoneItemReached]}>
                <View style={[styles.milestoneDot, m.done && styles.milestoneDotReached]} />
                <Text style={[styles.milestoneTitle, m.done && { color: C.green }]}>{m.label}</Text>
                <Text style={[styles.milestoneScore, m.done && { color: C.green }]}>{m.score}</Text>
              </View>
            ))}

            {/* Positioning selector */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>POSITIONING</Text>
            {POSITIONING_ORDER.map((pos) => {
              const meta = POSITIONING_META[pos];
              const isCurrent = positioning === pos;
              const isPreviewing = preview === pos;
              return (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.posCard,
                    isCurrent && styles.posCardCurrent,
                    isPreviewing && styles.posCardPreview,
                  ]}
                  onPress={() => setPreview(isPreviewing || isCurrent ? null : pos)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.posEmoji}>{meta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.posLabel, isCurrent && { color: C.green }]}>
                      {POSITIONING_LABELS[pos]}
                    </Text>
                    <Text style={styles.posGuide}>{POSITIONING_PRICE_GUIDE[pos]}</Text>
                  </View>
                  {isCurrent && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Consistency preview + apply */}
            {preview && preview !== positioning && (
              <View style={styles.previewBox}>
                <View style={styles.consistencyRow}>
                  <Text style={styles.consistencyLabel}>メニューとの一致度</Text>
                  <Text style={[
                    styles.consistencyValue,
                    previewConsistency < 60 && styles.consistencyWarn,
                  ]}>
                    {previewConsistency}%
                    {previewConsistency < 60 ? "  ⚠ Brand Confusion" : ""}
                  </Text>
                </View>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Text style={styles.applyBtnText}>このポジションに変更</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    padding: 20,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { color: C.text, fontSize: 18, fontWeight: "900" },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: C.textDim, fontSize: 14, fontWeight: "700" },

  // Score card
  scoreCard: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  scoreRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 12 },
  scoreValue: { fontSize: 36, fontWeight: "900", color: C.amber },
  scoreMax: { fontSize: 16, color: C.textMuted, fontWeight: "600" },
  scoreDelta: { fontSize: 14, color: C.green, marginLeft: 8 },
  barBg: {
    height: 8,
    backgroundColor: C.card,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  barFill: { height: "100%", backgroundColor: C.amber, borderRadius: 4 },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pipReached: { backgroundColor: "#14352a", borderColor: "#5ce0b8" },
  pipLabel: { fontSize: 8, fontWeight: "800", color: C.textMuted },
  pipLabelReached: { color: "#5ce0b8" },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  statLabel: { fontSize: 9, fontWeight: "700", color: C.textMuted, letterSpacing: 1, marginBottom: 3 },
  statValue: { fontSize: 20, fontWeight: "900", color: C.text },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  // Milestone list
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  milestoneItemReached: { borderColor: "#5ce0b840", backgroundColor: "#0d1f18" },
  milestoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  milestoneDotReached: { backgroundColor: C.green },
  milestoneTitle: { flex: 1, fontSize: 13, fontWeight: "800", color: C.textDim },
  milestoneScore: { fontSize: 13, fontWeight: "900", color: C.textMuted, minWidth: 32, textAlign: "right" },

  // Positioning cards
  posCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  posCardCurrent: { borderColor: "#5ce0b860", backgroundColor: "#0d1f18" },
  posCardPreview: { borderColor: C.amber + "80", backgroundColor: "#1f1a0f" },
  posEmoji: { fontSize: 22 },
  posLabel: { fontSize: 14, fontWeight: "900", color: C.text, marginBottom: 2 },
  posGuide: { fontSize: 11, color: C.textMuted, lineHeight: 15 },
  checkMark: { fontSize: 16, color: C.green, fontWeight: "900" },

  // Preview + apply
  previewBox: {
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  consistencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  consistencyLabel: { color: C.textDim, fontSize: 13 },
  consistencyValue: { color: C.text, fontSize: 14, fontWeight: "700" },
  consistencyWarn: { color: C.red },
  applyBtn: {
    backgroundColor: C.amber,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyBtnText: { color: "#000", fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },
});
