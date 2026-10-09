'use client';

import React, { useState } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import type { CashMovement, CashShiftData } from '@/lib/types';

interface CashShiftModalProps {
  shiftData: CashShiftData | null;
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
}

export default function CashShiftModal({ shiftData, onClose, onRefresh }: CashShiftModalProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'movimientos' | 'acciones'>('resumen');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada');
  const [initialCash, setInitialCash] = useState('');
  const [finalCashCounted, setFinalCashCounted] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasShift = Boolean(shiftData?.activeShift);

  const handleOpenShift = async () => {
    const val = parseFloat(initialCash);
    if (isNaN(val) || val < 0) { setError('Monto inicial inválido'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/cash-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', initial_cash: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al abrir turno');
      await onRefresh();
      setInitialCash('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al abrir turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    const val = parseFloat(finalCashCounted);
    if (isNaN(val) || val < 0) { setError('Ingresá el monto contado para cerrar la caja'); return; }
    if (!confirm('¿Seguro que querés cerrar el turno de caja?')) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/cash-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', final_cash_counted: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar turno');
      await onRefresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cerrar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleMovement = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { setError('Monto inválido'); return; }
    if (!description.trim()) { setError('Agregá una descripción'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/cash-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'movement',
          type: movementType === 'entrada' ? 'ingreso' : 'egreso',
          amount: val,
          concept: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar movimiento');
      await onRefresh();
      setAmount('');
      setDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const totals = shiftData?.totals;

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 w-full max-w-lg max-h-[85vh] overflow-y-auto flex flex-col">

        {/* Modal Header */}
        <div className="bg-slate-900 p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-orange-500 text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xs">Arqueo de Caja</h2>
              {hasShift ? (
                <p className="text-orange-400 text-[10px] font-medium">Turno Activo</p>
              ) : (
                <p className="text-slate-400 text-[10px] font-medium">Sin turno abierto</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* No shift state */}
        {!hasShift ? (
          <div className="p-5 space-y-3">
            <div className="text-center py-4 border border-dashed border-slate-200 space-y-1">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="font-semibold text-slate-800 text-xs">No hay turno abierto</p>
              <p className="text-xs text-slate-400">Abrí un turno para comenzar a registrar ventas</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Monto inicial de caja ($)</label>
              <input
                type="number"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 border border-slate-300 text-slate-900 font-bold bg-slate-50 focus:outline-none focus:border-orange-500 text-base"
              />
            </div>

            {error && <p className="text-rose-600 text-xs font-medium bg-rose-50 p-2 border-l-2 border-rose-500">{error}</p>}

            <button
              onClick={handleOpenShift}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" /> Abrir Turno de Caja
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              {(['resumen', 'movimientos', 'acciones'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 border-r last:border-r-0 border-slate-200 transition-colors ${
                    activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab === 'resumen' ? 'Resumen' : tab === 'movimientos' ? 'Movimientos' : 'Acciones'}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3 flex-1">
              {/* RESUMEN TAB */}
              {activeTab === 'resumen' && totals && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Caja Inicial', value: totals.initial_cash, color: 'slate' },
                      { label: 'Ventas Efectivo', value: totals.cash_sales, color: 'emerald' },
                      { label: 'Ventas Mercado Pago', value: totals.mp_sales, color: 'sky' },
                      { label: 'Ventas Tarjeta', value: totals.card_sales, color: 'purple' },
                      { label: 'Entradas Manuales', value: totals.ingresos_extra, color: 'emerald' },
                      { label: 'Salidas Manuales', value: totals.egresos_extra, color: 'rose' },
                    ].map((item) => (
                      <div key={item.label} className="p-2 border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-medium text-slate-500">{item.label}</p>
                        <p className="text-sm font-bold text-slate-900">${item.value?.toLocaleString('es-AR') ?? '0'}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-orange-500 text-white border border-orange-600">
                    <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wider">Total estimado en caja</p>
                    <p className="text-2xl font-extrabold">${totals.expected_cash?.toLocaleString('es-AR') ?? '0'}</p>
                  </div>
                </div>
              )}

              {/* MOVIMIENTOS TAB */}
              {activeTab === 'movimientos' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Registros de movimientos manuales</p>
                  {(!shiftData?.movements || shiftData.movements.length === 0) ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 text-slate-400">
                      <ArrowRightLeft className="w-6 h-6 mx-auto mb-1 opacity-30" />
                      <p className="text-xs font-medium">Sin movimientos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {shiftData.movements.map((m: CashMovement) => (
                        <div key={m.id} className={`p-2 border ${
                          m.type === 'ingreso' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
                        } flex items-center justify-between text-xs`}>
                          <div>
                            <p className="font-semibold text-slate-800">{m.concept}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1 font-bold ${
                            m.type === 'ingreso' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {m.type === 'ingreso' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            ${m.amount?.toLocaleString('es-AR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACCIONES TAB */}
              {activeTab === 'acciones' && (
                <div className="space-y-4 text-xs">
                  {/* Manual Movement */}
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-700 border-b border-slate-200 pb-1">Registrar Movimiento Manual</p>

                    <div className="flex border border-slate-200 font-semibold">
                      {(['entrada', 'salida'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setMovementType(t)}
                          className={`flex-1 py-1.5 border-r last:border-r-0 border-slate-200 transition-colors ${
                            movementType === t
                              ? t === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              : 'bg-white text-slate-600'
                          }`}
                        >
                          {t === 'entrada' ? 'Entrada (+)' : 'Salida (-)'}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Monto ($)"
                      className="w-full p-2 border border-slate-200 font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción del movimiento..."
                      className="w-full p-2 border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-orange-500"
                    />

                    {error && <p className="text-rose-600 text-xs font-medium bg-rose-50 p-1.5 border-l-2 border-rose-500">{error}</p>}

                    <button
                      onClick={handleMovement}
                      disabled={loading}
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs border border-orange-600 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Registrar Movimiento
                    </button>
                  </div>

                  {/* Close Shift */}
                  <div className="border-t border-dashed border-rose-200 pt-3 space-y-1.5">
                    <p className="font-semibold text-rose-600 text-[11px] uppercase tracking-wider">Cierre de caja</p>
                    <label className="block text-[11px] font-medium text-slate-600" htmlFor="final-cash-counted">
                      Efectivo contado ($)
                    </label>
                    <input
                      id="final-cash-counted"
                      type="number"
                      min="0"
                      step="0.01"
                      value={finalCashCounted}
                      onChange={(e) => setFinalCashCounted(e.target.value)}
                      placeholder="Monto contado al cierre"
                      className="w-full p-2 border border-slate-200 font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:border-orange-500"
                    />
                    {error && <p className="text-rose-600 text-xs font-medium bg-rose-50 p-1.5 border-l-2 border-rose-500">{error}</p>}
                    <button
                      onClick={handleCloseShift}
                      disabled={loading || !finalCashCounted}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs border border-rose-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" /> Cerrar Turno de Caja
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
