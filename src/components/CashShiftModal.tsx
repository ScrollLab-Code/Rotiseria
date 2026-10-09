'use client';

import React, { useState } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface CashShiftModalProps {
  shiftData: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function CashShiftModal({ shiftData, onClose, onRefresh }: CashShiftModalProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'movimientos' | 'acciones'>('resumen');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada');
  const [initialCash, setInitialCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasShift = shiftData?.shift;

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
      if (!res.ok) throw new Error('Error al abrir turno');
      onRefresh();
      setInitialCash('');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleCloseShift = async () => {
    if (!confirm('¿Seguro que querés cerrar el turno de caja?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/cash-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      if (!res.ok) throw new Error('Error al cerrar turno');
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
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
        body: JSON.stringify({ action: 'movement', type: movementType, amount: val, description: description.trim() }),
      });
      if (!res.ok) throw new Error('Error al registrar movimiento');
      onRefresh();
      setAmount('');
      setDescription('');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const totals = shiftData?.totals;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Modal Header */}
        <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500 border-2 border-orange-300">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-base uppercase tracking-wider">ARQUEO DE CAJA</h2>
              {hasShift ? (
                <p className="text-orange-400 text-xs font-bold uppercase">TURNO ACTIVO</p>
              ) : (
                <p className="text-slate-400 text-xs font-bold uppercase">SIN TURNO ABIERTO</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* No shift state */}
        {!hasShift ? (
          <div className="p-6 space-y-4">
            <div className="text-center py-4 border-2 border-dashed border-slate-300 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-black uppercase text-slate-700">NO HAY TURNO ABIERTO</p>
              <p className="text-sm text-slate-500 font-bold">Abrí un turno para comenzar a registrar ventas</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-700">MONTO INICIAL DE CAJA ($)</label>
              <input
                type="number"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 border-2 border-slate-900 font-bold text-slate-900 bg-orange-50/40 focus:outline-none focus:border-orange-500 text-lg"
              />
            </div>

            {error && <p className="text-rose-700 text-xs font-black uppercase bg-rose-100 p-2 border-l-4 border-rose-600">{error}</p>}

            <button
              onClick={handleOpenShift}
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Unlock className="w-5 h-5" /> ABRIR TURNO DE CAJA
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b-2 border-slate-900">
              {(['resumen', 'movimientos', 'acciones'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-black uppercase border-r-2 last:border-r-0 border-slate-900 transition ${
                    activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 hover:bg-orange-50'
                  }`}
                >
                  {tab === 'resumen' ? '📊 RESUMEN' : tab === 'movimientos' ? '🔄 MOVIMIENTOS' : '⚙️ ACCIONES'}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4 flex-1">
              {/* RESUMEN TAB */}
              {activeTab === 'resumen' && totals && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'CAJA INICIAL', value: totals.initial_cash, color: 'slate' },
                      { label: 'VENTAS EFECTIVO', value: totals.cash_sales, color: 'emerald' },
                      { label: 'VENTAS TARJETA', value: totals.card_sales, color: 'sky' },
                      { label: 'VENTAS TRANSFERENCIA', value: totals.transfer_sales, color: 'purple' },
                      { label: 'ENTRADAS MANUALES', value: totals.manual_in, color: 'emerald' },
                      { label: 'SALIDAS MANUALES', value: totals.manual_out, color: 'rose' },
                    ].map((item) => (
                      <div key={item.label} className={`p-3 border-2 border-slate-900 ${
                        item.color === 'emerald' ? 'bg-emerald-50' :
                        item.color === 'sky' ? 'bg-sky-50' :
                        item.color === 'purple' ? 'bg-purple-50' :
                        item.color === 'rose' ? 'bg-rose-50' : 'bg-slate-50'
                      }`}>
                        <p className="text-[10px] font-black uppercase text-slate-500">{item.label}</p>
                        <p className="text-lg font-black text-slate-900">${item.value?.toLocaleString('es-AR') ?? '0'}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-orange-500 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                    <p className="text-white/80 text-xs font-black uppercase">TOTAL EN CAJA (ESTIMADO)</p>
                    <p className="text-white text-3xl font-black">${totals.expected_cash?.toLocaleString('es-AR') ?? '0'}</p>
                  </div>
                </div>
              )}

              {/* MOVIMIENTOS TAB */}
              {activeTab === 'movimientos' && (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase text-slate-500">REGISTROS DE MOVIMIENTOS MANUALES</p>
                  {(!shiftData?.movements || shiftData.movements.length === 0) ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 text-slate-500">
                      <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-black uppercase">SIN MOVIMIENTOS REGISTRADOS</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shiftData.movements.map((m: any) => (
                        <div key={m.id} className={`p-3 border-2 ${
                          m.type === 'entrada' ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                        } flex items-center justify-between`}>
                          <div>
                            <p className="text-xs font-black uppercase text-slate-900">{m.description}</p>
                            <p className="text-[10px] text-slate-500 font-bold">
                              {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1 font-black text-sm ${
                            m.type === 'entrada' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {m.type === 'entrada' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
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
                <div className="space-y-5">
                  {/* Manual Movement */}
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase text-slate-700 border-b-2 border-slate-900 pb-2">REGISTRAR MOVIMIENTO MANUAL</p>

                    <div className="flex border-2 border-slate-900 overflow-hidden">
                      {(['entrada', 'salida'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setMovementType(t)}
                          className={`flex-1 py-2.5 text-xs font-black uppercase transition border-r last:border-r-0 border-slate-900 ${
                            movementType === t
                              ? t === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              : 'bg-white text-slate-700'
                          }`}
                        >
                          {t === 'entrada' ? '⬆️ ENTRADA' : '⬇️ SALIDA'}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="MONTO ($)"
                      className="w-full p-3 border-2 border-slate-900 font-bold text-slate-900 bg-orange-50/40 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="DESCRIPCIÓN DEL MOVIMIENTO..."
                      className="w-full p-3 border-2 border-slate-900 font-bold text-slate-900 bg-orange-50/40 focus:outline-none focus:border-orange-500"
                    />

                    {error && <p className="text-rose-700 text-xs font-black bg-rose-100 p-2 border-l-4 border-rose-600">{error}</p>}

                    <button
                      onClick={handleMovement}
                      disabled={loading}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowRightLeft className="w-4 h-4" /> REGISTRAR MOVIMIENTO
                    </button>
                  </div>

                  {/* Close Shift */}
                  <div className="border-t-2 border-dashed border-rose-300 pt-5 space-y-2">
                    <p className="text-xs font-black uppercase text-rose-700">ZONA DE RIESGO</p>
                    <button
                      onClick={handleCloseShift}
                      disabled={loading}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" /> CERRAR TURNO DE CAJA
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold text-center uppercase">Esta acción cerrará el turno y los totales serán guardados</p>
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
