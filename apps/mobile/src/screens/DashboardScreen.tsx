import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import { fetchBrandProfile, type BrandProfile } from "../services/api";
import TurnResultModal from "./TurnResultModal";
import BrandModal from "./BrandModal";
import type { DashboardStackParamList } from "../navigation/types";
import { C } from "../theme";
import type { Store } from "../game/models/types";
import type { StoreType } from "@burger-inc/shared";
import { BRAND_MILESTONES, POSITIONING_META } from "../game/engine/brand";

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------

const PHASE_STYLE = {
  boom:       { label: "BOOM",       color: "#5ce0b8", bg: "#14352a" },
  recovery:   { label: "RECOVERY",   color: "#5bb8d0", bg: "#14303a" },
  recession:  { label: "RECESSION",  color: "#e8a838", bg: "#352a14" },
  depression: { label: "DEPRESSION", color: "#e05c5c", bg: "#351a1a" },
};

const STORE_COLORS: Record<StoreType, { primary: string; secondary: string }> = {
  street:       { primary: "#e05c5c", secondary: "#c0392b" },
  mall:         { primary: "#8e44ad", secondary: "#6c3483" },
  drive_through: { primary: "#2980b9", secondary: "#1a5276" },
  food_truck:   { primary: "#e8a838", secondary: "#d4ac0d" },
};

const STORE_TYPE_LABEL: Record<StoreType, string> = {
  street:        "STREET",
  mall:          "MALL",
  drive_through: "DRIVE-THRU",
  food_truck:    "FOOD TRUCK",
};

type NavProp = NativeStackNavigationProp<DashboardStackParamList, "DashboardScreen">;

// ----------------------------------------------------------------
// 収益グラフ（過去8週、純RN実装）
// ----------------------------------------------------------------

