import { NextResponse } from 'next/server';
import { ensureDatabase, query } from '@/lib/db';

export async function GET() {
  try {
    await ensureDatabase();
    const categories = await query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabase();
    const body = await req.json() as { name?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return NextResponse.json({ error: 'El nombre de la categoría es obligatorio' }, { status: 400 });
    if (name.length > 60) return NextResponse.json({ error: 'El nombre no puede superar los 60 caracteres' }, { status: 400 });

    const existing = await query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
    if (existing[0]) return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });

    const [category] = await query(`
      INSERT INTO categories (name, icon, display_order)
      VALUES ($1, 'Utensils', (SELECT COALESCE(MAX(display_order), -1) + 1 FROM categories))
      RETURNING *
    `, [name]);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}
