import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'rotiseria.db');

// Ensure data folder exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Global sqlite singleton for Next.js hot reload
const globalForDb = global as unknown as { db?: Database.Database };

export const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

// Initialize tables & seed data
export function initDb() {
  db.pragma('journal_mode = WAL');

  // Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'Utensils',
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      unit_type TEXT NOT NULL CHECK(unit_type IN ('unidad', 'kilo', 'porcion')),
      available INTEGER DEFAULT 1,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS cash_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      initial_cash REAL NOT NULL DEFAULT 0,
      final_cash_expected REAL,
      final_cash_counted REAL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'abierta' CHECK(status IN ('abierta', 'cerrada'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number INTEGER NOT NULL,
      order_type TEXT NOT NULL CHECK(order_type IN ('mostrador', 'delivery', 'retiro')),
      customer_name TEXT,
      customer_phone TEXT,
      delivery_address TEXT,
      delivery_notes TEXT,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('efectivo', 'mercadopago', 'tarjeta', 'combinado')),
      payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK(payment_status IN ('pendiente', 'pagado')),
      kitchen_status TEXT NOT NULL DEFAULT 'pendiente' CHECK(kitchen_status IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
      total_amount REAL NOT NULL,
      cash_paid REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      notes TEXT,
      cash_shift_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cash_shift_id) REFERENCES cash_shifts(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity REAL NOT NULL,
      unit_type TEXT NOT NULL,
      subtotal REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cash_shift_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ingreso', 'egreso')),
      amount REAL NOT NULL,
      concept TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cash_shift_id) REFERENCES cash_shifts(id)
    );
  `);

  // Ensure image_url column exists in products table
  try {
    db.exec(`ALTER TABLE products ADD COLUMN image_url TEXT;`);
  } catch (e) {
    // Column already exists
  }

  // Check if categories already exist, if not seed data
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    seedInitialData();
  } else {
    // Populate missing image_urls for existing products
    populateDefaultImages();
  }

  // Ensure active cash shift exists if none exists
  const activeShift = db.prepare("SELECT * FROM cash_shifts WHERE status = 'abierta'").get();
  if (!activeShift) {
    db.prepare("INSERT INTO cash_shifts (initial_cash, status) VALUES (?, 'abierta')").run(15000);
  }
}

function populateDefaultImages() {
  const defaultImages: Record<string, string> = {
    'Pollo al Spiedo / Horno': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=80',
    '1/2 Pollo al Spiedo': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&auto=format&fit=crop&q=80',
    'Pastel de Papas': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    'Canelones de Verdura y Ricota': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80',
    'Lasaña Rellena de Carne y Jamón': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&auto=format&fit=crop&q=80',
    'Matambre Arrollado de Pollo': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    'Vitel Toné': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    'Empanada Carne Cortada a Cuchillo': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
    'Empanada Jamón y Queso': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
    'Empanada de Pollo': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
    'Pizza Muzzarella': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
    'Pizza Especial de Jamón y Morrones': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
    'Fugazzeta Rellena': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
    'Milanesa de Ternera a la Napolitana': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=80',
    'Milanesa de Pollo Suprema': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
    'Papas Fritas Provenzal': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=80',
    'Tortilla de Papas y Cebolla': 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&auto=format&fit=crop&q=80',
    'Ensalada Rusa / Mixta': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80',
    'Coca-Cola 1.5L': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
    'Sprite 1.5L': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500&auto=format&fit=crop&q=80',
    'Agua Mineral 500ml': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
    'Cerveza Quilmes / Brahma 1L': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&auto=format&fit=crop&q=80',
    'Flan Casero con Dulce de Leche': 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500&auto=format&fit=crop&q=80',
    'Budín de Pan': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
    'Queso y Dulce (Vigilante)': 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500&auto=format&fit=crop&q=80',
  };

  const updateStmt = db.prepare("UPDATE products SET image_url = ? WHERE name = ? AND (image_url IS NULL OR image_url = '')");
  Object.entries(defaultImages).forEach(([name, imgUrl]) => {
    updateStmt.run(imgUrl, name);
  });
}

function seedInitialData() {
  const insertCategory = db.prepare('INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)');
  const insertProduct = db.prepare('INSERT INTO products (category_id, name, description, price, unit_type, available, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');

  const categories = [
    { name: 'Platos Elaborados', icon: 'Utensils', order: 1 },
    { name: 'Pizzas y Empanadas', icon: 'Pizza', order: 2 },
    { name: 'Minutas y Guarniciones', icon: 'Flame', order: 3 },
    { name: 'Bebidas', icon: 'Beer', order: 4 },
    { name: 'Postres', icon: 'IceCream', order: 5 },
  ];

  const catMap: Record<string, number> = {};

  categories.forEach((cat) => {
    const info = insertCategory.run(cat.name, cat.icon, cat.order);
    catMap[cat.name] = info.lastInsertRowid as number;
  });

  const products = [
    { cat: 'Platos Elaborados', name: 'Pollo al Spiedo / Horno', desc: 'Con chimichurri casero (unidad entera)', price: 14500, type: 'unidad', img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Platos Elaborados', name: '1/2 Pollo al Spiedo', desc: 'Con guarnición a elección', price: 7800, type: 'unidad', img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Platos Elaborados', name: 'Pastel de Papas', desc: 'Carne seleccionada, huevo y aceitunas', price: 6500, type: 'porcion', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Platos Elaborados', name: 'Canelones de Verdura y Ricota', desc: 'Con salsa mixta (fileto + blanca)', price: 6200, type: 'porcion', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Platos Elaborados', name: 'Lasaña Rellena de Carne y Jamón', desc: 'Gratinada con queso mozzarella', price: 7000, type: 'porcion', img: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Platos Elaborados', name: 'Matambre Arrollado de Pollo', desc: 'Venta por peso', price: 18000, type: 'kilo', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Platos Elaborados', name: 'Vitel Toné', desc: 'Peceto tierno con salsa tradicional', price: 22000, type: 'kilo', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80' },

    { cat: 'Pizzas y Empanadas', name: 'Empanada Carne Cortada a Cuchillo', desc: 'Jugosa con condimentos criollos', price: 1200, type: 'unidad', img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Pizzas y Empanadas', name: 'Empanada Jamón y Queso', desc: 'Queso dardo y jamón cocido', price: 1100, type: 'unidad', img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Pizzas y Empanadas', name: 'Empanada de Pollo', desc: 'Pechuga desmenuzada con verduras', price: 1100, type: 'unidad', img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Pizzas y Empanadas', name: 'Pizza Muzzarella', desc: 'Salsa casera, muzzarella y aceitunas', price: 8500, type: 'unidad', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Pizzas y Empanadas', name: 'Pizza Especial de Jamón y Morrones', desc: 'Muzzarella, jamón, morrón y orégano', price: 10500, type: 'unidad', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Pizzas y Empanadas', name: 'Fugazzeta Rellena', desc: 'Rellena de muzzarella y cebolla dorada', price: 12000, type: 'unidad', img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80' },

    { cat: 'Minutas y Guarniciones', name: 'Milanesa de Ternera a la Napolitana', desc: 'Con salsa, queso y jamón', price: 7500, type: 'porcion', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Minutas y Guarniciones', name: 'Milanesa de Pollo Suprema', desc: 'Gigante con limón', price: 6500, type: 'porcion', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Minutas y Guarniciones', name: 'Papas Fritas Provenzal', desc: 'Porción grande para compartir', price: 4200, type: 'porcion', img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Minutas y Guarniciones', name: 'Tortilla de Papas y Cebolla', desc: 'Estilo español alta y babé', price: 5800, type: 'unidad', img: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Minutas y Guarniciones', name: 'Ensalada Rusa / Mixta', desc: 'Papa, zanahoria, arvejas y mayonesa', price: 3800, type: 'porcion', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80' },

    { cat: 'Bebidas', name: 'Coca-Cola 1.5L', desc: 'Original / Zero', price: 3200, type: 'unidad', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Bebidas', name: 'Sprite 1.5L', desc: 'Lima-limón', price: 3000, type: 'unidad', img: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Bebidas', name: 'Agua Mineral 500ml', desc: 'Con o sin gas', price: 1500, type: 'unidad', img: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Bebidas', name: 'Cerveza Quilmes / Brahma 1L', desc: 'Retornable fría', price: 3500, type: 'unidad', img: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&auto=format&fit=crop&q=80' },

    { cat: 'Postres', name: 'Flan Casero con Dulce de Leche', desc: 'Con crema o dulce de leche', price: 2800, type: 'porcion', img: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Postres', name: 'Budín de Pan', desc: 'Receta de la abuela con pasas', price: 2500, type: 'porcion', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80' },
    { cat: 'Postres', name: 'Queso y Dulce (Vigilante)', desc: 'Queso fresco con dulce de batata o membrillo', price: 2600, type: 'porcion', img: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500&auto=format&fit=crop&q=80' },
  ];

  products.forEach((p) => {
    insertProduct.run(catMap[p.cat], p.name, p.desc, p.price, p.type, 1, p.img);
  });
}

// Ensure database is initialized on import
initDb();
