-- JORAN Cidrothèque - Database Schema for Cloudflare D1
-- Apply with: wrangler d1 execute joran-production --file=schema.sql

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

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country);
CREATE INDEX IF NOT EXISTS idx_products_cidery ON products(cidery);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_method TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Table des items de commande
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Table des messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT 'unread' CHECK(status IN ('unread', 'read', 'replied', 'archived')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at);

-- Table pour les newsletters (optionnel)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT 1,
  subscribed_at TEXT DEFAULT (datetime('now')),
  unsubscribed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(active);

-- Données de test (optionnel)
INSERT OR IGNORE INTO products (id, name, cidery, country, category, price, description, active) VALUES
  (1, 'Cidre Brut Bio', 'Cidrerie du Verger', 'Belgique', 'Cidre Brut', 12.50, 'Cidre brut artisanal bio de Wallonie', 1),
  (2, 'Poiré Demi-Sec', 'Les Vergers de la Meuse', 'Belgique', 'Poiré', 14.00, 'Poiré doux et fruité', 1),
  (3, 'Cidre Rosé', 'Domaine de Kervéguen', 'Bretagne', 'Cidre Rosé', 15.50, 'Cidre rosé de Bretagne, notes de fruits rouges', 1),
  (4, 'Cidre de Glace', 'La Face Cachée de la Pomme', 'Québec', 'Cidre de Glace', 28.00, 'Cidre de glace du Québec, édition limitée', 1);