function ProfitChart({ history }: { history: { turn: number; netProfit: number }[] }) {
  if (history.length === 0) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>ターンを進めると記録されます</Text>
      </View>
    );
  }

  const maxAbs = Math.max(...history.map(h => Math.abs(h.netProfit)), 1);
  const CHART_H = 64;

  return (
    <View style={chartStyles.wrapper}>
      {history.map((entry) => {
        const fraction = Math.abs(entry.netProfit) / maxAbs;
        const barH = Math.max(3, fraction * CHART_H);
        const isPos = entry.netProfit >= 0;
        return (
          <View key={entry.turn} style={[chartStyles.barCol, { height: CHART_H + 20 }]}>
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
              <View
                style={{
                  height: barH,
                  backgroundColor: isPos ? "#5ce0b8" : "#e05c5c",
                  borderRadius: 3,
                  opacity: 0.85,
                  marginHorizontal: 2,
                }}
              />
            </View>
            <Text style={chartStyles.barLabel}>W{entry.turn}</Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  barCol: {
    flex: 1,
    alignItems: "stretch",
  },
  barLabel: {
    fontSize: 8,
    color: "#484f58",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },
  empty: {
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#484f58",
  },
});

// ----------------------------------------------------------------
// サブコンポーネント
// ----------------------------------------------------------------

/** アドバイザーバブル（1行コンパクト） */
function AdvisorBubble({ message }: { message: string }) {
  return (
    <View style={styles.advisorBubble}>
      <View style={styles.advisorAvatar}>
        <Text style={styles.advisorAvatarText}>A</Text>
      </View>
      <View style={styles.bubbleBox}>
        <Text style={styles.bubbleText} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </View>
  );
}

/** ウェルカムカード（店舗なし時） */
function WelcomeCard({ onOpenStore }: { onOpenStore: () => void }) {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeIconBox}>
        <Text style={styles.welcomeIcon}>B</Text>
      </View>
      <Text style={styles.welcomeTitle}>Start Your Empire</Text>
      <Text style={styles.welcomeSubtitle}>
        Open your first store and start serving burgers to the world.
      </Text>
      <TouchableOpacity style={styles.welcomeBtn} onPress={onOpenStore} activeOpacity={0.8}>
        <Text style={styles.welcomeBtnText}>+ OPEN FIRST STORE</Text>
      </TouchableOpacity>
    </View>
  );
}

/** メインショップカード（一番売上の高い店舗） */
function MainShopCard({
  store,
  weeklyCustomers,
  weeklyRevenue,
  menuCount,
  staffCount,
}: {
  store: Store;
  weeklyCustomers: number;
  weeklyRevenue: number;
  menuCount: number;
  staffCount: number;
}) {
  const colors = STORE_COLORS[store.type];
  const starRating = Math.round(store.reputation / 20);
  const stars = Array.from({ length: 5 }, (_, i) => i < starRating ? "★" : "☆").join("");
  const ratingNum = (store.reputation / 20).toFixed(1);

  return (
    <View style={[styles.mainShopCard, { borderLeftColor: colors.primary, borderLeftWidth: 5 }]}>
      {/* カード上部：タイプバッジとステータス */}
      <View style={styles.shopCardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: colors.primary + "30", borderColor: colors.primary + "60" }]}>
          <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
            {STORE_TYPE_LABEL[store.type]}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: store.isOpen ? "#14352a" : "#2a1414" }]}>
          <View style={[styles.statusDot, { backgroundColor: store.isOpen ? "#5ce0b8" : "#e05c5c" }]} />
          <Text style={[styles.statusText, { color: store.isOpen ? "#5ce0b8" : "#e05c5c" }]}>
            {store.isOpen ? "OPEN" : "CLOSED"}
          </Text>
        </View>
      </View>

      {/* 店舗名 */}
      <Text style={styles.shopName}>{store.name}</Text>

      {/* 星評価 */}
      <View style={styles.starsRow}>
        <Text style={[styles.starsText, { color: colors.primary }]}>{stars}</Text>
        <Text style={styles.ratingNum}>{ratingNum}</Text>
      </View>

      {/* TODAY セクション：来客数と売上 */}
      <View style={[styles.todaySection, { borderTopColor: colors.primary + "30" }]}>
        <View style={styles.todayItem}>
          <Text style={styles.todayBigNum}>{weeklyCustomers.toLocaleString()}</Text>
          <Text style={styles.todayLabel}>CUSTOMERS / WK</Text>
        </View>
        <View style={[styles.todayDivider, { backgroundColor: colors.primary + "40" }]} />
        <View style={styles.todayItem}>
          <Text style={[styles.todayBigNum, { color: "#5ce0b8" }]}>
            ${weeklyRevenue.toLocaleString()}
          </Text>
          <Text style={styles.todayLabel}>REVENUE / WK</Text>
        </View>
      </View>

      {/* 実況風テキスト */}
      <View style={styles.liveRow}>
        <Text style={styles.liveText}>
          {weeklyCustomers} customers served this week
        </Text>
      </View>
      <View style={styles.liveRow}>
        <Text style={styles.liveText}>
          {ratingNum} avg rating  |  {store.city}
        </Text>
      </View>

      {/* メニュー数・スタッフ数 */}
      <View style={styles.shopInfoRow}>
        <View style={styles.shopInfoItem}>
          <Text style={styles.shopInfoIcon}>M</Text>
          <Text style={styles.shopInfoText}>{menuCount} menus</Text>
        </View>
        <View style={styles.shopInfoItem}>
          <Text style={styles.shopInfoIcon}>S</Text>
          <Text style={styles.shopInfoText}>{staffCount} staff</Text>
        </View>
      </View>
    </View>
  );
}

/** ミニ店舗カード（横スクロール用） */
function MiniShopCard({ store, index }: { store: Store; index: number }) {
  const colors = STORE_COLORS[store.type];
  return (
    <View style={[styles.miniShopCard, { borderTopColor: colors.primary, borderTopWidth: 3 }]}>
      <Text style={[styles.miniShopType, { color: colors.primary }]}>
        {STORE_TYPE_LABEL[store.type]}
      </Text>
      <Text style={styles.miniShopName} numberOfLines={1}>{store.name}</Text>
      <View style={[styles.miniStatusDot, { backgroundColor: store.isOpen ? "#5ce0b8" : "#e05c5c" }]} />
    </View>
  );
}

/** 出店ミニカード（横スクロールの最後） */
function AddStoreMiniCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addStoreCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.addStoreIcon}>+</Text>
      <Text style={styles.addStoreText}>New Store</Text>
    </TouchableOpacity>
  );
}

