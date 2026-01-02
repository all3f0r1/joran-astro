# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JORAN is a full-stack web application for Belgium's first dedicated cider bar (cidrothèque) and online shop. Built with Astro 5.16.6 using server-side rendering on Cloudflare Workers, featuring a modern design with Irish/Breton cultural themes.

**Tech Stack:**
- Framework: Astro 5.16.6 (SSR mode)
- Styling: Tailwind CSS 4.1.18 via Vite plugin
- Deployment: Cloudflare Workers + D1 Database (serverless SQLite)
- Language: TypeScript with strict mode
- Package Manager: npm

## Essential Commands

### Development
```bash
npm run dev              # Start dev server at http://localhost:4321
npm run build            # Production build for Cloudflare
npm run preview          # Preview production build locally
npm run optimize-images  # Generate WebP images and responsive sizes
```

### Testing the Application
- Mobile menu: Resize browser to < 768px, test hamburger menu functionality
- Parallax sections: Scroll through home page to verify 4 parallax sections animate
- Shop filters: Visit /shop and test category/origin filters and sorting
- Responsive design: Test at 320px (mobile), 768px (tablet), 1200px+ (desktop)

## Architecture

### Output Mode: Server-Side Rendering
The application uses `output: 'server'` in astro.config.mjs, meaning all pages are rendered on Cloudflare's edge network. This enables:
- Dynamic API routes at `/api/*`
- Access to Cloudflare D1 database via `Astro.locals.runtime.env.DB`
- Server-side data fetching before page render

### Core Layout System
**File:** `src/layouts/Layout.astro`

This is the master template wrapping all pages. It defines:
- Global CSS variables for the entire design system (colors, spacing, fonts)
- Responsive utility classes
- Reusable button styles (.btn-primary, .btn-secondary)
- Celtic/Breton decorative classes (.celtic-border, .hermine-pattern)

**Design System Variables:**
```css
--color-primary: #1a3a5c     (Navy blue - headers, nav)
--color-secondary: #d4af37    (Gold - accents, buttons)
--color-accent: #8b0000       (Deep red - badges)
--color-hermine: #f8f9fa      (Off-white - backgrounds)

--spacing-xs to --spacing-xl  (0.5rem to 6rem scale)

--font-heading: 'Cinzel'      (Serif for titles)
--font-body: 'Lato'           (Sans-serif for content)
```

### Pages Architecture

#### Home Page (`src/pages/index.astro` - 1142 lines)
Complex single-page application with multiple interactive sections:

**Structure:**
1. Fixed navigation bar (hides on scroll down, reappears on scroll up)
2. Hero section with animated hermine icon
3. Four parallax divider sections (bottles, ambiance, galettes, terrasse)
4. Content sections: About, Events, Food, B2B/Webshop, Contact
5. Footer with social links

**Interactive Features (vanilla JavaScript):**
- Mobile hamburger menu with slide-in animation
- Intersection Observer for scroll-triggered fade-in animations
- Parallax background effects on scroll
- Smooth scrolling to anchor links
- Active navigation state based on scroll position
- Newsletter form submission

**Important:** All JavaScript is inline at the bottom of the file. When modifying, ensure event listeners are properly scoped.

#### Shop Page (`src/pages/shop.astro` - 905 lines)
E-commerce interface with client-side filtering:

**Features:**
- Product grid with 6 example products (hardcoded, ready for API integration)
- Real-time filters: category (Cidre Brut, Demi-Sec, Rosé, Poiré, Cidre de Glace), origin (Belgique, France, Bretagne, Québec)
- Sorting: by name, price ascending/descending
- Add-to-cart buttons with visual feedback (text → checkmark)
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

**To add products:** Edit the `products` array at the top of shop.astro (lines 5-70).

### Reusable Components

#### OptimizedImage (`src/components/OptimizedImage.astro`)
Advanced image component with performance optimizations:
- WebP format with JPEG/PNG fallback via `<picture>` element
- Responsive srcset support for multiple screen sizes
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
Decorative background patterns for Breton aesthetic:
- Three variants: "hermine", "celtic", "triskell"
- Configurable opacity and size
- Uses CSS patterns and SVG
- Non-blocking (pointer-events: none)

### API Routes

**Location:** `src/pages/api/`

All routes access Cloudflare D1 via `Astro.locals.runtime.env.DB`.

**Available Endpoints:**
- `GET /api/products` - Fetch products with query filters (country, cidery, price range, search)
- `GET /api/cideries` - List unique cidery names for filter dropdowns
- `POST /api/orders/index` - Create new order with line items
- `GET /api/orders/[id]` - Fetch order details
- `GET /api/products/[id]` - Get single product

