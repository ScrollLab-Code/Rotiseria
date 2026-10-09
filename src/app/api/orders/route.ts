import { NextRequest, NextResponse } from 'next/server';
import { db, runInTransaction, type DatabaseRow } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD or 'today'
    const kitchenStatus = searchParams.get('kitchenStatus');
    const orderType = searchParams.get('orderType');

    let query = `SELECT * FROM orders`;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (date === 'today' || !date) {
      conditions.push("(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')::date");
    } else if (date && date !== 'all') {
      conditions.push("(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = ?::date");
      params.push(date);
    }

    if (kitchenStatus && kitchenStatus !== 'todos') {
      conditions.push("kitchen_status = ?");
      params.push(kitchenStatus);
    }

    if (orderType && orderType !== 'todos') {
      conditions.push("order_type = ?");
      params.push(orderType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const orders = await db.prepare(query).all(...params) as (DatabaseRow & { id: number; items?: DatabaseRow[] })[];

    // Attach items to each order
    for (const order of orders) {
      order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_type,
      customer_name = '',
      customer_phone = '',
      delivery_address = '',
      delivery_notes = '',
      payment_method,
      payment_status = 'pendiente',
      kitchen_status = 'pendiente',
      total_amount,
      cash_paid = 0,
      change_amount = 0,
      notes = '',
      items = [],
    } = body;

    if (!order_type || !payment_method || !items || items.length === 0) {
      return NextResponse.json({ error: 'El pedido debe incluir tipo, medio de pago y al menos un ítem' }, { status: 400 });
    }

    // Get today's max order_number
    const maxOrder = await db.prepare(`
      SELECT MAX(order_number) as max_num FROM orders 
      WHERE (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
    `).get() as { max_num: number | null };

    const nextOrderNum = (maxOrder?.max_num || 0) + 1;

    // Get active cash shift ID
    const activeShift = await db.prepare("SELECT id FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1").get() as { id: number } | undefined;
    const shiftId = activeShift ? activeShift.id : null;

    const createdOrderId = await runInTransaction(async (query) => {
      const [createdOrder] = await query(`
      INSERT INTO orders (
        order_number, order_type, customer_name, customer_phone, delivery_address, delivery_notes,
        payment_method, payment_status, kitchen_status, total_amount, cash_paid, change_amount,
        notes, cash_shift_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `, [
        nextOrderNum,
        order_type,
        customer_name,
        customer_phone,
        delivery_address,
        delivery_notes,
        payment_method,
        payment_status,
        kitchen_status,
        total_amount,
        cash_paid,
        change_amount,
        notes,
        shiftId
      ]);
      const orderId = createdOrder.id as number;

      for (const item of items) {
        await query(`
          INSERT INTO order_items (
            order_id, product_id, product_name, unit_price, quantity, unit_type, subtotal, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id || null,
          item.product_name,
          item.unit_price,
          item.quantity,
          item.unit_type,
          item.subtotal,
          item.notes || ''
        ]);
      }

      return orderId;
    });

    // Fetch full order
    const createdOrder = await db.prepare('SELECT * FROM orders WHERE id = ?').get(createdOrderId) as (DatabaseRow & { items?: DatabaseRow[] }) | undefined;
    if (!createdOrder) {
      throw new Error('No se pudo recuperar el pedido recién creado');
    }
    createdOrder.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(createdOrderId);

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error al registrar pedido' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, kitchen_status, payment_status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    const updates: string[] = ["updated_at = CURRENT_TIMESTAMP"];
    const params: (string | number)[] = [];

    if (kitchen_status) {
      updates.push("kitchen_status = ?");
      params.push(kitchen_status);
    }

    if (payment_status) {
      updates.push("payment_status = ?");
      params.push(payment_status);
    }

    params.push(id);

    await db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedOrder = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as (DatabaseRow & { items?: DatabaseRow[] }) | undefined;
    if (!updatedOrder) {
      return NextResponse.json({ error: 'No se encontró el pedido' }, { status: 404 });
    }
    updatedOrder.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}
