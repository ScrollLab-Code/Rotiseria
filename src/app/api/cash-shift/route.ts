import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, query } from '@/lib/db';
import type { CashMovement, CashShift } from '@/lib/types';

type Row = Record<string, unknown>;

function dateValue(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapShift(row: Row): CashShift {
  return {
    id: Number(row.id), opened_at: dateValue(row.opened_at),
    closed_at: row.closed_at === null ? null : dateValue(row.closed_at),
    initial_cash: Number(row.initial_cash), final_cash_expected: row.final_cash_expected === null ? null : Number(row.final_cash_expected),
    final_cash_counted: row.final_cash_counted === null ? null : Number(row.final_cash_counted),
    notes: row.notes === null ? null : String(row.notes), status: row.status as CashShift['status'],
  };
}

function mapMovement(row: Row): CashMovement {
  if (row.type !== 'ingreso' && row.type !== 'egreso') throw new Error('Tipo de movimiento de caja inválido en la base de datos');
  return {
    id: Number(row.id), cash_shift_id: Number(row.cash_shift_id), type: row.type,
    amount: Number(row.amount), concept: String(row.concept), created_at: dateValue(row.created_at),
  };
}

export async function GET() {
  try {
    await ensureDatabase();
    const [activeShiftRow] = await query<Row>("SELECT * FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1");
    if (!activeShiftRow) return NextResponse.json({ activeShift: null });
    const activeShift = mapShift(activeShiftRow);
    const [salesRows, movementRows] = await Promise.all([
      query<Row>(`SELECT payment_method, COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_amount
                  FROM orders WHERE cash_shift_id = $1 AND payment_status = 'pagado' GROUP BY payment_method`, [activeShift.id]),
      query<Row>('SELECT * FROM cash_movements WHERE cash_shift_id = $1 ORDER BY created_at DESC', [activeShift.id]),
    ]);
    const salesSummary = salesRows.map((row) => ({
      payment_method: String(row.payment_method), total_orders: Number(row.total_orders), total_amount: Number(row.total_amount),
    }));
    const movements = movementRows.map(mapMovement);
    const amountFor = (method: string) => salesSummary.find((sale) => sale.payment_method === method)?.total_amount || 0;
    const cashSales = amountFor('efectivo');
    const mpSales = amountFor('mercadopago');
    const cardSales = amountFor('tarjeta');
    const combinedSales = amountFor('combinado');
    const ingresos = movements.filter((movement) => movement.type === 'ingreso').reduce((sum, movement) => sum + movement.amount, 0);
    const egresos = movements.filter((movement) => movement.type === 'egreso').reduce((sum, movement) => sum + movement.amount, 0);

    return NextResponse.json({
      activeShift, salesSummary, movements,
      totals: {
        initial_cash: activeShift.initial_cash, cash_sales: cashSales, mp_sales: mpSales, card_sales: cardSales,
        combined_sales: combinedSales, total_sales: cashSales + mpSales + cardSales + combinedSales,
        ingresos_extra: ingresos, egresos_extra: egresos, expected_cash: activeShift.initial_cash + cashSales + ingresos - egresos,
      },
    });
  } catch (error) {
    console.error('Error fetching cash shift:', error);
    return NextResponse.json({ error: 'Error al obtener caja' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    if (body.action === 'open') {
      const initialCash = body.initial_cash;
      if (typeof initialCash !== 'number' || !Number.isFinite(initialCash) || initialCash < 0) {
        return NextResponse.json({ error: 'El monto inicial debe ser un número mayor o igual a cero' }, { status: 400 });
      }
      const current = await query<Row>("SELECT id FROM cash_shifts WHERE status = 'abierta' LIMIT 1");
      if (current[0]) return NextResponse.json({ error: 'Ya existe una caja abierta' }, { status: 400 });
      const [shift] = await query<Row>("INSERT INTO cash_shifts (initial_cash, status) VALUES ($1, 'abierta') RETURNING *", [initialCash]);
      return NextResponse.json({ message: 'Caja abierta con éxito', shift: mapShift(shift) });
    }

    const [activeRow] = await query<Row>("SELECT * FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1");
    if (!activeRow) return NextResponse.json({ error: 'No hay ninguna caja abierta' }, { status: 400 });
    const activeShift = mapShift(activeRow);

    if (body.action === 'close') {
      const finalCash = body.final_cash_counted;
      if (typeof finalCash !== 'number' || !Number.isFinite(finalCash) || finalCash < 0) {
        return NextResponse.json({ error: 'El efectivo contado debe ser un número mayor o igual a cero' }, { status: 400 });
      }
      const [cashSalesRows, movements] = await Promise.all([
        query<Row>(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders
                    WHERE cash_shift_id = $1 AND payment_method = 'efectivo' AND payment_status = 'pagado'`, [activeShift.id]),
        query<Row>('SELECT type, amount FROM cash_movements WHERE cash_shift_id = $1', [activeShift.id]),
      ]);
      const ingresos = movements.filter((row) => row.type === 'ingreso').reduce((sum, row) => sum + Number(row.amount), 0);
      const egresos = movements.filter((row) => row.type === 'egreso').reduce((sum, row) => sum + Number(row.amount), 0);
      const expectedCash = activeShift.initial_cash + Number(cashSalesRows[0]?.total ?? 0) + ingresos - egresos;
      await query(`UPDATE cash_shifts SET closed_at = CURRENT_TIMESTAMP, final_cash_expected = $1,
                   final_cash_counted = $2, notes = $3, status = 'cerrada' WHERE id = $4`,
        [expectedCash, finalCash, typeof body.notes === 'string' ? body.notes : '', activeShift.id]);
      return NextResponse.json({ message: 'Caja cerrada exitosamente', difference: finalCash - expectedCash });
    }

    if (body.action === 'movement') {
      const { type, amount, concept } = body;
      if ((type !== 'ingreso' && type !== 'egreso') || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || typeof concept !== 'string' || !concept.trim()) {
        return NextResponse.json({ error: 'Tipo, monto y concepto son obligatorios' }, { status: 400 });
      }
      await query('INSERT INTO cash_movements (cash_shift_id, type, amount, concept) VALUES ($1, $2, $3, $4)', [activeShift.id, type, amount, concept.trim()]);
      return NextResponse.json({ message: 'Movimiento de caja registrado' });
    }
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error processing cash shift action:', error);
    return NextResponse.json({ error: 'Error al procesar acción de caja' }, { status: 500 });
  }
}
