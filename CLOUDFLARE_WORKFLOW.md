# Guide d'amélioration du workflow GitHub → Cloudflare Pages

Ce guide présente les meilleures pratiques pour un site business déployé sur Cloudflare Pages avec sécurité renforcée.

## 1. Configuration GitHub Actions (CI/CD)

### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npx astro check

      - name: Build
        run: npm run build
        env:
          # Variables d'environnement pour le build
          NODE_ENV: production

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=joran-cidrotheque

  optimize-images:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Optimize images
        run: npm run optimize-images

      - name: Upload optimized images to R2
        run: npx wrangler r2 object put joran-images/optimized --file=public/images/optimized --recursive
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### `.github/workflows/preview.yml`
```yaml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Deploy Preview
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=joran-cidrotheque --branch=preview-${{ github.event.pull_request.number }}

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed: https://preview-${{ github.event.pull_request.number }}.joran-cidrotheque.pages.dev'
            })
```

## 2. Configuration Cloudflare (wrangler.toml)

### `wrangler.toml`
```toml
name = "joran-cidrotheque"
compatibility_date = "2025-01-03"

# Pages configuration
pages_build_output_dir = "dist"

# Bindings pour D1 Database
[[d1_databases]]
binding = "DB"
database_name = "joran-production"
database_id = "your-database-id"
preview_database_id = "your-preview-database-id"

# Bindings pour KV (sessions, cache, etc.)
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-sessions-kv-id"
preview_id = "your-sessions-preview-kv-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-cache-kv-id"
preview_id = "your-cache-preview-kv-id"

# Bindings pour R2 (images)
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "joran-images"
preview_bucket_name = "joran-images-preview"

# Variables d'environnement
[vars]
ENVIRONMENT = "production"
SITE_URL = "https://joran-cidrotheque.be"
TURNSTILE_SITE_KEY = "your-public-turnstile-key"

# Secrets (à configurer via CLI ou dashboard)
# TURNSTILE_SECRET_KEY
# ADMIN_JWT_SECRET
# EMAIL_API_KEY

# Limites et configuration
[limits]
cpu_ms = 50

# Routes personnalisées (optionnel)
[[routes]]
pattern = "joran-cidrotheque.be/*"
custom_domain = true

[[routes]]
pattern = "www.joran-cidrotheque.be/*"
custom_domain = true
```

## 3. Sécurité : Headers HTTP

### `src/middleware.ts`
```typescript
import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const response = await next();

  // Security headers
  const headers = new Headers(response.headers);

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'SAMEORIGIN');

  // XSS Protection
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https://your-r2-bucket.r2.dev data:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ].join('; '));

  // HSTS (uniquement en HTTPS)
  if (context.url.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
```

## 4. Rate Limiting avec Workers

### `src/utils/rate-limiter.ts`
```typescript
export interface RateLimiterConfig {
  limit: number;          // Nombre de requêtes
  window: number;         // Fenêtre en secondes
  keyPrefix: string;
}

export class RateLimiter {
  constructor(
    private kv: KVNamespace,
    private config: RateLimiterConfig
  ) {}

  async check(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (this.config.window * 1000);

    // Récupérer les timestamps des requêtes
    const data = await this.kv.get<number[]>(key, 'json') || [];

    // Filtrer les requêtes dans la fenêtre de temps
    const validRequests = data.filter(timestamp => timestamp > windowStart);

    // Vérifier la limite
    if (validRequests.length >= this.config.limit) {
      const oldestRequest = Math.min(...validRequests);
      const resetAt = oldestRequest + (this.config.window * 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt
      };
    }

    // Ajouter la nouvelle requête
    validRequests.push(now);

    // Sauvegarder avec TTL
    await this.kv.put(key, JSON.stringify(validRequests), {
      expirationTtl: this.config.window
    });

    return {
      allowed: true,
      remaining: this.config.limit - validRequests.length,
      resetAt: now + (this.config.window * 1000)
    };
  }
}

// Utilisation dans une API route
export function createRateLimiter(kv: KVNamespace, type: 'api' | 'contact' | 'login') {
  const configs: Record<string, RateLimiterConfig> = {
    api: { limit: 100, window: 60, keyPrefix: 'rl:api' },
    contact: { limit: 3, window: 3600, keyPrefix: 'rl:contact' },
    login: { limit: 5, window: 900, keyPrefix: 'rl:login' }
  };

  return new RateLimiter(kv, configs[type]);
}
```

### Utilisation dans une API route
```typescript
import type { APIContext } from 'astro';
import { createRateLimiter } from '../../utils/rate-limiter';

export async function post({ request, locals, clientAddress }: APIContext) {
  const kv = locals.runtime.env.CACHE;

  // Rate limiting
  const limiter = createRateLimiter(kv, 'contact');
  const { allowed, remaining, resetAt } = await limiter.check(clientAddress);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        resetAt: new Date(resetAt).toISOString()
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  // Traitement de la requête...

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': '3',
      'X-RateLimit-Remaining': String(remaining)
    }
  });
}
```

