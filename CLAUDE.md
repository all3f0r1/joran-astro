# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JORAN is a full-stack web application for Belgium's first dedicated cider bar (cidrothèque) and online shop. Built with Astro 5.16.6 using server-side rendering on Cloudflare Workers.

**Tech Stack:**
- Framework: Astro 5.16.6 (SSR mode on Cloudflare Workers)
- Styling: Tailwind CSS 4.1.18 via Vite plugin
- Database: Cloudflare D1 (serverless SQLite)
- Storage: Cloudflare R2 (for images), KV (for sessions/cache)
- Language: TypeScript
- Package Manager: npm

## Essential Commands

```bash
npm run dev              # Start dev server at http://localhost:4321
npm run build            # Production build for Cloudflare
npm run preview          # Preview production build locally
npm run optimize-images  # Generate WebP images and responsive sizes
npx astro check          # Type check (runs in CI)

# Cloudflare D1 database commands
wrangler d1 execute joran-production --file=schema.sql                    # Apply schema
wrangler d1 execute joran-production --command="SELECT * FROM products"   # Run query
wrangler d1 execute joran-production --local --command="..."              # Local development

# Cloudflare secrets management
wrangler secret put SECRET_NAME      # Add a secret
wrangler secret list                 # List all secrets
```

## Architecture

### Cloudflare Runtime Access Pattern

**CRITICAL:** All Cloudflare bindings (D1, KV, R2) are accessed via `locals.runtime.env`, NOT `Astro.env`.

**Always use this pattern in API routes and server-side code:**
```typescript
import type { APIContext } from 'astro';

export async function get({ locals }: APIContext) {
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'Runtime not available' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  const db = runtime.env.DB;           // D1 Database
  const kv = runtime.env.CACHE;        // KV namespace for cache
  const sessions = runtime.env.SESSIONS; // KV namespace for sessions
  const r2 = runtime.env.IMAGES;       // R2 bucket for images

  // Use prepared statements with parameter binding for security
  const { results } = await db.prepare('SELECT * FROM products WHERE id = ?')
    .bind(productId)
    .all();

  return new Response(JSON.stringify(results), {
    headers: { 'content-type': 'application/json' }
  });
}
```

**Key points:**
- API route exports must use lowercase function names (`get`, `post`, not `GET`, `POST`)
- Always check `locals.runtime` existence before accessing bindings
- Use prepared statements with `.bind()` for SQL injection protection
- Return `Response` objects with proper content-type headers

### Utilities: Cache and Rate Limiting

**Cache utility (`src/utils/cache.ts`)** - Wrapper for KV-based caching:
```typescript
import { Cache, cacheKeys } from '../utils/cache';

const cache = new Cache(runtime.env.CACHE);

// Pattern 1: remember() - fetch from cache or execute callback
const products = await cache.remember(
  cacheKeys.products.all(),
  async () => {
    const { results } = await db.prepare('SELECT * FROM products').all();
    return results;
  },
  300 // TTL in seconds
);

// Pattern 2: Manual cache operations
await cache.set('key', value, 3600);
const value = await cache.get<Product>('key');
await cache.invalidateByPrefix('products:'); // Invalidate all product caches
```

**Rate limiter (`src/utils/rate-limiter.ts`)** - KV-based rate limiting:
```typescript
import { createRateLimiter } from '../utils/rate-limiter';

export async function post({ locals, clientAddress }: APIContext) {
  const limiter = createRateLimiter(locals.runtime.env.CACHE, 'contact');
  const { allowed, remaining, resetAt, retryAfter } = await limiter.check(clientAddress);

  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'Content-Type': 'application/json'
      }
    });
  }
  // Process request...
}
```

**Predefined rate limit types:** `api`, `contact`, `login`, `newsletter`, `order`

### Database Schema

See `schema.sql` for the complete schema. Key tables:

**products:** Core product catalog (name, cidery, country, category, price, description, image_url, stock, active)
**orders:** Customer orders (customer info, delivery details, total_amount, status, payment_status)
**order_items:** Line items for orders (order_id, product_id, quantity, unit_price)
**contact_messages:** Form submissions (name, email, message, ip_address, status)
**newsletter_subscribers:** Email signups (email, name, active, subscribed_at)

### Design System and Styling

**Three-layer styling system:**
1. Global CSS variables in `src/layouts/Layout.astro` (colors, spacing, fonts - single source of truth)
2. Component-scoped styles in individual `.astro` files
3. Tailwind CSS via Vite plugin (purged in production)

**Key CSS variables to modify the theme:**
```css
--color-primary: #1a3a5c      /* Navy blue */
--color-secondary: #d4af37     /* Gold */
--color-accent: #8b0000        /* Deep red */
--spacing-xs to --spacing-xl   /* 0.5rem to 6rem scale */
--font-heading: 'Cinzel'       /* Serif for titles */
--font-body: 'Lato'            /* Sans-serif for body text */
```

**Responsive:** Mobile-first, primary breakpoint at 768px. Use flexbox/grid for layouts, `clamp()` for fluid typography.

### Key Components

**OptimizedImage** (`src/components/OptimizedImage.astro`) - Performance-optimized images with WebP fallback, srcset, lazy loading, shimmer effect
**BretonPattern** (`src/components/BretonPattern.astro`) - Decorative background patterns: "hermine", "celtic", "triskell"

## Page Architecture

**Home page** (`src/pages/index.astro`) - Single-page application with:
- Vanilla JS for all interactions (hamburger menu, Intersection Observer animations, parallax, smooth scroll, active nav states)
- Four parallax divider sections between content blocks (bottles, ambiance, galettes, terrasse)
- To update parallax images: Search for `.parallax-bottles`, `.parallax-ambiance`, etc. and update `background-image` URLs

**Shop page** (`src/pages/shop.astro`) - E-commerce interface with:
- Client-side filtering (category, origin) and sorting (name, price)
- Hardcoded product array at top of file - edit this to add/modify products
- Product structure: `{ id, name, producer, price, category, origin, image, description }`

## Deployment

**Platform:** Cloudflare Pages/Workers (configured in `wrangler.toml`)

**GitHub Actions CI/CD** (`.github/workflows/deploy.yml`):
- Runs type check (`npx astro check`) and build on all PRs
- Deploys to Cloudflare Pages on push to main
- Uses secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

**Cloudflare bindings** (in `wrangler.toml`):
- D1 Database: `DB` binding → `joran-production` database
- KV Namespaces: `SESSIONS`, `CACHE`
- R2 Bucket: `IMAGES` → `joran-images` bucket

**Environment variables:**
- Public: `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_SITE_URL` (use `import.meta.env.PUBLIC_*` in .astro files)
- Secrets: Set via `wrangler secret put` (TURNSTILE_SECRET_KEY, ADMIN_JWT_SECRET, EMAIL_API_KEY)

## Additional Resources

**Documentation files:**
- `CLOUDFLARE_WORKFLOW.md` - Comprehensive guide for Cloudflare deployment, security headers, rate limiting, Turnstile CAPTCHA, Zero Trust admin, R2 image serving
- `schema.sql` - Complete D1 database schema with indexes and sample data
- `.env.example` - Template for required environment variables
