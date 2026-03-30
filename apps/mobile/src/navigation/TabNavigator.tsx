import { Platform, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import { C } from "../theme";
import type { GameState } from "../game/models/types";

import type {
  RootTabParamList,
  DashboardStackParamList,
  StoresStackParamList,
  MenuStackParamList,
  StaffStackParamList,
  FinanceStackParamList,
} from "./types";

// Screens
import DashboardScreen from "../screens/DashboardScreen";
import OpenStoreScreen from "../screens/OpenStoreScreen";
import MenuLabScreen from "../screens/MenuLabScreen";
import StaffScreen from "../screens/StaffScreen";
import StoreListScreen from "../screens/StoreListScreen";
import StoreDetailScreen from "../screens/StoreDetailScreen";
import CitiesScreen from "../screens/CitiesScreen";
import MenuListScreen from "../screens/MenuListScreen";
import StaffListScreen from "../screens/StaffListScreen";
import FinanceScreen from "../screens/FinanceScreen";
import CampaignScreen from "../screens/CampaignScreen";
import HQScreen from "../screens/HQScreen";
import HistoryScreen from "../screens/HistoryScreen";
import SupplierScreen from "../screens/SupplierScreen";

// ---- Stack Navigators ----

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const StoresStack = createNativeStackNavigator<StoresStackParamList>();
const MenuStack = createNativeStackNavigator<MenuStackParamList>();
const StaffStack = createNativeStackNavigator<StaffStackParamList>();
const FinanceStack = createNativeStackNavigator<FinanceStackParamList>();

// Shared header style
const screenOptions = {
  headerStyle: { backgroundColor: C.card },
  headerTintColor: C.text,
  headerTitleStyle: { fontWeight: "800" as const, fontSize: 16 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: C.bg },
};

// ---- DashboardTab Wrapper ----

function DashboardTabStack() {
  const { game } = useGameStore();
  return (
    <DashboardStack.Navigator screenOptions={screenOptions}>
      <DashboardStack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={{
          headerTitle: () => <DashboardHeader game={game} />,
        }}
      />
      <DashboardStack.Screen
        name="OpenStoreScreen"
        component={OpenStoreScreenWrapper}
        options={{ title: "Open Store", presentation: "modal" }}
      />
      <DashboardStack.Screen
        name="MenuLabScreen"
        component={MenuLabScreenWrapper}
        options={{ title: "Menu Lab", presentation: "modal" }}
      />
      <DashboardStack.Screen
        name="HireScreen"
        component={HireScreenWrapper}
        options={{ title: "Hire Staff", presentation: "modal" }}
      />
      <DashboardStack.Screen
        name="CampaignScreen"
        component={CampaignScreen}
        options={{ title: "Marketing" }}
      />
      <DashboardStack.Screen
        name="HQScreen"
        component={HQScreen}
        options={{ title: "Headquarters" }}
      />
    </DashboardStack.Navigator>
  );
}

// ---- StoresTab Wrapper ----

function StoresTabStack() {
  return (
    <StoresStack.Navigator screenOptions={screenOptions}>
      <StoresStack.Screen
        name="StoreListScreen"
        component={StoreListScreen}
        options={{ title: "Stores" }}
      />
      <StoresStack.Screen
        name="StoreDetailScreen"
        component={StoreDetailScreenWrapper}
        options={{ title: "Store Detail" }}
      />
      <StoresStack.Screen
        name="CitiesScreen"
        component={CitiesScreen}
        options={{ title: "Cities" }}
      />
    </StoresStack.Navigator>
  );
}

// ---- MenuTab Wrapper ----

function MenuTabStack() {
  return (
    <MenuStack.Navigator screenOptions={screenOptions}>
      <MenuStack.Screen
        name="MenuListScreen"
        component={MenuListScreen}
        options={{ title: "Menu" }}
      />
    </MenuStack.Navigator>
  );
}

// ---- StaffTab Wrapper ----

function StaffTabStack() {
  return (
    <StaffStack.Navigator screenOptions={screenOptions}>
      <StaffStack.Screen
        name="StaffListScreen"
        component={StaffListScreen}
        options={{ title: "Staff" }}
      />
    </StaffStack.Navigator>
  );
}

// ---- FinanceTab Wrapper ----

function FinanceTabStack() {
  return (
    <FinanceStack.Navigator screenOptions={screenOptions}>
      <FinanceStack.Screen
        name="FinanceScreen"
        component={FinanceScreen}
        options={{ title: "Finance" }}
      />
      <FinanceStack.Screen
        name="HistoryScreen"
        component={HistoryScreen}
        options={{ title: "Turn History" }}
      />
      <FinanceStack.Screen
        name="SupplierScreen"
        component={SupplierScreen}
        options={{ title: "Suppliers" }}
      />
    </FinanceStack.Navigator>
  );
}

// ---- Wrappers for modal screens (onClose = goBack) ----

import { useNavigation } from "@react-navigation/native";

function OpenStoreScreenWrapper() {
  const navigation = useNavigation();
  return <OpenStoreScreen onClose={() => navigation.goBack()} />;
}

function MenuLabScreenWrapper() {
  const navigation = useNavigation();
  return <MenuLabScreen onClose={() => navigation.goBack()} />;
}

function HireScreenWrapper() {
  const navigation = useNavigation();
  return <StaffScreen onClose={() => navigation.goBack()} />;
}

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

function StoreDetailScreenWrapper({ route }: NativeStackScreenProps<StoresStackParamList, "StoreDetailScreen">) {
  const navigation = useNavigation();
  const { game } = useGameStore();
  const { storeId } = route.params;

  // "__new__" は StoreListScreen 上部ボタンから呼ばれるケース — OpenStoreScreen を表示
  if (storeId === "__new__") {
    return <OpenStoreScreen onClose={() => navigation.goBack()} />;
  }

  const store = game.stores[storeId];
  if (!store) return null;
  return <StoreDetailScreen store={store} onClose={() => navigation.goBack()} />;
}

// ---- Dashboard Header (Company name + cash + week) ----

function DashboardHeader({ game }: { game: GameState }) {
  return (
    <View style={headerStyles.row}>
      <View style={headerStyles.avatarBox}>
        <Text style={headerStyles.avatarText}>BI</Text>
      </View>
      <View>
        <Text style={headerStyles.companyName}>Burger Inc.</Text>
        <Text style={headerStyles.cashSmall}>${game.finances.cash.toLocaleString()}</Text>
      </View>
      <View style={headerStyles.dateBadge}>
        <Text style={headerStyles.dateText}>Week {game.turn}</Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  companyName: { color: C.text, fontSize: 14, fontWeight: "800" },
  cashSmall: { color: C.green, fontSize: 12, fontWeight: "700" },
  dateBadge: { backgroundColor: C.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, marginLeft: 8 },
  dateText: { color: C.textDim, fontSize: 11, fontWeight: "700" },
});

// ---- Tab Icon Component ----

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TabIconProps {
  label: string;
  iconActive: IoniconsName;
  iconInactive: IoniconsName;
  focused: boolean;
}

function TabIcon({ label, iconActive, iconInactive, focused }: TabIconProps) {
  return (
    <View style={tabStyles.item}>
      <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxActive]}>
        <Ionicons
          name={focused ? iconActive : iconInactive}
          size={18}
          color={focused ? "#fff" : C.textMuted}
        />
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  item: { alignItems: "center", gap: 3 },
  iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  iconBoxActive: { backgroundColor: C.accent },
  label: { fontSize: 10, color: C.textMuted, fontWeight: "600" },
  labelActive: { color: C.accent, fontWeight: "700" },
});

// ---- Root Bottom Tab Navigator ----

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "web" ? 8 : 24,
          paddingTop: 8,
          height: Platform.OS === "web" ? 56 : 80,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardTabStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Dashboard" iconActive="home" iconInactive="home-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="StoresTab"
        component={StoresTabStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Stores" iconActive="storefront" iconInactive="storefront-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuTabStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Menu" iconActive="fast-food" iconInactive="fast-food-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="StaffTab"
        component={StaffTabStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Staff" iconActive="people" iconInactive="people-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="FinanceTab"
        component={FinanceTabStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Finance" iconActive="stats-chart" iconInactive="stats-chart-outline" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
