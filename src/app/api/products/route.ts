import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabase();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (categoryId) {
      conditions.push(`p.category_id = $${params.length + 1}`);
      params.push(Number(categoryId));
    }
    if (availableOnly) conditions.push('p.available = 1');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const products = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY c.display_order ASC, p.name ASC
    `, params);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const categoryId = Number(body.category_id ?? body.categoryId);
    const price = Number(body.price);
    const name = body.name ? String(body.name).trim() : '';
    const description = body.description ? String(body.description).trim() : '';
    const unitType = body.unit_type || body.unitType || 'unidad';
    const available = body.available === 0 || body.available === false ? 0 : 1;
    const imageUrl = body.image_url ? String(body.image_url).trim() : '';

    if (!categoryId || !name || !Number.isFinite(price) || !['unidad', 'kilo', 'porcion'].includes(unitType)) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: nombre, categoría, precio válido o modo de venta' }, { status: 400 });
    }

    const [newProduct] = await query(`
      INSERT INTO products (category_id, name, description, price, unit_type, available, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [categoryId, name, description, price, unitType, available, imageUrl]);
    const [product] = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [Number(newProduct.id)]);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear producto' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const id = Number(body.id);
    const categoryId = Number(body.category_id ?? body.categoryId);
    const price = Number(body.price);
    const name = body.name ? String(body.name).trim() : '';
    const description = body.description ? String(body.description).trim() : '';
    const unitType = body.unit_type || body.unitType || 'unidad';
    const available = body.available === 0 || body.available === false ? 0 : 1;
    const imageUrl = body.image_url ? String(body.image_url).trim() : '';

    if (!id || !categoryId || !name || !Number.isFinite(price) || !['unidad', 'kilo', 'porcion'].includes(unitType)) {
      return NextResponse.json({ error: 'Datos de producto inválidos' }, { status: 400 });
    }

    const updated = await query(`
      UPDATE products
      SET category_id = $1, name = $2, description = $3, price = $4, unit_type = $5, available = $6, image_url = $7
      WHERE id = $8
      RETURNING id
    `, [categoryId, name, description, price, unitType, available, imageUrl, id]);
    if (!updated[0]) return NextResponse.json({ error: 'No se encontró el producto' }, { status: 404 });

    const [product] = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al actualizar producto' }, { status: 500 });
  }
}
