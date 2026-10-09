'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Award, Calendar, CreditCard, QrCode, Bike, Utensils } from 'lucide-react';

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
      <div className="text-center py-20 text-slate-400 text-sm">
        Cargando estadísticas y métricas...
      </div>
    );
  }

  const { totals, byPaymentMethod, byOrderType, topProducts } = reportData;

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Reporte de Ventas & Métricas</h2>
            <p className="text-xs text-slate-400">Análisis de rendimiento de la rotisería</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              period === 'today' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              period === 'week' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              period === 'month' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      {/* Totals Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Total Facturado</span>
          <span className="text-2xl font-black text-amber-400">
            ${(totals.total_revenue || 0).toLocaleString('es-AR')}
          </span>
          <p className="text-[11px] text-slate-500">Ingresos brutos del período</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Total de Pedidos</span>
          <span className="text-2xl font-black text-white">{totals.total_orders || 0}</span>
          <p className="text-[11px] text-slate-500">Comandas procesadas</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Ticket Promedio</span>
          <span className="text-2xl font-black text-emerald-400">
            ${Math.round(totals.avg_ticket || 0).toLocaleString('es-AR')}
          </span>
          <p className="text-[11px] text-slate-500">Gasto medio por pedido</p>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Ventas por Medio de Pago
          </h3>

          <div className="space-y-2">
            {byPaymentMethod.length === 0 ? (
              <p className="text-xs text-slate-500">Sin datos registados.</p>
            ) : (
              byPaymentMethod.map((pm: any) => (
                <div
                  key={pm.payment_method}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-200 uppercase">{pm.payment_method}</span>
                  <div className="text-right">
                    <span className="font-black text-white block">
                      ${pm.total.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-slate-400">{pm.count} pedido(s)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Types */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            Ventas por Tipo de Pedido
          </h3>

          <div className="space-y-2">
            {byOrderType.length === 0 ? (
              <p className="text-xs text-slate-500">Sin datos registrados.</p>
            ) : (
              byOrderType.map((ot: any) => (
                <div
                  key={ot.order_type}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-200 uppercase">{ot.order_type}</span>
                  <div className="text-right">
                    <span className="font-black text-white block">
                      ${ot.total.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-slate-400">{ot.count} pedido(s)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Platos Más Vendidos (Ranking TOP 10)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3"># Posición</th>
                <th className="px-4 py-3">Plato</th>
                <th className="px-4 py-3">Cantidad Vendida</th>
                <th className="px-4 py-3 text-right">Facturación Generada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {topProducts.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-black text-amber-400">#{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-white">{p.product_name}</td>
                  <td className="px-4 py-3 font-semibold text-slate-300">
                    {p.unit_type === 'kilo' ? `${p.total_quantity.toFixed(3)} kg` : `${p.total_quantity} unidades`}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-400">
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
