import { NextRequest, NextResponse } from 'next/server';
import { db, type DatabaseRow } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    let dateFilter = "(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')::date";
    if (period === 'week') {
      dateFilter = "created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "created_at >= date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')";
    }

    // Totals
    const totals = await db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_ticket
      FROM orders
      WHERE ${dateFilter} AND kitchen_status != 'cancelado'
    `).get() as DatabaseRow;

    // By Payment Method
    const byPaymentMethod = await db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE ${dateFilter} AND kitchen_status != 'cancelado'
      GROUP BY payment_method
    `).all();

    // By Order Type
    const byOrderType = await db.prepare(`
      SELECT 
        order_type,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE ${dateFilter} AND kitchen_status != 'cancelado'
      GROUP BY order_type
    `).all();

    // Top Selling Products
    const topProducts = await db.prepare(`
      SELECT 
        oi.product_name,
        oi.unit_type,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE ${dateFilter.replace(/created_at/g, 'o.created_at')} AND o.kitchen_status != 'cancelado'
      GROUP BY oi.product_name, oi.unit_type
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all();

    return NextResponse.json({
      totals,
      byPaymentMethod,
      byOrderType,
      topProducts
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 });
  }
}
