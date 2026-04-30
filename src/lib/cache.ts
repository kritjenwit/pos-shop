interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

const CACHE_PREFIX = 'pos-shop-cache-';

export function getCacheDuration(): number {
  const duration = import.meta.env.VITE_CACHE_DURATION_HOURS;
  const hours = duration ? parseFloat(duration) : 1;
  return hours * 60 * 60 * 1000;
}

export function setCache<T>(key: string, data: T): void {
  const duration = getCacheDuration();
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + duration,
  };
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

export function getCache<T>(key: string): T | null {
  const raw = localStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;

  try {
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
}

export function invalidateCache(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key);
}

export function invalidateAllCache(): void {
  Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}

export function isCacheValid(key: string): boolean {
  const raw = localStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return false;

  try {
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    return Date.now() <= entry.expiry;
  } catch {
    return false;
  }
}
