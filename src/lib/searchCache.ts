interface CachedSearch {
  results: any[];
  searchAnalysis: any;
  newProvidersFound: number;
  timestamp: number;
  query: string;
  location: string;
}

const CACHE_KEY = 'kidfun_search_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const searchCache = {
  get: (query: string, location: string): CachedSearch | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedSearch = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // Check if query and location match (case insensitive, normalized)
      const normalizeStr = (str: string) => str.toLowerCase().trim();
      if (
        normalizeStr(data.query) === normalizeStr(query) &&
        normalizeStr(data.location) === normalizeStr(location)
      ) {
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  set: (query: string, location: string, results: any[], searchAnalysis: any, newProvidersFound: number) => {
    try {
      const data: CachedSearch = {
        results,
        searchAnalysis,
        newProvidersFound,
        timestamp: Date.now(),
        query,
        location
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
};
