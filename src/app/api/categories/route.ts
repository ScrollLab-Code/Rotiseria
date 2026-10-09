import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC, name ASC').all();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { name?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'El nombre de la categoría es obligatorio' }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: 'El nombre no puede superar los 60 caracteres' }, { status: 400 });
    }

    const existingCategory = db.prepare(
      'SELECT id FROM categories WHERE name = ? COLLATE NOCASE'
    ).get(name);
    if (existingCategory) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
    }

    const nextOrder = db.prepare(
      'SELECT COALESCE(MAX(display_order), -1) + 1 AS display_order FROM categories'
    ).get() as { display_order: number };
    const result = db.prepare(
      'INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)'
    ).run(name, 'Utensils', nextOrder.display_order);

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      name,
      icon: 'Utensils',
      display_order: nextOrder.display_order,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}
