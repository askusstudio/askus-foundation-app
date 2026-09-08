import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@askus_cache_';

export const setLocalCache = async <T>(
  key: string,
  data: T,
  ttlMinutes = 60
): Promise<void> => {
  const record = {
    data,
    expiry: Date.now() + ttlMinutes * 60 * 1000,
  };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(record));
};

export const getLocalCache = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const record = JSON.parse(raw);
    if (Date.now() > record.expiry) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return record.data as T;
  } catch {
    return null;
  }
};