/** ゲームステータスバー（Cash / Profit / Brand） */
function GameStatusBar({
  cash,
  weeklyProfit,
  brandScore,
}: {
  cash: number;
  weeklyProfit: number;
  brandScore: number;
}) {
  const profitPositive = weeklyProfit >= 0;
  return (
    <View style={styles.statusBar}>
      <View style={styles.statusBarItem}>
        <Text style={styles.statusBarLabel}>CASH</Text>
        <Text style={[styles.statusBarValue, { color: "#5ce0b8" }]}>
          ${cash.toLocaleString()}
        </Text>
      </View>
      <View style={styles.statusBarDivider} />
      <View style={styles.statusBarItem}>
        <Text style={styles.statusBarLabel}>PROFIT/WK</Text>
        <Text style={[styles.statusBarValue, { color: profitPositive ? "#5ce0b8" : "#e05c5c" }]}>
          {profitPositive ? "+" : ""}{weeklyProfit.toLocaleString()}
        </Text>
      </View>
      <View style={styles.statusBarDivider} />
      <View style={styles.statusBarItem}>
        <Text style={styles.statusBarLabel}>BRAND</Text>
        <View style={styles.brandRingArea}>
          <View style={styles.brandRingBg}>
            <View
              style={[
                styles.brandRingFill,
                { width: `${brandScore}%` as any },
              ]}
            />
          </View>
          <Text style={[styles.statusBarValue, { color: C.amber }]}>
            {brandScore}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** ブランドスコアバー（0〜1000, マイルストーン付き） */
function BrandBar({
  brandScore,
  positioning,
  onPress,
}: {
  brandScore: number;
  positioning: string;
  onPress: () => void;
}) {
  const meta = POSITIONING_META[positioning as keyof typeof POSITIONING_META];
  const pct = Math.min(100, (brandScore / 1000) * 100);
  return (
    <TouchableOpacity style={brandBarStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={brandBarStyles.header}>
        <View style={brandBarStyles.left}>
          <Text style={brandBarStyles.label}>BRAND SCORE</Text>
          <Text style={brandBarStyles.score}>
            {brandScore}<Text style={brandBarStyles.scoreMax}> /1000</Text>
          </Text>
        </View>
        <View style={brandBarStyles.posBadge}>
          <Text style={brandBarStyles.posEmoji}>{meta?.emoji ?? "🍔"}</Text>
          <Text style={brandBarStyles.posLabel}>{meta?.label ?? positioning}</Text>
        </View>
      </View>
      <View style={brandBarStyles.barBg}>
        <View style={[brandBarStyles.barFill, { width: `${pct}%` as any }]} />
        {BRAND_MILESTONES.map(m => {
          const pos = (m.score / 1000) * 100;
          return (
            <View
              key={m.score}
              style={[
                brandBarStyles.tick,
                { left: `${pos}%` as any },
                brandScore >= m.score && brandBarStyles.tickReached,
              ]}
            />
          );
        })}
      </View>
      <Text style={brandBarStyles.hint}>Tap to change strategy →</Text>
    </TouchableOpacity>
  );
}

const brandBarStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  left: {},
  label: { fontSize: 9, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, marginBottom: 3 },
  score: { fontSize: 24, fontWeight: "900", color: C.amber },
  scoreMax: { fontSize: 13, color: C.textMuted, fontWeight: "600" },
  posBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  posEmoji: { fontSize: 14 },
  posLabel: { fontSize: 11, fontWeight: "800", color: C.textDim },
  barBg: {
    height: 8,
    backgroundColor: C.bg,
    borderRadius: 4,
    overflow: "visible",
    marginBottom: 4,
    position: "relative",
  },
  barFill: {
    height: "100%",
    backgroundColor: C.amber,
    borderRadius: 4,
  },
  tick: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: C.border,
    borderRadius: 1,
  },
  tickReached: { backgroundColor: "#5ce0b860" },
  hint: { fontSize: 9, color: C.textMuted, textAlign: "right", marginTop: 2 },
});

