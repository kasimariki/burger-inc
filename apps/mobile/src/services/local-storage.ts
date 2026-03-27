import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from '../game/models/types';

const SAVE_KEY = 'burger-inc-save';

export async function saveLocal(game: GameState): Promise<void> {
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

export async function loadLocal(): Promise<GameState | null> {
  const data = await AsyncStorage.getItem(SAVE_KEY);
  return data ? JSON.parse(data) : null;
}

export async function clearLocal(): Promise<void> {
  await AsyncStorage.removeItem(SAVE_KEY);
}
