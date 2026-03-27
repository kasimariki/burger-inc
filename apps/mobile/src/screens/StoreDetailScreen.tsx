import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import type { Store, MenuItem, Staff } from "../game/models/types";
import { useGameStore } from "../store/gameStore";

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

interface Props {
  store: Store;
  onClose: () => void;
}

type SheetType = "menu" | "staff" | null;

export default function StoreDetailScreen({ store, onClose }: Props) {
  const { game, addMenuToStore, assignStaffToStore } = useGameStore();
  const [sheet, setSheet] = useState<SheetType>(null);

  const allMenuItems = Object.values(game.menu);
  const allStaff = Object.values(game.staff);

  const storeMenuItems = store.menuItemIds
    .map((id) => game.menu[id])
    .filter(Boolean) as MenuItem[];

  const storeStaff = store.staffIds
    .map((id) => game.staff[id])
    .filter(Boolean) as Staff[];

  // 未追加のメニュー
  const unassignedMenuItems = allMenuItems.filter(
    (m) => !store.menuItemIds.includes(m.id)
  );

  // この店舗に未配属のスタッフ（他店舗配属済みでも選べる）
  const unassignedStaff = allStaff.filter(
    (st) => !store.staffIds.includes(st.id)
  );

  const storeTypeLabel: Record<Store["type"], string> = {
    street: "Street",
    mall: "Mall",
    drive_through: "Drive-Through",
    food_truck: "Food Truck",
  };

  const handleAddMenu = (menuItemId: string) => {
    addMenuToStore(menuItemId, store.id);
    setSheet(null);
  };

  const handleAssignStaff = (staffId: string) => {
    assignStaffToStore(staffId, store.id);
    setSheet(null);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {store.name}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Store Info Card */}
        <View style={styles.card}>
          <View style={styles.infoTopRow}>
            <View>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeSub}>
                {store.city} | {storeTypeLabel[store.type]}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: store.isOpen ? "#14352a" : "#351a1a" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: store.isOpen ? C.green : C.red },
                ]}
              >
                {store.isOpen ? "OPEN" : "CLOSED"}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>RENT</Text>
              <Text style={styles.infoValue}>
                ${store.rent.toLocaleString()}/mo
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>CAPACITY</Text>
              <Text style={styles.infoValue}>{store.capacity}/day</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>CLEANLINESS</Text>
              <Text style={styles.infoValue}>{store.cleanliness}%</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>REPUTATION</Text>
              <Text style={[styles.infoValue, { color: C.amber }]}>
                {store.reputation}/100
              </Text>
            </View>
          </View>

          {/* Reputation bar */}
          <View style={styles.repBarBg}>
            <View
              style={[
                styles.repBarFill,
                { width: `${store.reputation}%` as any },
              ]}
            />
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MENU ({storeMenuItems.length})</Text>
          <TouchableOpacity
            style={[
              styles.addBtn,
              unassignedMenuItems.length === 0 && styles.addBtnDisabled,
            ]}
            onPress={() => setSheet("menu")}
            disabled={unassignedMenuItems.length === 0}
          >
            <Text style={styles.addBtnText}>+ Add Menu</Text>
          </TouchableOpacity>
        </View>

        {storeMenuItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No menu items assigned</Text>
            <Text style={styles.emptyHint}>
              Tap "Add Menu" to assign items from your menu library
            </Text>
          </View>
        ) : (
          storeMenuItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.itemCategoryBadge}>
                  <Text style={styles.itemCategoryText}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemMetaText}>
                  Taste {item.tasteScore} | Pop {item.popularity} | Cost $
                  {item.cost} | {item.cookTime}min
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Staff Section */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>STAFF ({storeStaff.length})</Text>
          <TouchableOpacity
            style={[
              styles.addBtn,
              { backgroundColor: C.teal },
              unassignedStaff.length === 0 && styles.addBtnDisabled,
            ]}
            onPress={() => setSheet("staff")}
            disabled={unassignedStaff.length === 0}
          >
            <Text style={styles.addBtnText}>+ Assign Staff</Text>
          </TouchableOpacity>
        </View>

        {storeStaff.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No staff assigned</Text>
            <Text style={styles.emptyHint}>
              Tap "Assign Staff" to place your crew here
            </Text>
          </View>
        ) : (
          storeStaff.map((st) => (
            <View key={st.id} style={styles.staffCard}>
              <View style={styles.staffAvatarBox}>
                <Text style={styles.staffAvatarText}>
                  {st.role === "cook" ? "C" : st.role === "cashier" ? "R" : "M"}
                </Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{st.name}</Text>
                <Text style={styles.staffRole}>
                  {st.role.toUpperCase()} | Lv.{st.skillLevel}
                </Text>
              </View>
              <Text style={styles.staffSalary}>${st.salary}/mo</Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Sheet: Add Menu */}
      <Modal visible={sheet === "menu"} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Menu Item</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setSheet(null)}
              >
                <Text style={styles.sheetCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetScroll}>
              {unassignedMenuItems.length === 0 ? (
                <View style={styles.sheetEmpty}>
                  <Text style={styles.sheetEmptyText}>
                    All menu items are already assigned to this store.
                  </Text>
                </View>
              ) : (
                unassignedMenuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.sheetItem}
                    onPress={() => handleAddMenu(item.id)}
                  >
                    <View style={styles.sheetItemLeft}>
                      <View style={styles.sheetCategoryBadge}>
                        <Text style={styles.sheetCategoryText}>
                          {item.category.toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.sheetItemName}>{item.name}</Text>
                        <Text style={styles.sheetItemMeta}>
                          Taste {item.tasteScore} | ${item.price}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.sheetAddPill}>
                      <Text style={styles.sheetAddText}>ADD</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Sheet: Assign Staff */}
      <Modal visible={sheet === "staff"} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Assign Staff</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setSheet(null)}
              >
                <Text style={styles.sheetCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetScroll}>
              {unassignedStaff.length === 0 ? (
                <View style={styles.sheetEmpty}>
                  <Text style={styles.sheetEmptyText}>
                    No additional staff available to assign.
                  </Text>
                </View>
              ) : (
                unassignedStaff.map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={styles.sheetItem}
                    onPress={() => handleAssignStaff(st.id)}
                  >
                    <View style={styles.sheetItemLeft}>
                      <View
                        style={[
                          styles.sheetCategoryBadge,
                          { backgroundColor: "#1a2a35" },
                        ]}
                      >
                        <Text
                          style={[styles.sheetCategoryText, { color: C.teal }]}
                        >
                          {st.role === "cook"
                            ? "COOK"
                            : st.role === "cashier"
                            ? "CASH"
                            : "MGR"}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.sheetItemName}>{st.name}</Text>
                        <Text style={styles.sheetItemMeta}>
                          Lv.{st.skillLevel} | ${st.salary}/mo
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.sheetAddPill,
                        { backgroundColor: "#1a2a35" },
                      ]}
                    >
                      <Text style={[styles.sheetAddText, { color: C.teal }]}>
                        ASSIGN
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 16 : 52,
    paddingBottom: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 64 },
  backText: { color: C.teal, fontSize: 14, fontWeight: "700" },
  headerTitle: {
    flex: 1,
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },

  infoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  storeName: { color: C.text, fontSize: 18, fontWeight: "900" },
  storeSub: { color: C.textMuted, fontSize: 12, marginTop: 3 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  infoItem: { flex: 1, minWidth: "45%" },
  infoLabel: {
    fontSize: 9,
    color: C.textMuted,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  infoValue: { color: C.text, fontSize: 14, fontWeight: "800" },

  repBarBg: {
    height: 4,
    backgroundColor: C.bg,
    borderRadius: 2,
    overflow: "hidden",
  },
  repBarFill: {
    height: "100%",
    backgroundColor: C.amber,
    borderRadius: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  addBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  emptyBox: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    marginBottom: 12,
  },
  emptyText: { color: C.textDim, fontSize: 13, fontWeight: "700" },
  emptyHint: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },

  itemCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemCategoryBadge: {
    backgroundColor: "#2a1f14",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  itemCategoryText: { color: C.amber, fontSize: 9, fontWeight: "800" },
  itemName: { flex: 1, color: C.text, fontSize: 13, fontWeight: "700" },
  itemPrice: { color: C.green, fontSize: 14, fontWeight: "900" },
  itemMeta: { marginTop: 6 },
  itemMetaText: { color: C.textMuted, fontSize: 11 },

  staffCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  staffAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarText: { color: C.textDim, fontWeight: "800", fontSize: 14 },
  staffInfo: { flex: 1 },
  staffName: { color: C.text, fontSize: 13, fontWeight: "800" },
  staffRole: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  staffSalary: { color: C.amber, fontSize: 13, fontWeight: "800" },

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    borderTopWidth: 1,
    borderColor: C.border,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetTitle: { color: C.text, fontSize: 16, fontWeight: "800" },
  sheetCloseBtn: {
    backgroundColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sheetCloseText: { color: C.textDim, fontSize: 12, fontWeight: "700" },
  sheetScroll: { padding: 14 },
  sheetEmpty: { padding: 24, alignItems: "center" },
  sheetEmptyText: {
    color: C.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetItemLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sheetCategoryBadge: {
    backgroundColor: "#2a1f14",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    minWidth: 44,
    alignItems: "center",
  },
  sheetCategoryText: { color: C.amber, fontSize: 9, fontWeight: "800" },
  sheetItemName: { color: C.text, fontSize: 13, fontWeight: "700" },
  sheetItemMeta: { color: C.textMuted, fontSize: 11, marginTop: 2 },
  sheetAddPill: {
    backgroundColor: "#2a1014",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sheetAddText: { color: C.accent, fontSize: 11, fontWeight: "800" },
});
