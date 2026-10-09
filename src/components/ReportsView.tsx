'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Award } from 'lucide-react';

export default function ReportsView() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !reportData) {
    return (
      <div className="text-center py-20 text-slate-500 text-sm font-semibold">
        Cargando estadísticas y métricas...
      </div>
    );
  }

  const { totals, byPaymentMethod, byOrderType, topProducts } = reportData;

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Reporte de Ventas & Métricas</h2>
            <p className="text-xs text-slate-500 font-medium">Análisis de rendimiento de la rotisería</p>
          </div>
        </div>

        <div className="flex bg-orange-50/60 p-1 rounded-xl border border-orange-200 text-xs font-bold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              period === 'today' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              period === 'week' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              period === 'month' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      {/* Totals Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Total Facturado</span>
          <span className="text-2xl font-black text-orange-600">
            ${(totals.total_revenue || 0).toLocaleString('es-AR')}
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Ingresos brutos del período</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Total de Pedidos</span>
          <span className="text-2xl font-black text-slate-900">{totals.total_orders || 0}</span>
          <p className="text-[11px] text-slate-400 font-medium">Comandas procesadas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Ticket Promedio</span>
          <span className="text-2xl font-black text-emerald-700">
            ${Math.round(totals.avg_ticket || 0).toLocaleString('es-AR')}
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Gasto medio por pedido</p>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-500" />
            Ventas por Medio de Pago
          </h3>

          <div className="space-y-2">
            {byPaymentMethod.length === 0 ? (
              <p className="text-xs text-slate-400">Sin datos registrados.</p>
            ) : (
              byPaymentMethod.map((pm: any) => (
                <div
                  key={pm.payment_method}
                  className="bg-orange-50/30 p-3 rounded-xl border border-orange-100 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 uppercase">{pm.payment_method}</span>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block text-sm">
                      ${pm.total.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{pm.count} pedido(s)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Types */}
        <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            Ventas por Tipo de Pedido
          </h3>

          <div className="space-y-2">
            {byOrderType.length === 0 ? (
              <p className="text-xs text-slate-400">Sin datos registrados.</p>
            ) : (
              byOrderType.map((ot: any) => (
                <div
                  key={ot.order_type}
                  className="bg-orange-50/30 p-3 rounded-xl border border-orange-100 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 uppercase">{ot.order_type}</span>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block text-sm">
                      ${ot.total.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{ot.count} pedido(s)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-500" />
          Platos Más Vendidos (Ranking TOP 10)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-orange-50/60 text-slate-700 font-bold uppercase tracking-wider border-b border-orange-200">
              <tr>
                <th className="px-4 py-3"># Posición</th>
                <th className="px-4 py-3">Plato</th>
                <th className="px-4 py-3">Cantidad Vendida</th>
                <th className="px-4 py-3 text-right">Facturación Generada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-black text-orange-600">#{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{p.product_name}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {p.unit_type === 'kilo' ? `${p.total_quantity.toFixed(3)} kg` : `${p.total_quantity} unidades`}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">
                    ${p.total_sales.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
