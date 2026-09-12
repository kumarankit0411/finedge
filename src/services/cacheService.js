class CacheService {
    constructor(ttlMs) {
        this.ttlMs = ttlMs;
        this.cache = new Map();
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.createdAt > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    set(key, value) {
        this.cache.set(key, { value, createdAt: Date.now() });
    }

    clear() {
        this.cache.clear();
    }
}
  
module.exports = CacheService;