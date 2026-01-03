# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JORAN is a full-stack web application for Belgium's first dedicated cider bar (cidrothèque) and online shop. Built with Astro 5.16.6 using server-side rendering on Cloudflare Workers, featuring a modern design with Irish/Breton cultural themes.

**Tech Stack:**
- Framework: Astro 5.16.6 (SSR mode)
- Styling: Tailwind CSS 4.1.18 via Vite plugin
- Deployment: Cloudflare Workers + D1 Database (serverless SQLite)
- Language: TypeScript
- Package Manager: npm

## Essential Commands

```bash
npm run dev              # Start dev server at http://localhost:4321
npm run build            # Production build for Cloudflare
npm run preview          # Preview production build locally
npm run optimize-images  # Generate WebP images and responsive sizes
```

## Architecture

### Server-Side Rendering (SSR)
The application uses `output: 'server'` in astro.config.mjs, meaning all pages are rendered on Cloudflare's edge network. This enables:
- Dynamic API routes at `/api/*`
- Access to Cloudflare D1 database via `Astro.locals.runtime.env.DB`
- Server-side data fetching before page render

**Critical:** The Cloudflare runtime is accessed via `locals.runtime.env.DB`, not `Astro.env`. Always check for runtime availability before accessing the database.

### Layout System
`src/layouts/Layout.astro` is the master template wrapping all pages. It defines:
- Global CSS variables (colors, spacing, fonts) - the single source of truth for the design system
- Responsive utility classes
- Reusable button styles (`.btn-primary`, `.btn-secondary`)
- Celtic/Breton decorative classes (`.celtic-border`, `.hermine-pattern`)

**Design System Variables:**
```css
--color-primary: #1a3a5c     /* Navy blue */
--color-secondary: #d4af37    /* Gold */
--color-accent: #8b0000       /* Deep red */
--color-hermine: #f8f9fa      /* Off-white */

--spacing-xs to --spacing-xl  /* 0.5rem to 6rem scale */

--font-heading: 'Cinzel'      /* Serif for titles */
--font-body: 'Lato'           /* Sans-serif for content */
```

To modify the design system, edit these variables in `Layout.astro` - all components inherit them.

### Pages Architecture

#### Home Page (`src/pages/index.astro` - ~1247 lines)
Single-page application with multiple interactive sections:

**Structure:**
1. Fixed navigation bar (hides on scroll down, reappears on scroll up)
2. Hero section with animated hermine icon
3. Four parallax divider sections (bottles, ambiance, galettes, terrasse)
4. Content sections: About, Events, Food, B2B/Webshop, Contact
5. Footer with social links

**Interactive Features:**
All functionality implemented in vanilla JavaScript (inline at bottom of file):
- Mobile hamburger menu with slide-in animation
- Intersection Observer for scroll-triggered fade-in animations
- Parallax background effects on scroll (CSS `background-attachment: fixed` on desktop, `scroll` on mobile)
- Smooth scrolling to anchor links
- Active navigation state based on scroll position
- Newsletter form submission

**Parallax images:** Search for `.parallax-bottles`, `.parallax-ambiance`, `.parallax-galettes`, `.parallax-terrasse` and update the `background-image` URLs.

#### Shop Page (`src/pages/shop.astro` - ~987 lines)
E-commerce interface with client-side filtering and sorting:

**Features:**
- Product grid with 6 example products (hardcoded in `products` array at top of file)
- Real-time filters: category, origin
- Sorting: name, price ascending/descending
- Add-to-cart buttons with visual feedback
- Empty state when no products match filters

**Product Data Structure:**
```typescript
{
  id: number
  name: string
  producer: string
  price: number
  category: string  // Must match filter options
  origin: string    // Must match filter options
  image: string     // Path to /public/images/
  description: string
}
```

To add products: Edit the `products` array at the top of shop.astro. The filters and sorting work dynamically with any products added.

### API Routes

**Location:** `src/pages/api/`

**Critical pattern:** All API routes must:
1. Check for `locals.runtime` availability before accessing the database
2. Export lowercase HTTP method functions (`get`, `post`, not `GET`, `POST`)
3. Use prepared statements with parameter binding for security
4. Return `Response` objects with proper JSON content-type headers

