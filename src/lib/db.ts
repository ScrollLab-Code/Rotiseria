import postgres, { type SerializableParameter } from 'postgres';

export type DatabaseRow = postgres.Row;
type QueryRunner = (statement: string, params?: SerializableParameter[]) => Promise<DatabaseRow[]>;
type SqlExecutor = {
  unsafe: (statement: string, params?: SerializableParameter[]) => Promise<DatabaseRow[]>;
};

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: ReturnType<typeof postgres>;
  databaseReady?: Promise<void>;
};

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta configurar DATABASE_URL para conectar la base de datos Neon');
  }

  globalForDb.postgresClient ??= postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });

  return globalForDb.postgresClient;
}

function toPostgres(statement: string) {
  let index = 0;
  return statement.replace(/\?/g, () => `$${++index}`);
}

async function execute(executor: SqlExecutor, statement: string, params: SerializableParameter[] = []): Promise<DatabaseRow[]> {
  const rows = await executor.unsafe(toPostgres(statement), params);
  return rows;
}

const categories = [
  { name: 'Platos Elaborados', icon: 'Utensils', order: 1 },
  { name: 'Pizzas y Empanadas', icon: 'Pizza', order: 2 },
  { name: 'Minutas y Guarniciones', icon: 'Flame', order: 3 },
  { name: 'Bebidas', icon: 'Beer', order: 4 },
  { name: 'Postres', icon: 'IceCream', order: 5 },
];

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

async function initializeDatabase() {
  const client = getClient();
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'Utensils',
      display_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price DOUBLE PRECISION NOT NULL,
      unit_type TEXT NOT NULL CHECK(unit_type IN ('unidad', 'kilo', 'porcion')),
      available INTEGER DEFAULT 1,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category_id, name)
    );
    CREATE TABLE IF NOT EXISTS cash_shifts (
      id SERIAL PRIMARY KEY,
      opened_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMPTZ,
      initial_cash DOUBLE PRECISION NOT NULL DEFAULT 0,
      final_cash_expected DOUBLE PRECISION,
      final_cash_counted DOUBLE PRECISION,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'abierta' CHECK(status IN ('abierta', 'cerrada'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number INTEGER NOT NULL,
      order_type TEXT NOT NULL CHECK(order_type IN ('mostrador', 'delivery', 'retiro')),
      customer_name TEXT,
      customer_phone TEXT,
      delivery_address TEXT,
      delivery_notes TEXT,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('efectivo', 'mercadopago', 'tarjeta', 'combinado')),
      payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK(payment_status IN ('pendiente', 'pagado')),
      kitchen_status TEXT NOT NULL DEFAULT 'pendiente' CHECK(kitchen_status IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
      total_amount DOUBLE PRECISION NOT NULL,
      cash_paid DOUBLE PRECISION DEFAULT 0,
      change_amount DOUBLE PRECISION DEFAULT 0,
      notes TEXT,
      cash_shift_id INTEGER REFERENCES cash_shifts(id),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      unit_price DOUBLE PRECISION NOT NULL,
      quantity DOUBLE PRECISION NOT NULL,
      unit_type TEXT NOT NULL,
      subtotal DOUBLE PRECISION NOT NULL,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS cash_movements (
      id SERIAL PRIMARY KEY,
      cash_shift_id INTEGER NOT NULL REFERENCES cash_shifts(id),
      type TEXT NOT NULL CHECK(type IN ('ingreso', 'egreso')),
      amount DOUBLE PRECISION NOT NULL,
      concept TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existingCategories = await client`SELECT COUNT(*)::int AS count FROM categories`;
  if (existingCategories[0].count === 0) {
    await client.begin(async (transaction) => {
      const categoryIds: Record<string, number> = {};
      for (const category of categories) {
        const [inserted] = await transaction`
          INSERT INTO categories (name, icon, display_order)
          VALUES (${category.name}, ${category.icon}, ${category.order})
          ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon
          RETURNING id
        `;
        categoryIds[category.name] = inserted.id;
      }

      for (const product of products) {
        await transaction`
          INSERT INTO products (category_id, name, description, price, unit_type, available, image_url)
          VALUES (${categoryIds[product.cat]}, ${product.name}, ${product.desc}, ${product.price}, ${product.type}, 1, ${product.img})
          ON CONFLICT (category_id, name) DO NOTHING
        `;
      }

      await transaction`
        INSERT INTO cash_shifts (initial_cash, status)
        SELECT 15000, 'abierta'
        WHERE NOT EXISTS (SELECT 1 FROM cash_shifts WHERE status = 'abierta')
      `;
    });
  } else {
    for (const category of categories) {
      await client`
        INSERT INTO categories (name, icon, display_order)
        VALUES (${category.name}, ${category.icon}, ${category.order})
        ON CONFLICT (name) DO NOTHING
      `;
    }
    await client`
      INSERT INTO cash_shifts (initial_cash, status)
      SELECT 15000, 'abierta'
      WHERE NOT EXISTS (SELECT 1 FROM cash_shifts WHERE status = 'abierta')
    `;
  }
}

async function ensureInitialized() {
  globalForDb.databaseReady ??= initializeDatabase().catch((error: unknown) => {
    globalForDb.databaseReady = undefined;
    throw error;
  });
  await globalForDb.databaseReady;
}

async function runQuery(statement: string, params: SerializableParameter[] = []) {
  await ensureInitialized();
  return execute(getClient(), statement, params);
}

export const db = {
  prepare(statement: string) {
    return {
      all: (...params: SerializableParameter[]) => runQuery(statement, params),
      get: async (...params: SerializableParameter[]) => (await runQuery(statement, params))[0],
      run: async (...params: SerializableParameter[]) => {
        const rows = await runQuery(statement, params);
        return { lastInsertRowid: rows[0]?.id, changes: rows.length };
      },
    };
  },
};

export async function runInTransaction<T>(callback: (query: QueryRunner) => Promise<T>): Promise<T> {
  await ensureInitialized();
  const result = await getClient().begin(async (transaction) => {
    return callback((statement, params = []) => execute(transaction as SqlExecutor, statement, params));
  });
  return result as T;
}