/** イベントカード */
function EventCard({ title, description, severity, duration }: {
  title: string;
  description: string;
  severity: "minor" | "moderate" | "major";
  duration: number;
}) {
  const colors = {
    major:    { bg: "#351a1a", border: "#e05c5c60", text: "#e05c5c" },
    moderate: { bg: "#352a14", border: "#e8a83860", text: "#e8a838" },
    minor:    { bg: "#14352a", border: "#5ce0b860", text: "#5ce0b8" },
  }[severity];

  return (
    <View style={[styles.eventCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.eventCardHeader}>
        <View style={[styles.eventSeverityBadge, { backgroundColor: colors.text + "25" }]}>
          <Text style={[styles.eventSeverityText, { color: colors.text }]}>
            {severity.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.eventDuration, { color: colors.text }]}>{duration}w remaining</Text>
      </View>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventDesc}>{description}</Text>
    </View>
  );
}

/** 丸いアクションボタン */
function RoundActionButton({
  label,
  sublabel,
  color,
  onPress,
}: {
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.roundActionWrapper} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.roundActionCircle, { backgroundColor: color }]}>
        <Text style={styles.roundActionLabel}>{label}</Text>
      </View>
      <Text style={styles.roundActionSublabel}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

// ----------------------------------------------------------------
// メインスクリーン
// ----------------------------------------------------------------

const POSITIONING_LABELS: Record<string, { label: string; color: string }> = {
  value: { label: "VALUE", color: C.green },
  standard: { label: "STANDARD", color: C.teal },
  premium_fast_food: { label: "PREMIUM", color: C.amber },
  gourmet: { label: "GOURMET", color: C.accent },
};

