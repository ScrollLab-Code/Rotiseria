'use client';

import React, { useCallback, useState } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Package, DollarSign, Loader2, FileText } from 'lucide-react';

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

export default function ReportsView() {
  const [period, setPeriod] = useState<Period>('today');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const fetchReport = useCallback(async (p: Period) => {
    try {
      const res = await fetch(`/api/reports?period=${p}`);
      if (!res.ok) throw new Error('Error al obtener datos');
      const data = await res.json() as ReportData;
      setReportData(data);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setLoading(true);
    void fetchReport(p);
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadInitialReport = async () => {
      try {
        const res = await fetch('/api/reports?period=today');
        if (!res.ok) throw new Error('Error al obtener datos');
        const data = await res.json() as ReportData;
        if (isMounted) {
          setReportData(data);
          setLoaded(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadInitialReport();
    return () => {
      isMounted = false;
    };
  }, []);

  const periodLabels: Record<Period, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-orange-500 text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Reportes y Métricas</h2>
            <p className="text-xs text-orange-600 font-semibold">
              {reportData ? `Período: ${periodLabels[period]}` : 'Cargando datos...'}
            </p>
          </div>
        </div>

        <div className="flex border border-slate-200 text-xs font-semibold">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1.5 border-r last:border-r-0 border-slate-200 transition-colors ${
                period === p ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200">
          <Loader2 className="w-8 h-8 text-orange-500 mx-auto animate-spin mb-2" />
          <p className="font-semibold text-slate-700 text-xs">Generando reporte...</p>
        </div>
      ) : !loaded ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200">
          <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-600 text-xs">Seleccioná un período para ver el reporte</p>
        </div>
      ) : reportData ? (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: <ShoppingCart className="w-5 h-5" />,
                label: 'Pedidos Totales',
                value: reportData.total_orders,
                format: 'int',
                color: 'orange',
              },
              {
                icon: <DollarSign className="w-5 h-5" />,
                label: 'Facturación Total',
                value: reportData.total_revenue,
                format: 'currency',
                color: 'emerald',
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                label: 'Ticket Promedio',
                value: reportData.avg_order_value,
                format: 'currency',
                color: 'sky',
              },
              {
                icon: <Package className="w-5 h-5" />,
                label: 'Productos Vendidos',
                value: reportData.top_products?.reduce((acc, p) => acc + p.quantity, 0) ?? 0,
                format: 'int',
                color: 'purple',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white p-3 border border-slate-200 space-y-1.5"
              >
                <div className={`p-1.5 inline-flex text-white ${
                  kpi.color === 'orange' ? 'bg-orange-500' :
                  kpi.color === 'emerald' ? 'bg-emerald-600' :
                  kpi.color === 'sky' ? 'bg-sky-600' : 'bg-purple-600'
                }`}>
                  {kpi.icon}
                </div>
                <p className="text-[10px] font-semibold text-slate-500">{kpi.label}</p>
                <p className="text-xl font-bold text-slate-900">
                  {kpi.format === 'currency'
                    ? `$${(kpi.value || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                    : kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="bg-white border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                <p className="text-white font-semibold text-xs">Productos Más Vendidos</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Producto</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Cant.</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Recaudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(reportData.top_products || []).slice(0, 10).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-orange-600">{idx + 1}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{p.name}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{p.quantity}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          ${p.revenue.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                    {(reportData.top_products || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-400 font-medium text-xs">
                          Sin datos para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Methods + Order Types */}
            <div className="space-y-3">
              {/* By Payment */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                  <p className="text-white font-semibold text-xs">Ventas por Medio de Pago</p>
                </div>
                <div className="p-3 space-y-1.5">
                  {(reportData.by_payment_method || []).map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800 text-xs capitalize">{m.payment_method}</span>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-xs">${m.total?.toLocaleString('es-AR')}</div>
                        <div className="text-[10px] text-slate-400">{m.count} pedidos</div>
                      </div>
                    </div>
                  ))}
                  {(reportData.by_payment_method || []).length === 0 && (
                    <p className="text-center text-slate-400 text-xs font-medium py-3">Sin datos</p>
                  )}
                </div>
              </div>

              {/* By Order Type */}
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-orange-400" />
                  <p className="text-white font-semibold text-xs">Ventas por Tipo de Pedido</p>
                </div>
                <div className="p-3 space-y-1.5">
                  {(reportData.by_order_type || []).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800 text-xs capitalize">{t.order_type}</span>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-xs">${t.total?.toLocaleString('es-AR')}</div>
                        <div className="text-[10px] text-slate-400">{t.count} pedidos</div>
                      </div>
                    </div>
                  ))}
                  {(reportData.by_order_type || []).length === 0 && (
                    <p className="text-center text-slate-400 text-xs font-medium py-3">Sin datos</p>
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