## 5. Turnstile pour le formulaire de contact

### `src/pages/api/contact.ts`
```typescript
import type { APIContext } from 'astro';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: ip
    })
  });

  const data = await response.json<TurnstileResponse>();
  return data.success;
}

export async function post({ request, locals, clientAddress }: APIContext) {
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'Runtime not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.json();
    const { name, email, message, 'cf-turnstile-response': turnstileToken } = formData;

    // Vérifier Turnstile
    const turnstileValid = await verifyTurnstile(
      turnstileToken,
      runtime.env.TURNSTILE_SECRET_KEY,
      clientAddress
    );

    if (!turnstileValid) {
      return new Response(
        JSON.stringify({ error: 'Captcha verification failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const kv = runtime.env.CACHE;
    const limiter = createRateLimiter(kv, 'contact');
    const { allowed } = await limiter.check(clientAddress);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many contact requests. Try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validation des données
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sauvegarder dans D1
    const db = runtime.env.DB;
    await db.prepare(
      'INSERT INTO contact_messages (name, email, message, ip_address, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, email, message, clientAddress, new Date().toISOString()).run();

    // Envoyer email (optionnel, via Mailgun/SendGrid/etc.)
    // await sendEmail({ to: 'admin@joran.be', subject: 'New contact', ...formData });

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Formulaire HTML avec Turnstile
```astro
---
const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
---

<form id="contact-form">
  <input type="text" name="name" required placeholder="Nom" />
  <input type="email" name="email" required placeholder="Email" />
  <textarea name="message" required placeholder="Message"></textarea>

  <!-- Cloudflare Turnstile -->
  <div class="cf-turnstile"
       data-sitekey={turnstileSiteKey}
       data-theme="light">
  </div>

  <button type="submit">Envoyer</button>
</form>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<script>
  const form = document.getElementById('contact-form');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]')?.value;

    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      'cf-turnstile-response': turnstileResponse
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Message envoyé avec succès !');
        form.reset();
        // Reset Turnstile
        turnstile.reset();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      alert('Erreur réseau. Veuillez réessayer.');
    }
  });
</script>
```

## 6. Zero Trust pour l'admin

### Configuration Cloudflare Zero Trust Dashboard

1. **Créer une Access Application :**
   - Aller dans Zero Trust Dashboard
   - Access → Applications → Add an Application
   - Sélectionner "Self-hosted"
   - Application name: "JORAN Admin"
   - Session Duration: 24h
   - Application domain: `admin.joran-cidrotheque.be`

2. **Configurer les Access Policies :**
```
Policy Name: Admin Access
Action: Allow
Include: Emails ending in @joran-cidrotheque.be
```

3. **Ajouter des règles spécifiques :**
```
- Country: Belgium only
- IP ranges: Your office IP (optionnel)
- Require MFA: Yes
```

### Page admin protégée

```astro
---
// src/pages/admin/index.astro
import Layout from '../../layouts/Layout.astro';

// Vérification côté serveur du JWT Cloudflare Access
const accessToken = Astro.request.headers.get('Cf-Access-Jwt-Assertion');

if (!accessToken) {
  return Astro.redirect('/unauthorized');
}

// Optionnel: valider le JWT avec la clé publique Cloudflare
// const isValid = await validateCloudflarJwt(accessToken);
---

<Layout title="Admin - JORAN">
  <h1>Administration</h1>

  <nav>
    <a href="/admin/products">Gérer les produits</a>
    <a href="/admin/orders">Commandes</a>
    <a href="/admin/messages">Messages de contact</a>
  </nav>

  <div id="admin-content">
    <!-- Contenu admin -->
  </div>
</Layout>
```

## 7. Optimisation R2 pour les images

### Upload automatique vers R2

```typescript
// scripts/upload-to-r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadDirectory(localDir: string, r2Prefix: string) {
  const files = await readdir(localDir, { recursive: true });

  for (const file of files) {
    const filePath = join(localDir, file);
    const fileContent = await readFile(filePath);
    const ext = extname(file).toLowerCase();

    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    }[ext] || 'application/octet-stream';

    await r2.send(new PutObjectCommand({
      Bucket: 'joran-images',
      Key: `${r2Prefix}/${file}`,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    }));

    console.log(`✓ Uploaded: ${file}`);
  }
}

uploadDirectory('./public/images/optimized', 'products');
```

### Servir les images depuis R2

```typescript
// src/pages/api/images/[...path].ts
import type { APIContext } from 'astro';

export async function get({ params, locals }: APIContext) {
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response('Runtime not available', { status: 500 });
  }

  const r2 = runtime.env.IMAGES;
  const path = params.path;

  // Récupérer depuis R2
  const object = await r2.get(`products/${path}`);

  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': object.httpEtag
    }
  });
}
```

## 8. Configuration D1 Database

### Schema de base de données

```sql
-- schema.sql

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cidery TEXT NOT NULL,
  country TEXT NOT NULL,
  category TEXT,
  price REAL NOT NULL,
  description TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_country ON products(country);
