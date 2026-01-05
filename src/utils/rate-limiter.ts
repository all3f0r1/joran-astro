/**
 * Rate Limiter pour Cloudflare Workers avec KV
 *
 * Usage:
 * const limiter = createRateLimiter(locals.runtime.env.CACHE, 'contact');
 * const { allowed } = await limiter.check(clientAddress);
 */

export interface RateLimiterConfig {
  limit: number;          // Nombre de requêtes autorisées
  window: number;         // Fenêtre de temps en secondes
  keyPrefix: string;      // Préfixe pour les clés KV
}

export class RateLimiter {
  constructor(
    private kv: KVNamespace,
    private config: RateLimiterConfig
  ) {}

  async check(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  }> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (this.config.window * 1000);

    // Récupérer les timestamps des requêtes existantes
    const data = await this.kv.get<number[]>(key, 'json') || [];

    // Filtrer uniquement les requêtes dans la fenêtre de temps actuelle
    const validRequests = data.filter(timestamp => timestamp > windowStart);

    // Vérifier si la limite est dépassée
    if (validRequests.length >= this.config.limit) {
      const oldestRequest = Math.min(...validRequests);
      const resetAt = oldestRequest + (this.config.window * 1000);
      const retryAfter = Math.ceil((resetAt - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter
      };
    }

    // Ajouter la nouvelle requête
    validRequests.push(now);

    // Sauvegarder dans KV avec TTL
    await this.kv.put(key, JSON.stringify(validRequests), {
      expirationTtl: this.config.window
    });

    return {
      allowed: true,
      remaining: this.config.limit - validRequests.length,
      resetAt: now + (this.config.window * 1000)
    };
  }

  async reset(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    await this.kv.delete(key);
  }
}

// Configurations prédéfinies
const RATE_LIMIT_CONFIGS: Record<string, RateLimiterConfig> = {
  // API générale: 100 requêtes par minute
  api: {
    limit: 100,
    window: 60,
    keyPrefix: 'rl:api'
  },

  // Formulaire de contact: 3 messages par heure
  contact: {
    limit: 3,
    window: 3600,
    keyPrefix: 'rl:contact'
  },

  // Login: 5 tentatives par 15 minutes
  login: {
    limit: 5,
    window: 900,
    keyPrefix: 'rl:login'
  },

  // Newsletter: 1 inscription par jour par IP
  newsletter: {
    limit: 1,
    window: 86400,
    keyPrefix: 'rl:newsletter'
  },

  // Création de commande: 10 par heure
  order: {
    limit: 10,
    window: 3600,
    keyPrefix: 'rl:order'
  }
};

/**
 * Factory function pour créer un rate limiter
 */
export function createRateLimiter(
  kv: KVNamespace,
  type: keyof typeof RATE_LIMIT_CONFIGS
): RateLimiter {
  const config = RATE_LIMIT_CONFIGS[type];
  if (!config) {
    throw new Error(`Unknown rate limiter type: ${type}`);
  }
  return new RateLimiter(kv, config);
}
