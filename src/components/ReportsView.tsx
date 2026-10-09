'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Package, DollarSign, Loader2, FileText } from 'lucide-react';

interface ReportsViewProps {
  onRefresh?: () => void;
}

type Period = 'today' | 'week' | 'month';

interface ReportData {
  period: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  top_products: { name: string; category: string; quantity: number; revenue: number }[];
  by_payment_method: { payment_method: string; count: number; total: number }[];
  by_order_type: { order_type: string; count: number; total: number }[];
  hourly_distribution?: { hour: string; orders: number; revenue: number }[];
}

export default function ReportsView({ onRefresh }: ReportsViewProps) {
  const [period, setPeriod] = useState<Period>('today');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchReport = async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${p}`);
      if (!res.ok) throw new Error('Error al obtener datos');
      const data = await res.json();
      setReportData(data);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    fetchReport(p);
  };

  React.useEffect(() => {
    fetchReport('today');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodLabels: Record<Period, string> = {
    today: 'HOY',
    week: 'ESTA SEMANA',
    month: 'ESTE MES',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 border-2 border-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-500 text-white border-2 border-slate-900">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900">REPORTES Y MÉTRICAS</h2>
            <p className="text-xs text-orange-600 font-bold uppercase">
              {reportData ? `PERÍODO: ${periodLabels[period]}` : 'CARGANDO DATOS...'}
            </p>
          </div>
        </div>

        <div className="flex border-2 border-slate-900 text-xs font-black">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2.5 uppercase border-r last:border-r-0 border-slate-900 transition ${
                period === p ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 hover:bg-orange-50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-slate-300">
          <Loader2 className="w-10 h-10 text-orange-500 mx-auto animate-spin mb-3" />
          <p className="font-black uppercase text-slate-700 text-sm">GENERANDO REPORTE...</p>
        </div>
      ) : !loaded ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-slate-300">
          <BarChart3 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="font-black uppercase text-slate-700 text-sm">SELECCIONÁ UN PERÍODO PARA VER EL REPORTE</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <ShoppingCart className="w-6 h-6" />,
                label: 'PEDIDOS TOTALES',
                value: reportData.total_orders,
                format: 'int',
                color: 'orange',
              },
              {
                icon: <DollarSign className="w-6 h-6" />,
                label: 'FACTURACIÓN TOTAL',
                value: reportData.total_revenue,
                format: 'currency',
                color: 'emerald',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                label: 'TICKET PROMEDIO',
                value: reportData.avg_order_value,
                format: 'currency',
                color: 'sky',
              },
              {
                icon: <Package className="w-6 h-6" />,
                label: 'PRODUCTOS VENDIDOS',
                value: reportData.top_products?.reduce((acc, p) => acc + p.quantity, 0) ?? 0,
                format: 'int',
                color: 'purple',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className={`bg-white p-4 border-2 border-slate-900 space-y-2`}
              >
                <div className={`p-2 inline-flex border-2 border-slate-900 text-white ${
                  kpi.color === 'orange' ? 'bg-orange-500' :
                  kpi.color === 'emerald' ? 'bg-emerald-600' :
                  kpi.color === 'sky' ? 'bg-sky-600' : 'bg-purple-600'
                }`}>
                  {kpi.icon}
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500">{kpi.label}</p>
                <p className="text-2xl font-black text-slate-900">
                  {kpi.format === 'currency'
                    ? `$${(kpi.value || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                    : kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white border-2 border-slate-900 overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <p className="text-white font-black text-xs uppercase">PRODUCTOS MÁS VENDIDOS</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-orange-50 border-b-2 border-slate-900">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-black uppercase text-slate-700">#</th>
                      <th className="px-4 py-2.5 text-left font-black uppercase text-slate-700">PRODUCTO</th>
                      <th className="px-4 py-2.5 text-right font-black uppercase text-slate-700">CANT.</th>
                      <th className="px-4 py-2.5 text-right font-black uppercase text-slate-700">RECAUDADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.top_products || []).slice(0, 10).map((p, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/30">
                        <td className="px-4 py-2.5 font-black text-orange-600">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900 uppercase">{p.name}</td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-700">{p.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-900">
                          ${p.revenue.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                    {(reportData.top_products || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-400 font-black uppercase text-[11px]">
                          SIN DATOS PARA MOSTRAR
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Methods + Order Types */}
            <div className="space-y-4">
              {/* By Payment */}
              <div className="bg-white border-2 border-slate-900 overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  <p className="text-white font-black text-xs uppercase">VENTAS POR MEDIO DE PAGO</p>
                </div>
                <div className="p-4 space-y-2">
                  {(reportData.by_payment_method || []).map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border-2 border-slate-200">
                      <span className="font-black uppercase text-slate-900 text-xs">{m.payment_method}</span>
                      <div className="text-right">
                        <div className="font-black text-slate-900 text-sm">${m.total?.toLocaleString('es-AR')}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{m.count} PEDIDOS</div>
                      </div>
                    </div>
                  ))}
                  {(reportData.by_payment_method || []).length === 0 && (
                    <p className="text-center text-slate-400 text-xs font-black uppercase py-4">SIN DATOS</p>
                  )}
                </div>
              </div>

              {/* By Order Type */}
              <div className="bg-white border-2 border-slate-900 overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  <p className="text-white font-black text-xs uppercase">VENTAS POR MEDIO DE PAGO</p>
                </div>
                <div className="p-4 space-y-2">
                  {(reportData.by_payment_method || []).map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border-2 border-slate-200">
                      <span className="font-black uppercase text-slate-900 text-xs">{m.payment_method}</span>
                      <div className="text-right">
                        <div className="font-black text-slate-900 text-sm">${m.total?.toLocaleString('es-AR')}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{m.count} PEDIDOS</div>
                      </div>
                    </div>
                  ))}
                  {(reportData.by_payment_method || []).length === 0 && (
                    <p className="text-center text-slate-400 text-xs font-black uppercase py-4">SIN DATOS</p>
                  )}
                </div>
              </div>

              {/* By Order Type */}
              <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" />
                  <p className="text-white font-black text-xs uppercase">VENTAS POR TIPO DE PEDIDO</p>
                </div>
                <div className="p-4 space-y-2">
                  {(reportData.by_order_type || []).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border-2 border-slate-200">
                      <span className="font-black uppercase text-slate-900 text-xs">{t.order_type}</span>
                      <div className="text-right">
                        <div className="font-black text-slate-900 text-sm">${t.total?.toLocaleString('es-AR')}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{t.count} PEDIDOS</div>
                      </div>
                    </div>
                  ))}
                  {(reportData.by_order_type || []).length === 0 && (
                    <p className="text-center text-slate-400 text-xs font-black uppercase py-4">SIN DATOS</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
