import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // silently fail
  }
}
