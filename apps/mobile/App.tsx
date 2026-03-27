import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Alert, Modal, Platform,
} from "react-native";
import { useGameStore } from "./src/store/gameStore";
import OpenStoreScreen from "./src/screens/OpenStoreScreen";
import MenuLabScreen from "./src/screens/MenuLabScreen";
import StaffScreen from "./src/screens/StaffScreen";
import StoreDetailScreen from "./src/screens/StoreDetailScreen";
import TurnResultModal from "./src/screens/TurnResultModal";
import type { Store } from "./src/game/models/types";

type Tab = "dashboard" | "stores" | "menu" | "staff" | "finance";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "D" },
  { key: "stores", label: "Stores", icon: "S" },
  { key: "menu", label: "Menu", icon: "M" },
  { key: "staff", label: "Staff", icon: "H" },
  { key: "finance", label: "Finance", icon: "F" },
];

const PHASE_STYLE = {
  boom:       { label: "BOOM",       color: "#5ce0b8", bg: "#14352a" },
  recovery:   { label: "RECOVERY",   color: "#5bb8d0", bg: "#14303a" },
  recession:  { label: "RECESSION",  color: "#e8a838", bg: "#352a14" },
  depression: { label: "DEPRESSION", color: "#e05c5c", bg: "#351a1a" },
};

