/**
 * Cache utility pour Cloudflare KV
 *
 * Usage:
 * const cache = new Cache(locals.runtime.env.CACHE);
 * const data = await cache.remember('key', () => fetchData(), 300);
 */

export class Cache {
  constructor(private kv: KVNamespace) {}

  /**
   * Récupérer une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.kv.get(key, 'json');
    return cached as T | null;
  }

  /**
   * Sauvegarder une valeur dans le cache
   */
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl
    });
  }

  /**
   * Supprimer une valeur du cache
   */
  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  /**
   * Invalider plusieurs clés par préfixe
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    const { keys } = await this.kv.list({ prefix });
    await Promise.all(keys.map(key => this.kv.delete(key.name)));
  }

  /**
   * Pattern "remember": récupère du cache ou exécute le callback
   */
  async remember<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Si pas en cache, exécuter le callback
    const value = await callback();

    // Sauvegarder dans le cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Pattern "remember forever" (TTL très long)
   */
  async rememberForever<T>(
    key: string,
    callback: () => Promise<T>
  ): Promise<T> {
    return this.remember(key, callback, 31536000); // 1 an
  }
}

/**
 * Helper pour créer des clés de cache structurées
 */
export const cacheKeys = {
  products: {
    all: () => 'products:all',
    byId: (id: number) => `products:${id}`,
    byCategory: (category: string) => `products:category:${category}`,
    byCountry: (country: string) => `products:country:${country}`
  },

  orders: {
    byId: (id: number) => `orders:${id}`,
    recent: () => 'orders:recent'
  },

  stats: {
    daily: (date: string) => `stats:daily:${date}`,
    monthly: (month: string) => `stats:monthly:${month}`
  }
};
