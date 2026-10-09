import { NextRequest, NextResponse } from 'next/server';
import type { SQLOutputValue } from 'node:sqlite';
import { db, runInTransaction } from '@/lib/db';
import type { KitchenStatus, Order, OrderItem, OrderType, PaymentMethod, PaymentStatus } from '@/lib/types';

interface CreateOrderBody {
  order_type: OrderType;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_notes?: string;
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  kitchen_status?: KitchenStatus;
  total_amount: number;
  cash_paid?: number;
  change_amount?: number;
  notes?: string;
  items: OrderItem[];
}

interface UpdateOrderBody {
  id?: number;
  kitchen_status?: KitchenStatus;
  payment_status?: PaymentStatus;
}

function mapOrderItem(row: Record<string, SQLOutputValue>): OrderItem {
  if (row.unit_type !== 'unidad' && row.unit_type !== 'kilo' && row.unit_type !== 'porcion') {
    throw new Error('Unidad de producto inválida en la base de datos');
  }

  return {
    id: Number(row.id),
    order_id: Number(row.order_id),
    product_id: row.product_id === null ? null : Number(row.product_id),
    product_name: String(row.product_name),
    unit_price: Number(row.unit_price),
    quantity: Number(row.quantity),
    unit_type: row.unit_type,
    subtotal: Number(row.subtotal),
    notes: String(row.notes ?? ''),
  };
}

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
      conditions.push("date(created_at, 'localtime') = date('now', 'localtime')");
    } else if (date && date !== 'all') {
      conditions.push("date(created_at, 'localtime') = date(?)");
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

    const orders = db.prepare(query).all(...params) as Omit<Order, 'items'>[];

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems: Order[] = orders.map((order) => ({
      ...order,
      items: getItems.all(order.id).map(mapOrderItem),
    }));

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateOrderBody;
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
    const maxOrder = db.prepare(`
      SELECT MAX(order_number) as max_num FROM orders 
      WHERE date(created_at, 'localtime') = date('now', 'localtime')
    `).get() as { max_num: number | null };

    const nextOrderNum = (maxOrder?.max_num || 0) + 1;

    // Get active cash shift ID
    const activeShift = db.prepare("SELECT id FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1").get() as { id: number } | undefined;
    const shiftId = activeShift ? activeShift.id : null;

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, order_type, customer_name, customer_phone, delivery_address, delivery_notes,
        payment_method, payment_status, kitchen_status, total_amount, cash_paid, change_amount,
        notes, cash_shift_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name, unit_price, quantity, unit_type, subtotal, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdOrderId = runInTransaction(() => {
      const result = insertOrder.run(
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
      );

      const orderId = result.lastInsertRowid;

      for (const item of items) {
        insertItem.run(
          orderId,
          item.product_id || null,
          item.product_name,
          item.unit_price,
          item.quantity,
          item.unit_type,
          item.subtotal,
          item.notes || ''
        );
      }

      return orderId;
    });

    // Fetch full order
    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(createdOrderId) as Omit<Order, 'items'> | undefined;
    if (!createdOrder) throw new Error('No se pudo recuperar el pedido creado');
    const orderWithItems: Order = {
      ...createdOrder,
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(createdOrderId).map(mapOrderItem),
    };

    return NextResponse.json(orderWithItems, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error al registrar pedido' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as UpdateOrderBody;
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

    db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Omit<Order, 'items'> | undefined;
    if (!updatedOrder) {
      return NextResponse.json({ error: 'No se encontró el pedido' }, { status: 404 });
    }
    const orderWithItems: Order = {
      ...updatedOrder,
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id).map(mapOrderItem),
    };

    return NextResponse.json(orderWithItems);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}