CREATE INDEX idx_products_cidery ON products(cidery);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_method TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_email ON orders(customer_email);

-- Table des items de commande
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Table des messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT 'unread',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_contact_status ON contact_messages(status);

-- Table pour rate limiting (optionnel, peut être fait avec KV)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  reset_at TEXT NOT NULL
);
```

### Commandes pour gérer D1

```bash
# Créer la base de données
wrangler d1 create joran-production

# Appliquer le schema
wrangler d1 execute joran-production --file=schema.sql

# Insérer des données de test
wrangler d1 execute joran-production --command="INSERT INTO products (name, cidery, country, price) VALUES ('Cidre Brut', 'Cidrerie du Verger', 'Belgique', 12.50)"

# Query en local
wrangler d1 execute joran-production --local --command="SELECT * FROM products"

# Backup
wrangler d1 export joran-production --output=backup.sql
```

## 9. Variables d'environnement et Secrets

### Configuration des secrets Cloudflare

```bash
# Ajouter des secrets via CLI
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put ADMIN_JWT_SECRET
wrangler secret put EMAIL_API_KEY
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY

# Lister les secrets
wrangler secret list
```

### Fichier `.env` (local uniquement, ne pas commit)

```bash
# .env.local
PUBLIC_TURNSTILE_SITE_KEY=your-public-key
TURNSTILE_SECRET_KEY=your-secret-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

### Fichier `.env.example` (à commiter)

```bash
# .env.example
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

## 10. Monitoring et Logs

### Workers Analytics

Les Workers Analytics sont automatiquement disponibles dans le dashboard Cloudflare:
- Requêtes par seconde
- Temps de réponse
- Taux d'erreur
- Utilisation CPU

### Logging structuré

```typescript
// src/utils/logger.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  path?: string;
  [key: string]: any;
}

export class Logger {
  constructor(private context: LogContext = {}) {}

  private log(level: LogLevel, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data })
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any) {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack
    });
  }
}

// Utilisation
const logger = new Logger({ requestId: crypto.randomUUID() });
logger.info('Processing order', { orderId: 123 });
```

## 11. Checklist de déploiement

### Avant le premier déploiement

- [ ] Configurer Cloudflare Pages dans le dashboard
- [ ] Créer et configurer la base D1
- [ ] Créer les buckets R2 pour les images
- [ ] Créer les namespaces KV (sessions, cache)
- [ ] Configurer les DNS pour pointer vers Cloudflare
- [ ] Ajouter tous les secrets via `wrangler secret put`
- [ ] Configurer Zero Trust pour la zone admin
- [ ] Obtenir les clés Turnstile (site key + secret)
- [ ] Configurer GitHub Actions secrets

### Sécurité

- [ ] Headers de sécurité configurés (CSP, HSTS, etc.)
- [ ] Rate limiting activé sur toutes les API publiques
- [ ] Turnstile activé sur le formulaire de contact
- [ ] Zero Trust configuré pour `/admin/*`
- [ ] Validation des données côté serveur
- [ ] Protection CSRF (si formulaires POST)
- [ ] Logs de sécurité activés

### Performance

- [ ] Images optimisées et hébergées sur R2
- [ ] Cache configuré correctement
- [ ] Assets statiques avec max-age élevé
- [ ] Compression activée (Brotli/Gzip via Cloudflare)
- [ ] Lazy loading des images
- [ ] Minification CSS/JS

### Monitoring

- [ ] Cloudflare Analytics configuré
- [ ] Logs structurés en place
- [ ] Alertes configurées (optionnel)
- [ ] Backup automatique D1 (optionnel)

## 12. Améliorations avancées

### Cache Strategy avec KV

```typescript
// src/utils/cache.ts
export class Cache {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.kv.get(key, 'json');
    return cached as T | null;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl
    });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async remember<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);

    return value;
  }
}

// Utilisation
const cache = new Cache(locals.runtime.env.CACHE);

const products = await cache.remember(
  'products:all',
  async () => {
    const { results } = await db.prepare('SELECT * FROM products WHERE active = 1').all();
    return results;
  },
  300 // 5 minutes
);
```

### Protection DDOS additionnelle

Cloudflare offre déjà une excellente protection DDoS, mais vous pouvez ajouter:

```typescript
// Vérifier le score du bot Cloudflare
const botScore = request.headers.get('cf-bot-score');
if (botScore && parseInt(botScore) < 30) {
  return new Response('Suspected bot traffic', { status: 403 });
}

// Vérifier le pays (si vous servez uniquement la Belgique)
const country = request.headers.get('cf-ipcountry');
const allowedCountries = ['BE', 'NL', 'FR', 'LU'];
if (country && !allowedCountries.includes(country)) {
  return new Response('Service not available in your country', { status: 403 });
}
```

---

## Ressources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [R2 Storage](https://developers.cloudflare.com/r2/)
- [Zero Trust](https://developers.cloudflare.com/cloudflare-one/)
- [Turnstile](https://developers.cloudflare.com/turnstile/)
- [Astro SSR avec Cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