export default function App() {
  const store = useGameStore();
  const { game, prevGame, processTurn, save, load, isSaving } = store;
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showOpenStore, setShowOpenStore] = useState(false);
  const [showMenuLab, setShowMenuLab] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showTurnResult, setShowTurnResult] = useState(false);

  const stores = Object.values(game.stores);
  const menus = Object.values(game.menu);
  const staffList = Object.values(game.staff);
  const phase = PHASE_STYLE[game.economy.phase];
  const weeklyProfit = game.finances.weeklyRevenue - game.finances.weeklyExpenses;

  // Simple bar visualization (max 5 bars representing last few implied weeks)
  const maxBar = Math.max(game.finances.weeklyRevenue, game.finances.weeklyExpenses, 1);

  return (
    <View style={styles.root}>
      <View style={styles.frame}>
        {/* ===== TOP BAR ===== */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>BI</Text>
            </View>
            <View>
              <Text style={styles.companyName}>Burger Inc.</Text>
              <Text style={styles.cashSmall}>${game.finances.cash.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>Week {game.turn}</Text>
          </View>
        </View>

        {/* ===== CONTENT ===== */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* --- NPC Advisor Bubble --- */}
          {activeTab === "dashboard" && (
            <View style={styles.advisorBubble}>
              <View style={styles.advisorAvatar}>
                <Text style={styles.advisorAvatarText}>A</Text>
              </View>
              <View style={styles.bubbleBox}>
                <Text style={styles.bubbleText}>
                  {(() => {
                    if (stores.length === 0) {
                      return "Welcome, Boss! Let's open your first store to start your burger empire.";
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
                  })()}
                </Text>
              </View>
            </View>
          )}

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === "dashboard" && (
            <>
              {/* Finance Summary */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>WEEKLY P&L</Text>
                  <View style={[styles.plBadge, { backgroundColor: weeklyProfit >= 0 ? "#14352a" : "#351a1a" }]}>
                    <Text style={[styles.plBadgeText, { color: weeklyProfit >= 0 ? "#5ce0b8" : "#e05c5c" }]}>
                      {weeklyProfit >= 0 ? "+" : ""}{weeklyProfit.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Mini bar chart */}
                <View style={styles.chartArea}>
                  <View style={styles.barGroup}>
                    <Text style={styles.barLabel}>Revenue</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, styles.barGreen, { width: `${(game.finances.weeklyRevenue / maxBar) * 100}%` }]} />
                    </View>
                    <Text style={styles.barValue}>${game.finances.weeklyRevenue.toLocaleString()}</Text>
                  </View>
                  <View style={styles.barGroup}>
                    <Text style={styles.barLabel}>Expenses</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, styles.barRed, { width: `${(game.finances.weeklyExpenses / maxBar) * 100}%` }]} />
                    </View>
                    <Text style={styles.barValue}>${game.finances.weeklyExpenses.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.finSummaryRow}>
                  <View style={styles.finSummaryItem}>
                    <Text style={styles.finLabel}>Total Revenue</Text>
                    <Text style={styles.finValueGreen}>${game.finances.totalRevenue.toLocaleString()}</Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finSummaryItem}>
                    <Text style={styles.finLabel}>Total Expenses</Text>
                    <Text style={styles.finValueRed}>${game.finances.totalExpenses.toLocaleString()}</Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finSummaryItem}>
                    <Text style={styles.finLabel}>Net Profit</Text>
                    <Text style={[styles.finValueGreen, game.finances.netProfit < 0 && styles.finValueRed]}>
                      ${game.finances.netProfit.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Economy */}
              <View style={[styles.card, { backgroundColor: phase.bg, borderColor: phase.color + "30" }]}>
                <View style={styles.econRow}>
                  <View>
                    <Text style={styles.cardLabel}>ECONOMY</Text>
                    <Text style={[styles.econPhase, { color: phase.color }]}>{phase.label}</Text>
                  </View>
                  <View style={styles.econStats}>
                    <View style={styles.econStat}>
                      <Text style={styles.econStatNum}>{Math.round(game.economy.consumerConfidence)}</Text>
                      <Text style={styles.econStatLbl}>Conf.</Text>
                    </View>
                    <View style={styles.econStat}>
                      <Text style={styles.econStatNum}>{(game.economy.interestRate * 100).toFixed(1)}%</Text>
                      <Text style={styles.econStatLbl}>Rate</Text>
                    </View>
                    <View style={styles.econStat}>
                      <Text style={styles.econStatNum}>{(game.economy.inflationRate * 100).toFixed(1)}%</Text>
                      <Text style={styles.econStatLbl}>Infl.</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.confBarBg}>
                  <View style={[styles.confBarFill, { width: `${game.economy.consumerConfidence}%`, backgroundColor: phase.color }]} />
                </View>
              </View>

              {/* Events */}
              {game.activeEvents.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>ACTIVE EVENTS</Text>
                  {game.activeEvents.map(ev => (
                    <View key={ev.id} style={styles.eventRow}>
                      <View style={[styles.evDot, {
                        backgroundColor: ev.severity === "major" ? "#e05c5c" : ev.severity === "moderate" ? "#e8a838" : "#5ce0b8"
                      }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.evTitle}>{ev.title}</Text>
                        <Text style={styles.evDesc}>{ev.description}</Text>
                      </View>
                      <Text style={styles.evDuration}>{ev.duration}w</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Brand */}
              <View style={styles.card}>
                <View style={styles.brandRow}>
                  <Text style={styles.cardLabel}>BRAND POWER</Text>
                  <Text style={styles.brandNum}>{game.brandScore}/100</Text>
                </View>
                <View style={styles.brandBarBg}>
                  <View style={[styles.brandBarFill, { width: `${game.brandScore}%` }]} />
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.actionGrid}>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#e05c5c" }]} onPress={() => setShowOpenStore(true)}>
                  <Text style={styles.actIcon}>+</Text>
                  <Text style={styles.actLabel}>Open Store</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#e8a838" }]} onPress={() => setShowMenuLab(true)}>
                  <Text style={styles.actIcon}>R&D</Text>
                  <Text style={styles.actLabel}>Menu Lab</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#5bb8d0" }]} onPress={() => setShowStaff(true)}>
                  <Text style={styles.actIcon}>HR</Text>
                  <Text style={styles.actLabel}>Hire Staff</Text>
                </TouchableOpacity>
              </View>

              {/* Turn */}
              <TouchableOpacity
                style={styles.turnBtn}
                onPress={() => { processTurn(); setShowTurnResult(true); }}
                activeOpacity={0.85}
              >
                <Text style={styles.turnText}>NEXT WEEK</Text>
              </TouchableOpacity>

              {/* Save/Load */}
              <View style={styles.saveRow}>
                <TouchableOpacity style={styles.saveBtn} onPress={async () => { await save(); Alert.alert("Saved!"); }} disabled={isSaving}>
                  <Text style={styles.saveTxt}>{isSaving ? "SAVING..." : "SAVE"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loadBtn} onPress={async () => { await load(); Alert.alert("Loaded!"); }}>
                  <Text style={styles.saveTxt}>LOAD</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ===== STORES TAB ===== */}
          {activeTab === "stores" && (
            <>
              <TouchableOpacity style={styles.addStoreBtn} onPress={() => setShowOpenStore(true)}>
                <Text style={styles.addStorePlus}>+</Text>
                <Text style={styles.addStoreText}>Open New Store</Text>
              </TouchableOpacity>
              {stores.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No Stores Yet</Text>
                  <Text style={styles.emptyHint}>Tap above to open your first burger shop!</Text>
                </View>
              ) : (
                stores.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.storeCard}
                    onPress={() => setSelectedStore(s)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.storeTop}>
                      <View>
                        <Text style={styles.storeName}>{s.name}</Text>
                        <Text style={styles.storeAddr}>{s.city} | {s.type}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: s.isOpen ? "#14352a" : "#351a1a" }]}>
                        <Text style={[styles.statusText, { color: s.isOpen ? "#5ce0b8" : "#e05c5c" }]}>
                          {s.isOpen ? "OPEN" : "CLOSED"}
                        </Text>
                      </View>
                    </View>
                    {/* Review style like Coffee Inc */}
                    <View style={styles.reviewRow}>
                      <View>
                        <Text style={styles.reviewScore}>{(s.reputation / 20).toFixed(1)}</Text>
                        <Text style={styles.reviewStars}>{"*".repeat(Math.round(s.reputation / 20))}</Text>
                      </View>
                      <View style={styles.reviewDetails}>
                        <View style={styles.reviewItem}><Text style={styles.rvLabel}>Rent</Text><Text style={styles.rvValue}>${s.rent.toLocaleString()}/mo</Text></View>
                        <View style={styles.reviewItem}><Text style={styles.rvLabel}>Capacity</Text><Text style={styles.rvValue}>{s.capacity}/day</Text></View>
                        <View style={styles.reviewItem}><Text style={styles.rvLabel}>Staff</Text><Text style={styles.rvValue}>{s.staffIds.length}</Text></View>
                        <View style={styles.reviewItem}><Text style={styles.rvLabel}>Menu</Text><Text style={styles.rvValue}>{s.menuItemIds.length}</Text></View>
                      </View>
                    </View>
                    <View style={styles.tapHint}>
                      <Text style={styles.tapHintText}>Tap to manage</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* ===== MENU TAB ===== */}
          {activeTab === "menu" && (
            <>
              <TouchableOpacity style={[styles.addStoreBtn, { backgroundColor: "#e8a838" }]} onPress={() => setShowMenuLab(true)}>
                <Text style={styles.addStorePlus}>+</Text>
                <Text style={styles.addStoreText}>Develop New Menu</Text>
              </TouchableOpacity>
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
                        <View style={styles.msBarBg}><View style={[styles.msFill, { width: `${m.tasteScore}%`, backgroundColor: "#e8a838" }]} /></View>
                        <Text style={styles.msVal}>{m.tasteScore}</Text>
                      </View>
                      <View style={styles.menuStat}>
                        <Text style={styles.msLabel}>Popular</Text>
                        <View style={styles.msBarBg}><View style={[styles.msFill, { width: `${m.popularity}%`, backgroundColor: "#5ce0b8" }]} /></View>
                        <Text style={styles.msVal}>{m.popularity}</Text>
                      </View>
                    </View>
                    <View style={styles.menuMeta}>
                      <Text style={styles.metaText}>Cost: ${m.cost} | Margin: {Math.round(((m.price - m.cost) / m.price) * 100)}% | {m.cookTime}min</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {/* ===== STAFF TAB ===== */}
          {activeTab === "staff" && (
            <>
              <TouchableOpacity style={[styles.addStoreBtn, { backgroundColor: "#5bb8d0" }]} onPress={() => setShowStaff(true)}>
                <Text style={styles.addStorePlus}>+</Text>
                <Text style={styles.addStoreText}>Hire New Staff</Text>
              </TouchableOpacity>
              {staffList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No Staff</Text>
                  <Text style={styles.emptyHint}>Hire cooks, cashiers and managers!</Text>
                </View>
              ) : (
                staffList.map(st => {
                  const assigned = stores.find(s => s.staffIds.includes(st.id));
                  return (
                    <View key={st.id} style={styles.staffCard}>
                      <View style={styles.staffTop}>
                        <View style={styles.staffAvatar}>
                          <Text style={styles.staffAvatarText}>{st.role === "cook" ? "C" : st.role === "cashier" ? "R" : "M"}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.staffName}>{st.name}</Text>
                          <Text style={styles.staffRole}>{st.role.toUpperCase()} | Lv.{st.skillLevel}</Text>
                        </View>
                        <Text style={styles.staffSalary}>${st.salary}/mo</Text>
                      </View>
                      <View style={styles.staffBars}>
                        <View style={styles.staffBarItem}>
                          <Text style={styles.sbLabel}>Satisfaction</Text>
                          <View style={styles.sbTrack}><View style={[styles.sbFill, { width: `${st.satisfaction}%`, backgroundColor: "#5ce0b8" }]} /></View>
                          <Text style={styles.sbVal}>{Math.round(st.satisfaction)}%</Text>
                        </View>
                        <View style={styles.staffBarItem}>
                          <Text style={styles.sbLabel}>Loyalty</Text>
                          <View style={styles.sbTrack}><View style={[styles.sbFill, { width: `${st.loyalty}%`, backgroundColor: "#5bb8d0" }]} /></View>
                          <Text style={styles.sbVal}>{Math.round(st.loyalty)}%</Text>
                        </View>
                      </View>
                      <Text style={styles.staffAssign}>{assigned ? `Assigned: ${assigned.name}` : "Unassigned"}</Text>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ===== FINANCE TAB ===== */}
          {activeTab === "finance" && (
            <>
              {/* Segment tabs like Coffee Inc */}
              <View style={styles.segmentRow}>
                <View style={[styles.segmentBtn, styles.segmentActive]}><Text style={styles.segmentTextActive}>P&L</Text></View>
                <View style={styles.segmentBtn}><Text style={styles.segmentText}>Balance</Text></View>
                <View style={styles.segmentBtn}><Text style={styles.segmentText}>Cash Flow</Text></View>
              </View>

              {/* Big numbers */}
              <View style={styles.finBigRow}>
                <View style={styles.finBigCard}>
                  <Text style={styles.finBigLabel}>Total Revenue</Text>
                  <Text style={styles.finBigGreen}>${game.finances.totalRevenue.toLocaleString()}</Text>
                </View>
                <View style={styles.finBigCard}>
                  <Text style={styles.finBigLabel}>Net Profit</Text>
                  <Text style={[styles.finBigGreen, game.finances.netProfit < 0 && { color: "#e05c5c" }]}>
                    ${game.finances.netProfit.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Detail table */}
              <View style={styles.card}>
                <Text style={styles.cardLabel}>INCOME</Text>
                <View style={styles.tableRow}>
                  <Text style={styles.tblLabel}>Weekly Revenue</Text>
                  <Text style={styles.tblValue}>${game.finances.weeklyRevenue.toLocaleString()}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tblLabel}>Total Revenue</Text>
                  <Text style={styles.tblValueBold}>${game.finances.totalRevenue.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>EXPENSES</Text>
                <View style={styles.tableRow}>
                  <Text style={styles.tblLabel}>Weekly Expenses</Text>
                  <Text style={styles.tblValue}>${game.finances.weeklyExpenses.toLocaleString()}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tblLabel}>Total Expenses</Text>
                  <Text style={styles.tblValueBold}>${game.finances.totalExpenses.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>SUMMARY</Text>
                <View style={styles.tableRow}>
                  <Text style={styles.tblLabel}>Starting Cash</Text>
                  <Text style={styles.tblValue}>$50,000</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tblLabel}>Current Cash</Text>
                  <Text style={styles.tblValueBold}>${game.finances.cash.toLocaleString()}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tblLabel}>Net Profit</Text>
                  <Text style={[styles.tblValueBold, { color: game.finances.netProfit >= 0 ? "#5ce0b8" : "#e05c5c" }]}>
                    ${game.finances.netProfit.toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ===== BOTTOM TAB BAR ===== */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={[styles.tabIcon, activeTab === tab.key && styles.tabIconActive]}>
                <Text style={[styles.tabIconText, activeTab === tab.key && styles.tabIconTextActive]}>{tab.icon}</Text>
              </View>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal visible={showOpenStore} animationType="slide">
        <OpenStoreScreen onClose={() => setShowOpenStore(false)} />
      </Modal>
      <Modal visible={showMenuLab} animationType="slide">
        <MenuLabScreen onClose={() => setShowMenuLab(false)} />
      </Modal>
      <Modal visible={showStaff} animationType="slide">
        <StaffScreen onClose={() => setShowStaff(false)} />
      </Modal>
      <Modal visible={selectedStore !== null} animationType="slide">
        {selectedStore && (
          <StoreDetailScreen
            store={game.stores[selectedStore.id] ?? selectedStore}
            onClose={() => setSelectedStore(null)}
          />
        )}
      </Modal>
      {showTurnResult && prevGame && (
        <TurnResultModal
          visible={showTurnResult}
          currentGame={game}
          prevGame={prevGame}
          onClose={() => setShowTurnResult(false)}
        />
      )}
    </View>
  );
}

const C = {
  bg: "#0d1117",
  card: "#161b22",
  border: "#21262d",
  text: "#e6edf3",
  textDim: "#7d8590",
  textMuted: "#484f58",
  accent: "#e05c5c",
  green: "#5ce0b8",
  red: "#e05c5c",
  teal: "#5bb8d0",
  amber: "#e8a838",
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  frame: { flex: 1, width: "100%", maxWidth: 420, backgroundColor: C.bg },

  // Top bar
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 16 : 52, paddingBottom: 12,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  companyName: { color: C.text, fontSize: 15, fontWeight: "800" },
  cashSmall: { color: C.green, fontSize: 13, fontWeight: "700" },
  dateBadge: { backgroundColor: C.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  dateText: { color: C.textDim, fontSize: 12, fontWeight: "700" },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  // Advisor
  advisorBubble: { flexDirection: "row", gap: 10, marginBottom: 14 },
  advisorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.teal, alignItems: "center", justifyContent: "center" },
  advisorAvatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  bubbleBox: { flex: 1, backgroundColor: C.card, borderRadius: 12, borderTopLeftRadius: 2, padding: 12, borderWidth: 1, borderColor: C.border },
  bubbleText: { color: C.textDim, fontSize: 13, lineHeight: 18 },

  // Card
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 },

  // PL badge
  plBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  plBadgeText: { fontSize: 13, fontWeight: "800" },

  // Chart bars
  chartArea: { marginBottom: 14, gap: 8 },
  barGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 65, fontSize: 11, color: C.textMuted, fontWeight: "600" },
  barTrack: { flex: 1, height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barGreen: { backgroundColor: C.green },
  barRed: { backgroundColor: C.red },
  barValue: { width: 70, fontSize: 11, color: C.textDim, fontWeight: "700", textAlign: "right" },

  // Finance summary
  finSummaryRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  finSummaryItem: { flex: 1, alignItems: "center" },
  finDivider: { width: 1, backgroundColor: C.border },
  finLabel: { fontSize: 9, color: C.textMuted, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  finValueGreen: { fontSize: 14, fontWeight: "800", color: C.green, marginTop: 4 },
  finValueRed: { fontSize: 14, fontWeight: "800", color: C.red, marginTop: 4 },

  // Economy
  econRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  econPhase: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  econStats: { flexDirection: "row", gap: 14 },
  econStat: { alignItems: "center" },
  econStatNum: { fontSize: 15, color: C.text, fontWeight: "800" },
  econStatLbl: { fontSize: 9, color: C.textMuted, marginTop: 1 },
  confBarBg: { height: 4, backgroundColor: C.bg, borderRadius: 2, marginTop: 12, overflow: "hidden" },
  confBarFill: { height: "100%", borderRadius: 2 },

  // Events
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  evDot: { width: 8, height: 8, borderRadius: 4 },
  evTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  evDesc: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  evDuration: { color: C.textDim, fontSize: 11, fontWeight: "700" },

  // Brand
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandNum: { fontSize: 15, fontWeight: "800", color: C.accent },
  brandBarBg: { height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden" },
  brandBarFill: { height: "100%", backgroundColor: C.accent, borderRadius: 3 },

  // Actions
  actionGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  actionCard: { flex: 1, paddingVertical: 18, borderRadius: 14, alignItems: "center" },
  actIcon: { fontSize: 16, fontWeight: "900", color: "#fff" },
  actLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginTop: 4, letterSpacing: 0.5 },

  // Turn
  turnBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 18, alignItems: "center", marginBottom: 10 },
  turnText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 2 },

  // Save/Load
  saveRow: { flexDirection: "row", gap: 8 },
  saveBtn: { flex: 1, paddingVertical: 12, backgroundColor: C.border, borderRadius: 10, alignItems: "center" },
  loadBtn: { flex: 1, paddingVertical: 12, backgroundColor: C.card, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: C.border },
  saveTxt: { color: C.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1 },

  // Empty
  emptyBox: { backgroundColor: C.card, borderRadius: 14, padding: 40, alignItems: "center", borderWidth: 1, borderColor: C.border, borderStyle: "dashed" },
  emptyTitle: { color: C.textDim, fontSize: 16, fontWeight: "700" },
  emptyHint: { color: C.textMuted, fontSize: 12, marginTop: 4 },

  // Add Store button
  addStoreBtn: { backgroundColor: C.accent, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  addStorePlus: { color: "#fff", fontSize: 20, fontWeight: "900" },
  addStoreText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // Store card
  storeCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  storeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  storeName: { color: C.text, fontSize: 16, fontWeight: "800" },
  storeAddr: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  reviewRow: { flexDirection: "row", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 16 },
  reviewScore: { fontSize: 28, fontWeight: "900", color: C.text },
  reviewStars: { color: C.amber, fontSize: 16 },
  reviewDetails: { flex: 1, gap: 4 },
  reviewItem: { flexDirection: "row", justifyContent: "space-between" },
  rvLabel: { fontSize: 12, color: C.textMuted },
  rvValue: { fontSize: 12, color: C.textDim, fontWeight: "700" },
  tapHint: { marginTop: 8, alignItems: "flex-end" },
  tapHintText: { fontSize: 10, color: C.textMuted, fontStyle: "italic" },

  // Menu card
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

  // Staff card
  staffCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  staffTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  staffAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  staffAvatarText: { color: C.textDim, fontWeight: "800", fontSize: 14 },
  staffName: { color: C.text, fontSize: 14, fontWeight: "800" },
  staffRole: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  staffSalary: { color: C.amber, fontSize: 14, fontWeight: "800" },
  staffBars: { marginTop: 10, gap: 6 },
  staffBarItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  sbLabel: { width: 75, fontSize: 10, color: C.textMuted },
  sbTrack: { flex: 1, height: 5, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden" },
  sbFill: { height: "100%", borderRadius: 3 },
  sbVal: { width: 35, fontSize: 10, color: C.textDim, fontWeight: "700", textAlign: "right" },
  staffAssign: { marginTop: 8, fontSize: 11, color: C.textMuted, fontStyle: "italic" },

  // Finance tab
  segmentRow: { flexDirection: "row", backgroundColor: C.card, borderRadius: 10, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: C.teal },
  segmentText: { color: C.textMuted, fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: "#fff", fontSize: 12, fontWeight: "700" },
  finBigRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  finBigCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  finBigLabel: { fontSize: 10, color: C.textMuted, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  finBigGreen: { fontSize: 20, fontWeight: "900", color: C.green, marginTop: 6 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  tblLabel: { fontSize: 13, color: C.textDim },
  tblValue: { fontSize: 13, color: C.textDim },
  tblValueBold: { fontSize: 13, color: C.text, fontWeight: "800" },

  // Tab bar
  tabBar: {
    flexDirection: "row", backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: Platform.OS === "web" ? 8 : 24, paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: "center", gap: 3 },
  tabIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  tabIconActive: { backgroundColor: C.accent },
  tabIconText: { color: C.textMuted, fontSize: 13, fontWeight: "800" },
  tabIconTextActive: { color: "#fff" },
  tabLabel: { fontSize: 10, color: C.textMuted, fontWeight: "600" },
  tabLabelActive: { color: C.accent, fontWeight: "700" },
});