**Example pattern:**
```typescript
import type { APIContext } from 'astro';

export async function get({ request, locals }: APIContext) {
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(
      JSON.stringify({ error: 'Runtime not available' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
  const db = runtime.env.DB;

  const { results } = await db.prepare(
    "SELECT * FROM products WHERE category = ?"
  ).bind(category).all();

  return new Response(JSON.stringify(results), {
    headers: { 'content-type': 'application/json' },
  });
}
```

**Available endpoints:**
- `GET /api/products` - Fetch products with query filters (country, cidery, price range, search)
- `GET /api/cideries` - List unique cidery names for filter dropdowns
- `GET /api/countries` - List unique countries
- `POST /api/orders/index` - Create new order with line items (calculates total server-side)
- `GET /api/orders/[id]` - Fetch order details
- `GET /api/products/[id]` - Get single product

### Components

#### OptimizedImage (`src/components/OptimizedImage.astro`)
Performance-optimized image component with:
- WebP format with JPEG/PNG fallback via `<picture>` element
- Responsive srcset support
- Lazy loading with native `loading="lazy"`
- Shimmer animation during load
- Fade-in effect on complete

**Usage:**
```astro
<OptimizedImage
  src="/images/photo.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  objectFit="cover"
/>
```

#### BretonPattern (`src/components/BretonPattern.astro`)
Decorative background patterns with three variants: "hermine", "celtic", "triskell". Configurable opacity and size. Uses CSS patterns and SVG with `pointer-events: none`.

### Image Optimization Script

**File:** `scripts/optimize-images.js`

Automated image pipeline using Sharp:
- Converts images to WebP format
- Generates 4 responsive sizes: 400w, 800w, 1200w, 1600w
- Outputs to `/public/images/optimized/`
- Processes all JPG/PNG files in `/public/images/`

**Usage:**
1. Place source images in `public/images/`
2. Run `npm run optimize-images`
3. Images appear in `public/images/optimized/`

### Styling Approach

**Three-layer system:**
1. **Global styles** - `Layout.astro` `<style is:global>` block
2. **Component styles** - Scoped `<style>` blocks in each .astro file
3. **Tailwind CSS** - Applied via Vite plugin, purged in production

**Responsive strategy:**
- Mobile-first design
- Primary breakpoint at 768px (tablet/desktop)
- Flexbox and CSS Grid for layouts
- `clamp()` for fluid typography

**Key animation classes:**
- `.fade-in` - Scroll-triggered fade-in (Intersection Observer)
- `.float` - Vertical bounce animation
- Hover effects use `transform` and `box-shadow` transitions

### Database Schema (Inferred)

Based on API routes, the D1 database has these tables:

**products:**
- `id` (primary key)
- `name`
- `cidery` (producer name)
- `country`
- `price` (number)
- `description`
- `category` (optional, based on shop filters)

**orders:**
- `id` (auto-increment primary key)
- `customer_name`
- `customer_email`
- `customer_phone`
- `delivery_address`
- `delivery_method`
- `total_amount`
- `notes`
- `created_at` (likely)

**order_items:**
- `id` (primary key)
- `order_id` (foreign key)
- `product_id` (foreign key)
- `quantity`
- `unit_price`

## Development Workflow

### Testing checklist
- Mobile menu: Resize browser to < 768px, test hamburger menu
- Parallax sections: Scroll through home page to verify animations
- Shop filters: Visit /shop and test category/origin filters and sorting
- Responsive design: Test at 320px (mobile), 768px (tablet), 1200px+ (desktop)

### File locations
- Design system reference: `joran_styling_guide.md`
- Quick integration guide: `quick_start.md`
- Hermine SVG icon: `public/hermine.svg`
- Product images: `public/images/` (create subdirectories as needed)

### Deployment

Target platform: Cloudflare Pages/Workers

The `@astrojs/cloudflare` adapter (configured in astro.config.mjs) handles:
- Worker script generation from SSR pages
- Static asset bundling
- Routing configuration for file-based pages and API endpoints

Build output goes to `dist/` (git-ignored).
