import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, query, transaction } from '@/lib/db';
import type { KitchenStatus, Order, OrderItem, OrderType, PaymentMethod, PaymentStatus } from '@/lib/types';

type Row = Record<string, unknown>;

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

function dateValue(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapOrderItem(row: Row): OrderItem {
  if (row.unit_type !== 'unidad' && row.unit_type !== 'kilo' && row.unit_type !== 'porcion') {
    throw new Error('Unidad de producto inválida en la base de datos');
  }
  return {
    id: Number(row.id), order_id: Number(row.order_id),
    product_id: row.product_id === null ? null : Number(row.product_id),
    product_name: String(row.product_name), unit_price: Number(row.unit_price),
    quantity: Number(row.quantity), unit_type: row.unit_type,
    subtotal: Number(row.subtotal), notes: String(row.notes ?? ''),
  };
}

function mapOrder(row: Row): Omit<Order, 'items'> {
  return {
    id: Number(row.id), order_number: Number(row.order_number), order_type: row.order_type as OrderType,
    customer_name: String(row.customer_name ?? ''), customer_phone: String(row.customer_phone ?? ''),
    delivery_address: String(row.delivery_address ?? ''), delivery_notes: String(row.delivery_notes ?? ''),
    payment_method: row.payment_method as PaymentMethod, payment_status: row.payment_status as PaymentStatus,
    kitchen_status: row.kitchen_status as KitchenStatus, total_amount: Number(row.total_amount),
    cash_paid: Number(row.cash_paid ?? 0), change_amount: Number(row.change_amount ?? 0),
    notes: String(row.notes ?? ''), cash_shift_id: row.cash_shift_id === null ? null : Number(row.cash_shift_id),
    created_at: dateValue(row.created_at), updated_at: dateValue(row.updated_at),
  };
}

async function getOrder(id: number): Promise<Order | undefined> {
  const [order] = await query<Row>('SELECT * FROM orders WHERE id = $1', [id]);
  if (!order) return undefined;
  const items = await query<Row>('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [id]);
  return { ...mapOrder(order), items: items.map(mapOrderItem) };
}

export async function GET(req: NextRequest) {
  try {
    await ensureDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const kitchenStatus = searchParams.get('kitchenStatus');
    const orderType = searchParams.get('orderType');
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (date === 'today' || !date) {
      conditions.push("(created_at AT TIME ZONE 'America/Argentina/Cordoba')::date = (now() AT TIME ZONE 'America/Argentina/Cordoba')::date");
    } else if (date !== 'all') {
      conditions.push(`(created_at AT TIME ZONE 'America/Argentina/Cordoba')::date = $${params.length + 1}::date`);
      params.push(date);
    }
    if (kitchenStatus && kitchenStatus !== 'todos') {
      conditions.push(`kitchen_status = $${params.length + 1}`);
      params.push(kitchenStatus);
    }
    if (orderType && orderType !== 'todos') {
      conditions.push(`order_type = $${params.length + 1}`);
      params.push(orderType);
    }

    const orders = await query<Row>(`SELECT * FROM orders ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY created_at DESC`, params);
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await query<Row>('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [Number(order.id)]);
      return { ...mapOrder(order), items: items.map(mapOrderItem) };
    }));
    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json() as CreateOrderBody;
    const { order_type, customer_name = '', customer_phone = '', delivery_address = '', delivery_notes = '',
      payment_method, payment_status = 'pendiente', kitchen_status = 'pendiente', total_amount,
      cash_paid = 0, change_amount = 0, notes = '', items = [] } = body;

    if (!order_type || !payment_method || !items.length || !Number.isFinite(total_amount)) {
      return NextResponse.json({ error: 'El pedido debe incluir tipo, medio de pago, total válido y al menos un ítem' }, { status: 400 });
    }

    const createdOrderId = await transaction(async (client) => {
      const maxResult = await client.query<Row>(`
        SELECT COALESCE(MAX(order_number), 0) AS max_num FROM orders
        WHERE (created_at AT TIME ZONE 'America/Argentina/Cordoba')::date = (now() AT TIME ZONE 'America/Argentina/Cordoba')::date
      `);
      const activeShiftResult = await client.query<Row>("SELECT id FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1");
      const inserted = await client.query<Row>(`
        INSERT INTO orders (order_number, order_type, customer_name, customer_phone, delivery_address, delivery_notes,
          payment_method, payment_status, kitchen_status, total_amount, cash_paid, change_amount, notes, cash_shift_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [Number(maxResult.rows[0].max_num) + 1, order_type, customer_name, customer_phone, delivery_address,
        delivery_notes, payment_method, payment_status, kitchen_status, total_amount, cash_paid, change_amount,
        notes, activeShiftResult.rows[0] ? Number(activeShiftResult.rows[0].id) : null]);
      const orderId = Number(inserted.rows[0].id);

      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, unit_type, subtotal, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [orderId, item.product_id || null, item.product_name, item.unit_price, item.quantity,
          item.unit_type, item.subtotal, item.notes || '']);
      }
      return orderId;
    });

    const order = await getOrder(createdOrderId);
    if (!order) throw new Error('No se pudo recuperar el pedido creado');
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error al registrar pedido' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureDatabase();
    const { id, kitchen_status, payment_status } = await req.json() as UpdateOrderBody;
    if (!id) return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });

    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const params: string[] = [];
    if (kitchen_status) {
      params.push(kitchen_status);
      updates.push(`kitchen_status = $${params.length}`);
    }
    if (payment_status) {
      params.push(payment_status);
      updates.push(`payment_status = $${params.length}`);
    }
    params.push(String(id));
    const updated = await query<Row>(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING id`, params);
    if (!updated[0]) return NextResponse.json({ error: 'No se encontró el pedido' }, { status: 404 });
    return NextResponse.json(await getOrder(id));
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}