export default function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { game, prevGame, processTurn, save, load, isSaving, profitHistory, userId } = useGameStore();
  const [showTurnResult, setShowTurnResult] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  useEffect(() => {
    fetchBrandProfile(userId, 1).then(setBrandProfile).catch(() => undefined);
  }, [game.turn]);

  const stores = Object.values(game.stores);
  const menus = Object.values(game.menu);
  const staffList = Object.values(game.staff);
  const phase = PHASE_STYLE[game.economy.phase];
  const weeklyProfit = game.finances.weeklyRevenue - game.finances.weeklyExpenses;

  // アドバイザーメッセージ（ロジック維持）
  const advisorMessage = (() => {
    if (stores.length === 0) {
      return "Welcome, Boss! Open your first store to start your burger empire.";
    }
    if (menus.length === 0) {
      return "You have a store! Head to Menu Lab to develop your signature burger.";
    }
    if (staffList.length === 0) {
      return "Great menu! Now hire some staff — your store needs a crew to operate.";
    }
    const hasStoreWithMenu = stores.some(s => s.menuItemIds.length > 0);
    if (!hasStoreWithMenu) {
      return "Go to the Stores tab and add your menu items to a store so customers can order!";
    }
    const hasStoreWithStaff = stores.some(s => s.staffIds.length > 0);
    if (!hasStoreWithStaff) {
      return "Go to the Stores tab and assign staff to a store so it can operate!";
    }
    const unassignedStaff = staffList.filter(
      st => !stores.some(s => s.staffIds.includes(st.id))
    );
    if (unassignedStaff.length > 0) {
      return `${unassignedStaff.length} staff member(s) are unassigned. Head to Stores tab to place them!`;
    }
    if (game.finances.weeklyRevenue === 0) {
      return "Everything is set! Tap NEXT WEEK to start generating sales.";
    }
    if (weeklyProfit > 1000) {
      return `Outstanding! $${weeklyProfit.toLocaleString()} profit this week. Time to open another store!`;
    }
    if (weeklyProfit > 0) {
      return `Nice work! You made $${weeklyProfit.toLocaleString()} profit this week. Keep expanding!`;
    }
    if (weeklyProfit < 0) {
      return "We're losing money this week. Check your expenses and menu pricing.";
    }
    return "Business is steady. Consider new menu items or expanding to boost revenue.";
  })();

  // 一番売上の高い店舗（weeklyRevenue を proxy として brandScore / reputation で並べる）
  const mainStore = stores.length > 0
    ? stores.reduce((best, s) => (s.reputation > best.reputation ? s : best), stores[0])
    : null;

  const otherStores = mainStore
    ? stores.filter(s => s.id !== mainStore.id)
    : [];

  // メインストアのスタッフ数・メニュー数
  const mainMenuCount = mainStore ? mainStore.menuItemIds.length : 0;
  const mainStaffCount = mainStore ? mainStore.staffIds.length : 0;

  // 来客数の推定（capacity * reputation 係数）
  const estimatedCustomers = mainStore
    ? Math.round(mainStore.capacity * (mainStore.reputation / 100) * 7)
    : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ---- ゾーン0: アドバイザー ---- */}
      <AdvisorBubble message={advisorMessage} />

      {/* ---- ゾーン1: ビジュアルエリア ---- */}
      {stores.length === 0 ? (
        <WelcomeCard onOpenStore={() => navigation.navigate("OpenStoreScreen")} />
      ) : (
        <>
          {mainStore && (
            <MainShopCard
              store={mainStore}
              weeklyCustomers={estimatedCustomers}
              weeklyRevenue={game.finances.weeklyRevenue}
              menuCount={mainMenuCount}
              staffCount={mainStaffCount}
            />
          )}

          {/* 複数店舗の横スクロール */}
          {(otherStores.length > 0 || true) && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.miniScrollRow}
              contentContainerStyle={styles.miniScrollContent}
            >
              {otherStores.map((store, i) => (
                <MiniShopCard key={store.id} store={store} index={i + 2} />
              ))}
              <AddStoreMiniCard onPress={() => navigation.navigate("OpenStoreScreen")} />
            </ScrollView>
          )}
        </>
      )}

      {/* ---- ゾーン2: ゲームステータス ---- */}
      <GameStatusBar
        cash={game.finances.cash}
        weeklyProfit={weeklyProfit}
        brandScore={game.brandScore}
      />

      {/* 経済フェーズ（コンパクト） */}
      <View style={[styles.econChip, { backgroundColor: phase.bg, borderColor: phase.color + "40" }]}>
        <Text style={[styles.econChipLabel, { color: phase.color }]}>
          ECONOMY: {phase.label}
        </Text>
        <View style={styles.econChipStats}>
          <Text style={styles.econChipStat}>Conf. {Math.round(game.economy.consumerConfidence)}</Text>
          <Text style={styles.econChipStat}>Rate {(game.economy.interestRate * 100).toFixed(1)}%</Text>
          <Text style={styles.econChipStat}>Infl. {(game.economy.inflationRate * 100).toFixed(1)}%</Text>
        </View>
      </View>

      {/* ---- ブランドスコアバー ---- */}
      <BrandBar
        brandScore={game.brandProfile.brandScore}
        positioning={game.brandProfile.positioning}
        onPress={() => setShowBrandModal(true)}
      />

      {/* ---- 収益グラフ ---- */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionLabel}>PROFIT HISTORY (8 WEEKS)</Text>
        <ProfitChart history={profitHistory} />
      </View>

      {/* ---- ゾーン3: アクション＆イベント ---- */}

      {/* イベントカード */}
      {game.activeEvents.length > 0 && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionLabel}>ACTIVE EVENTS</Text>
          {game.activeEvents.map(ev => (
            <EventCard
              key={ev.id}
              title={ev.title}
              description={ev.description}
              severity={ev.severity}
              duration={ev.duration}
            />
          ))}
        </View>
      )}

      {/* Brand */}
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <Text style={styles.cardLabel}>BRAND POWER</Text>
          <Text style={styles.brandNum}>{brandProfile?.brandScore ?? game.brandScore}</Text>
        </View>
        <View style={styles.brandBarBg}>
          <View style={[styles.brandBarFill, { width: `${Math.min(100, (brandProfile?.brandScore ?? game.brandScore) / 10)}%` as any }]} />
        </View>
        {brandProfile && (
          <View style={styles.brandDetails}>
            <View style={styles.brandDetailItem}>
              <Text style={[styles.brandDetailVal, { color: POSITIONING_LABELS[brandProfile.positioning]?.color ?? C.teal }]}>
                {POSITIONING_LABELS[brandProfile.positioning]?.label ?? brandProfile.positioning}
              </Text>
              <Text style={styles.brandDetailLabel}>Position</Text>
            </View>
            <View style={styles.brandDetailItem}>
              <Text style={[styles.brandDetailVal, { color: brandProfile.brandConsistency >= 60 ? C.green : C.red }]}>
                {brandProfile.brandConsistency}%
              </Text>
              <Text style={styles.brandDetailLabel}>Consistency</Text>
            </View>
            <View style={styles.brandDetailItem}>
              <Text style={[styles.brandDetailVal, { color: brandProfile.weeklyScoreDelta >= 0 ? C.green : C.red }]}>
                {brandProfile.weeklyScoreDelta >= 0 ? "+" : ""}{brandProfile.weeklyScoreDelta}
              </Text>
              <Text style={styles.brandDetailLabel}>Weekly</Text>
            </View>
          </View>
        )}
      </View>

      {/* アクションボタン（丸いゲーム的デザイン） */}
      <Text style={styles.sectionLabel}>ACTIONS</Text>
      <View style={styles.actionRow}>
        <RoundActionButton
          label="+"
          sublabel="Open Store"
          color="#e05c5c"
          onPress={() => navigation.navigate("OpenStoreScreen")}
        />
        <RoundActionButton
          label="RD"
          sublabel="Menu Lab"
          color="#e8a838"
          onPress={() => navigation.navigate("MenuLabScreen")}
        />
        <RoundActionButton
          label="HR"
          sublabel="Hire Staff"
          color="#5bb8d0"
          onPress={() => navigation.navigate("HireScreen")}
        />
        <RoundActionButton
          label="BR"
          sublabel="Brand"
          color="#8e44ad"
          onPress={() => setShowBrandModal(true)}
        />
        <RoundActionButton
          label="CT"
          sublabel="Cities"
          color="#2980b9"
          onPress={() => navigation.getParent()?.navigate("StoresTab", { screen: "CitiesScreen" })}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#e05c5c" }]}
          onPress={() => navigation.navigate("OpenStoreScreen")}
        />

      {/* Strategy Actions */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#5bb8d0" }]}
          onPress={() => navigation.navigate("CampaignScreen")}
        >
          <Text style={styles.actIcon}>AD</Text>
          <Text style={styles.actLabel}>Marketing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#a78bfa" }]}
          onPress={() => navigation.navigate("HQScreen")}
        >
          <Text style={styles.actIcon}>HQ</Text>
          <Text style={styles.actLabel}>Headquarters</Text>
        </TouchableOpacity>
      </View>

      {/* NEXT WEEK ボタン */}
      <TouchableOpacity
        style={styles.nextWeekBtn}
        onPress={() => { processTurn(); setShowTurnResult(true); }}
        activeOpacity={0.85}
      >
        <View style={styles.nextWeekBorder}>
          <Text style={styles.nextWeekText}>NEXT WEEK</Text>
          <Text style={styles.nextWeekArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Save/Load */}
      <View style={styles.saveRow}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={async () => { await save(); Alert.alert("Saved!"); }}
          disabled={isSaving}
        >
          <Text style={styles.saveTxt}>{isSaving ? "SAVING..." : "SAVE"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loadBtn}
          onPress={async () => { await load(); Alert.alert("Loaded!"); }}
        >
          <Text style={styles.saveTxt}>LOAD</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 48 }} />

      {/* TurnResultModal */}
      {showTurnResult && prevGame && (
        <TurnResultModal
          visible={showTurnResult}
          currentGame={game}
          prevGame={prevGame}
          onClose={() => setShowTurnResult(false)}
        />
      )}

      {/* BrandModal */}
      <BrandModal
        visible={showBrandModal}
        onClose={() => setShowBrandModal(false)}
      />
    </ScrollView>
  );
}

