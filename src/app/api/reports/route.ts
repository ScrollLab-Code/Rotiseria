import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    let dateFilter = "date(created_at, 'localtime') = date('now', 'localtime')";
    if (period === 'week') {
      dateFilter = "created_at >= date('now', '-7 days', 'localtime')";
    } else if (period === 'month') {
      dateFilter = "created_at >= date('now', 'start of month', 'localtime')";
    }

    // Totals
    const totals = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_ticket
      FROM orders
      WHERE ${dateFilter} AND kitchen_status != 'cancelado'
    `).get() as any;

    // By Payment Method
    const byPaymentMethod = db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE ${dateFilter} AND kitchen_status != 'cancelado'
      GROUP BY payment_method
    `).all();

    // By Order Type
    const byOrderType = db.prepare(`
      SELECT 
        order_type,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE ${dateFilter} AND kitchen_status != 'cancelado'
      GROUP BY order_type
    `).all();

    // Top Selling Products
    const topProducts = db.prepare(`
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
