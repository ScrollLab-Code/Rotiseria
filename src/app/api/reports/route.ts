import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, query } from '@/lib/db';

interface ReportTotals {
  total_orders: number;
  total_revenue: number;
  avg_ticket: number;
}

export async function GET(req: NextRequest) {
  const period = new URL(req.url).searchParams.get('period') || 'today';
  try {
    await ensureDatabase();
    const dateFilter = period === 'week'
      ? "created_at >= date_trunc('day', now() AT TIME ZONE 'America/Argentina/Cordoba') - INTERVAL '6 days'"
      : period === 'month'
        ? "created_at >= date_trunc('month', now() AT TIME ZONE 'America/Argentina/Cordoba')"
        : "(created_at AT TIME ZONE 'America/Argentina/Cordoba')::date = (now() AT TIME ZONE 'America/Argentina/Cordoba')::date";

    const [totalsRow] = await query(`
      SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue,
             COALESCE(AVG(total_amount), 0) AS avg_ticket
      FROM orders WHERE ${dateFilter} AND kitchen_status != 'cancelado'
    `);
    const totals: ReportTotals = {
      total_orders: Number(totalsRow.total_orders),
      total_revenue: Number(totalsRow.total_revenue),
      avg_ticket: Number(totalsRow.avg_ticket),
    };

    const [byPaymentMethod, byOrderType, topProducts] = await Promise.all([
      query(`SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
             FROM orders WHERE ${dateFilter} AND kitchen_status != 'cancelado' GROUP BY payment_method`),
      query(`SELECT order_type, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
             FROM orders WHERE ${dateFilter} AND kitchen_status != 'cancelado' GROUP BY order_type`),
      query(`SELECT oi.product_name, oi.unit_type, SUM(oi.quantity) AS total_quantity,
                    SUM(oi.subtotal) AS total_sales
             FROM order_items oi JOIN orders o ON oi.order_id = o.id
             WHERE ${dateFilter.replace(/created_at/g, 'o.created_at')} AND o.kitchen_status != 'cancelado'
             GROUP BY oi.product_name, oi.unit_type ORDER BY total_quantity DESC LIMIT 10`),
    ]);

    return NextResponse.json({ totals, byPaymentMethod, byOrderType, topProducts });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 });
  }
}
