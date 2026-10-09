import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(Number(categoryId));
    }

    if (availableOnly) {
      conditions.push('p.available = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY c.display_order ASC, p.name ASC';

    const products = await db.prepare(query).all(...params);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: process.env.DATABASE_URL ? 'No se pudo conectar a la base de datos. Verificá DATABASE_URL en Vercel.' : 'Falta configurar DATABASE_URL en Vercel para conectar la base de datos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCatId = body.category_id ?? body.categoryId;
    const rawPrice = body.price;
    const name = body.name ? String(body.name).trim() : '';
    const description = body.description ? String(body.description).trim() : '';
    const unit_type = body.unit_type || body.unitType || 'unidad';
    const available = body.available === 0 || body.available === false ? 0 : 1;
    const image_url = body.image_url ? String(body.image_url).trim() : '';

    const parsedCatId = Number(rawCatId);
    const parsedPrice = Number(rawPrice);

    if (!parsedCatId || !name || Number.isNaN(parsedPrice) || !unit_type) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: nombre, categoría, precio válido o modo de venta' },
        { status: 400 }
      );
    }

    const newProduct = await db.prepare(`
      INSERT INTO products (category_id, name, description, price, unit_type, available, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).get(parsedCatId, name, description, parsedPrice, unit_type, available, image_url);

    const product = await db
      .prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?')
      .get(newProduct.id);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: process.env.DATABASE_URL ? 'No se pudo conectar a la base de datos. Verificá DATABASE_URL en Vercel.' : 'Falta configurar DATABASE_URL en Vercel para conectar la base de datos.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const rawCatId = body.category_id ?? body.categoryId;
    const rawPrice = body.price;
    const name = body.name ? String(body.name).trim() : '';
    const description = body.description ? String(body.description).trim() : '';
    const unit_type = body.unit_type || body.unitType || 'unidad';
    const available = body.available === 0 || body.available === false ? 0 : 1;
    const image_url = body.image_url ? String(body.image_url).trim() : '';

    const parsedCatId = Number(rawCatId);
    const parsedPrice = Number(rawPrice);

    await db.prepare(`
      UPDATE products
      SET category_id = ?, name = ?, description = ?, price = ?, unit_type = ?, available = ?, image_url = ?
      WHERE id = ?
    `).run(parsedCatId, name, description, parsedPrice, unit_type, available, image_url, id);

    const updatedProduct = await db
      .prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?')
      .get(id);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: process.env.DATABASE_URL ? 'No se pudo conectar a la base de datos. Verificá DATABASE_URL en Vercel.' : 'Falta configurar DATABASE_URL en Vercel para conectar la base de datos.' },
      { status: 500 }
    );
  }
}