**Database Pattern:**
All queries use SQL prepared statements with parameter binding for security:
```typescript
const db = Astro.locals.runtime.env.DB;
const { results } = await db.prepare(
  "SELECT * FROM products WHERE category = ?"
).bind(category).all();
```

### Image Optimization

**Script:** `scripts/optimize-images.js`

Automates responsive image generation using Sharp library:
- Converts source images to WebP format
- Generates 4 responsive sizes: 400w, 800w, 1200w, 1600w
- Outputs to `/public/images/optimized/`
- Configurable quality settings

**To optimize new images:**
1. Place source images in a designated input folder
2. Update paths in the script
3. Run `npm run optimize-images`

### Styling Approach

**Global Styles:** Defined in `Layout.astro` within `<style is:global>`
**Component Styles:** Each .astro file has scoped `<style>` blocks
**Tailwind CSS:** Applied via Vite plugin, purged in production builds

**Responsive Strategy:**
- Mobile-first design
- Primary breakpoint at 768px (tablet/desktop)
- Flexbox and CSS Grid for layouts
- `clamp()` function for fluid typography that scales with viewport

**Animation Classes:**
- `.fade-in` - Scroll-triggered fade-in (Intersection Observer)
- `.float` - Vertical bounce animation (used on hero icon)
- Hover effects use `transform` and `box-shadow` transitions

### Performance Considerations

**Implemented Optimizations:**
1. WebP images with lazy loading on non-critical content
2. Tailwind CSS purging removes unused styles in production
3. Vanilla JavaScript (no heavy framework overhead)
4. Font preconnect hints for Google Fonts
5. Intersection Observer for efficient scroll animations
6. Component-scoped CSS prevents style bloat

**To replace parallax images:**
In `index.astro`, search for `.parallax-bottles`, `.parallax-ambiance`, `.parallax-galettes`, `.parallax-terrasse` and update the `background-image` URLs (currently using Unsplash placeholders).

## Common Development Tasks

### Adding a New Page
1. Create `src/pages/your-page.astro`
2. Import `Layout` component: `import Layout from '../layouts/Layout.astro'`
3. Astro's file-based routing automatically creates the route

### Modifying Colors
Edit CSS variables in `src/layouts/Layout.astro` `:root` block. All components inherit these values.

### Extending the API
1. Create new file in `src/pages/api/` (e.g., `newsletter.ts`)
2. Export `GET` or `POST` function with `APIRoute` type
3. Access D1 database via `context.locals.runtime.env.DB`
4. Return `Response` object with JSON

### Customizing Parallax Sections
The 4 parallax sections in `index.astro` use CSS `background-attachment: fixed` on desktop and `scroll` on mobile (< 768px). Each section has:
- `.parallax-section` class for common styles
- Unique class for specific background image (`.parallax-bottles`, etc.)
- Dark overlay via `linear-gradient` for text contrast

## Project-Specific Notes

### Design Philosophy
The site emphasizes Breton/Irish cultural heritage through:
- Hermine pattern (Breton symbol)
- Celtic border decorations
- Traditional color palette (navy, gold, deep red)
- Typography: elegant serif (Cinzel) paired with modern sans-serif (Lato)

### Current State
According to git status:
- Base Astro project established
- Home page with parallax and mobile menu implemented
- Shop page with filtering implemented
- Components (OptimizedImage, BretonPattern) created
- Image optimization script ready
- Several files deleted from original template (VSCode configs, old images)

### Next Integration Steps (from README)
The README suggests these features are planned but not yet implemented:
- Backend API integration (currently products are hardcoded)
- Functional shopping cart with localStorage
- Payment gateway (Stripe/Mollie)
- Multi-language support (FR/NL/EN)
- Blog/news section
- Table reservation system

### Important File Locations
- Styling guide: `joran_styling_guide.md` (detailed design system reference)
- Quick start: `quick_start.md` (5-minute integration guide)
- Hermine SVG icon: `public/hermine.svg`
- Product images: `public/images/` (create subdirectories as needed)

## Deployment

**Target Platform:** Cloudflare Pages/Workers

The `@astrojs/cloudflare` adapter handles the build process:
- Generates worker script from SSR pages
- Bundles static assets
- Configures routing for file-based pages and API endpoints

**Build Output:** `dist/` directory (git-ignored)

Push to main branch → Cloudflare automatically deploys via Git integration (assumed based on Cloudflare adapter usage).
