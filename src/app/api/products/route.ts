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

    const products = db.prepare(query).all(...params);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category_id, name, description, price, unit_type, available = 1 } = body;

    if (!category_id || !name || price === undefined || !unit_type) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO products (category_id, name, description, price, unit_type, available)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(category_id, name, description || '', price, unit_type, available ? 1 : 0);

    const newProduct = db.prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(result.lastInsertRowid);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, category_id, name, description, price, unit_type, available } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const stmt = db.prepare(`
      UPDATE products
      SET category_id = ?, name = ?, description = ?, price = ?, unit_type = ?, available = ?
      WHERE id = ?
    `);

    stmt.run(category_id, name, description || '', price, unit_type, available ? 1 : 0, id);

    const updatedProduct = db.prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(id);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}
