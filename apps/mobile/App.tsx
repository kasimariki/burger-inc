import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import TabNavigator from "./src/navigation/TabNavigator";
import { useGameStore } from "./src/store/gameStore";

export default function App() {
  const initAuth = useGameStore((s) => s.initAuth);
  const load = useGameStore((s) => s.load);

  useEffect(() => {
    // 起動時に認証初期化 → ゲームデータ読み込み
    initAuth().then(() => load()).catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
