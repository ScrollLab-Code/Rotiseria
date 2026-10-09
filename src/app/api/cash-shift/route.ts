import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get active shift
    const activeShift = db.prepare("SELECT * FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1").get() as any;

    if (!activeShift) {
      return NextResponse.json({ activeShift: null });
    }

    // Get shift sales summary
    const salesSummary = db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_amount
      FROM orders
      WHERE cash_shift_id = ? AND payment_status = 'pagado'
      GROUP BY payment_method
    `).all(activeShift.id) as any[];

    // Get cash movements (Ingresos / Egresos extra)
    const movements = db.prepare(`
      SELECT * FROM cash_movements WHERE cash_shift_id = ? ORDER BY created_at DESC
    `).all(activeShift.id) as any[];

    // Calculate totals
    const cashSales = salesSummary.find(s => s.payment_method === 'efectivo')?.total_amount || 0;
    const mpSales = salesSummary.find(s => s.payment_method === 'mercadopago')?.total_amount || 0;
    const cardSales = salesSummary.find(s => s.payment_method === 'tarjeta')?.total_amount || 0;
    const combinedSales = salesSummary.find(s => s.payment_method === 'combinado')?.total_amount || 0;

    const totalIngresosExtra = movements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + m.amount, 0);
    const totalEgresosExtra = movements.filter(m => m.type === 'egreso').reduce((acc, m) => acc + m.amount, 0);

    const expectedCashInDrawer = activeShift.initial_cash + cashSales + totalIngresosExtra - totalEgresosExtra;

    return NextResponse.json({
      activeShift,
      salesSummary,
      movements,
      totals: {
        initial_cash: activeShift.initial_cash,
        cash_sales: cashSales,
        mp_sales: mpSales,
        card_sales: cardSales,
        combined_sales: combinedSales,
        total_sales: cashSales + mpSales + cardSales + combinedSales,
        ingresos_extra: totalIngresosExtra,
        egresos_extra: totalEgresosExtra,
        expected_cash: expectedCashInDrawer
      }
    });
  } catch (error) {
    console.error('Error fetching cash shift:', error);
    return NextResponse.json({ error: 'Error al obtener caja' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'open') {
      const { initial_cash } = body;
      
      // Check if shift is already open
      const currentOpen = db.prepare("SELECT * FROM cash_shifts WHERE status = 'abierta'").get();
      if (currentOpen) {
        return NextResponse.json({ error: 'Ya existe una caja abierta' }, { status: 400 });
      }

      const res = db.prepare("INSERT INTO cash_shifts (initial_cash, status) VALUES (?, 'abierta')").run(initial_cash || 0);
      const newShift = db.prepare("SELECT * FROM cash_shifts WHERE id = ?").get(res.lastInsertRowid);

      return NextResponse.json({ message: 'Caja abierta con éxito', shift: newShift });
    }

    if (action === 'close') {
      const { final_cash_counted, notes } = body;
      const activeShift = db.prepare("SELECT * FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1").get() as any;

      if (!activeShift) {
        return NextResponse.json({ error: 'No hay ninguna caja abierta' }, { status: 400 });
      }

      // Calculate expected cash
      const cashSalesObj = db.prepare(`
        SELECT SUM(total_amount) as total FROM orders WHERE cash_shift_id = ? AND payment_method = 'efectivo' AND payment_status = 'pagado'
      `).get(activeShift.id) as { total: number | null };

      const movements = db.prepare('SELECT type, amount FROM cash_movements WHERE cash_shift_id = ?').all(activeShift.id) as any[];
      const ingresos = movements.filter(m => m.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
      const egresos = movements.filter(m => m.type === 'egreso').reduce((a, b) => a + b.amount, 0);

      const cashSales = cashSalesObj.total || 0;
      const expectedCash = activeShift.initial_cash + cashSales + ingresos - egresos;

      db.prepare(`
        UPDATE cash_shifts
        SET closed_at = CURRENT_TIMESTAMP,
            final_cash_expected = ?,
            final_cash_counted = ?,
            notes = ?,
            status = 'cerrada'
        WHERE id = ?
      `).run(expectedCash, final_cash_counted, notes || '', activeShift.id);

      return NextResponse.json({ message: 'Caja cerrada exitosamente', difference: final_cash_counted - expectedCash });
    }

    if (action === 'movement') {
      const { type, amount, concept } = body;
      const activeShift = db.prepare("SELECT id FROM cash_shifts WHERE status = 'abierta' ORDER BY id DESC LIMIT 1").get() as { id: number } | undefined;

      if (!activeShift) {
        return NextResponse.json({ error: 'No hay caja abierta para registrar movimientos' }, { status: 400 });
      }

      if (!type || !amount || !concept) {
        return NextResponse.json({ error: 'Tipo, monto y concepto son obligatorios' }, { status: 400 });
      }

      db.prepare(`
        INSERT INTO cash_movements (cash_shift_id, type, amount, concept)
        VALUES (?, ?, ?, ?)
      `).run(activeShift.id, type, amount, concept);

      return NextResponse.json({ message: 'Movimiento de caja registrado' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error processing cash shift action:', error);
    return NextResponse.json({ error: 'Error al procesar acción de caja' }, { status: 500 });
  }
}