// ----------------------------------------------------------------
// スタイル
// ----------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 14, paddingTop: 10 },

  // --- アドバイザー（コンパクト） ---
  advisorBubble: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  advisorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.teal,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  advisorAvatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  bubbleBox: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 10,
    borderTopLeftRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleText: { color: C.textDim, fontSize: 12, lineHeight: 17 },

  // --- ウェルカムカード ---
  welcomeCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 28,
    alignItems: "center",
    marginBottom: 14,
  },
  welcomeIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  welcomeIcon: { color: "#fff", fontSize: 32, fontWeight: "900" },
  welcomeTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    color: C.textDim,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  welcomeBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  welcomeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  // --- メインショップカード ---
  mainShopCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  shopCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  shopName: {
    color: C.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  starsText: { fontSize: 15, letterSpacing: 2 },
  ratingNum: { color: C.textDim, fontSize: 13, fontWeight: "700" },

  // TODAY セクション
  todaySection: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 14,
    marginBottom: 10,
  },
  todayItem: { flex: 1, alignItems: "center" },
  todayDivider: { width: 1, marginHorizontal: 8 },
  todayBigNum: {
    color: C.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  todayLabel: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  // 実況テキスト
  liveRow: { marginBottom: 3 },
  liveText: {
    color: C.textDim,
    fontSize: 11,
    fontStyle: "italic",
  },

  // ショップ情報（メニュー・スタッフ）
  shopInfoRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  shopInfoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  shopInfoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.border,
    textAlign: "center",
    lineHeight: 20,
    color: C.textDim,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
  },
  shopInfoText: { color: C.textDim, fontSize: 12, fontWeight: "600" },

  // --- ミニ店舗横スクロール ---
  miniScrollRow: { marginBottom: 14 },
  miniScrollContent: { gap: 8, paddingRight: 14 },
  miniShopCard: {
    width: 90,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    justifyContent: "space-between",
  },
  miniShopType: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginBottom: 4 },
  miniShopName: { color: C.textDim, fontSize: 11, fontWeight: "700" },
  miniStatusDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  addStoreCard: {
    width: 90,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  addStoreIcon: { color: C.textMuted, fontSize: 22, fontWeight: "300" },
  addStoreText: { color: C.textMuted, fontSize: 10, fontWeight: "700", marginTop: 3 },

  // --- ゲームステータスバー ---
  statusBar: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    paddingVertical: 12,
  },
  statusBarItem: { flex: 1, alignItems: "center" },
  statusBarDivider: { width: 1, backgroundColor: C.border },
  statusBarLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusBarValue: {
    fontSize: 16,
    fontWeight: "900",
    color: C.text,
  },
  brandRingArea: { alignItems: "center" },
  brandRingBg: {
    width: 48,
    height: 4,
    backgroundColor: C.bg,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 3,
  },
  brandRingFill: {
    height: "100%",
    backgroundColor: C.amber,
    borderRadius: 2,
  },

  // Brand
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandNum: { fontSize: 15, fontWeight: "800", color: C.accent },
  brandBarBg: { height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden" },
  brandBarFill: { height: "100%", backgroundColor: C.accent, borderRadius: 3 },
  brandDetails: { flexDirection: "row", marginTop: 10, gap: 8 },
  brandDetailItem: { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 8, alignItems: "center" },
  brandDetailVal: { fontSize: 13, fontWeight: "800" },
  brandDetailLabel: { fontSize: 8, color: C.textMuted, fontWeight: "600", marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" },

  // --- 経済チップ ---
  econChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  econChipLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  econChipStats: { flexDirection: "row", gap: 10 },
  econChipStat: { fontSize: 10, color: C.textDim, fontWeight: "600" },

  // --- イベントカード ---
  eventsSection: { marginBottom: 14 },
  eventCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  eventSeverityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventSeverityText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  eventDuration: { fontSize: 11, fontWeight: "700" },
  eventTitle: { color: C.text, fontSize: 13, fontWeight: "800", marginBottom: 3 },
  eventDesc: { color: C.textDim, fontSize: 11, lineHeight: 16 },

  // --- セクションラベル ---
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  // --- 丸いアクションボタン ---
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  roundActionWrapper: { alignItems: "center", gap: 8 },
  roundActionCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  roundActionLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  roundActionSublabel: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // --- NEXT WEEK ボタン ---
  nextWeekBtn: {
    marginBottom: 10,
  },
  nextWeekBorder: {
    backgroundColor: C.accent,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ff8a8a",
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextWeekText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  nextWeekArrow: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 28,
  },

  // --- 収益グラフカード ---
  chartCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 14,
  },

  // --- Save/Load ---
  saveRow: { flexDirection: "row", gap: 8 },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: C.border,
    borderRadius: 10,
    alignItems: "center",
  },
  loadBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  saveTxt: { color: C.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1 },

  // --- Strategy Actions グリッド ---
  actionGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  actLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
