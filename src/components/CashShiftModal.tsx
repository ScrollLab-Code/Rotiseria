'use client';

import React, { useState } from 'react';
import { Wallet, X, PlusCircle, MinusCircle, DollarSign, CheckCircle2, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface CashShiftModalProps {
  shiftData: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function CashShiftModal({ shiftData, onClose, onRefresh }: CashShiftModalProps) {
  const [tab, setTab] = useState<'status' | 'movement' | 'close' | 'open'>('status');
  
  // Open cash inputs
  const [initialCashInput, setInitialCashInput] = useState<string>('15000');

  // Movement inputs
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('egreso');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementConcept, setMovementConcept] = useState<string>('');

  // Close cash inputs
  const [countedCashInput, setCountedCashInput] = useState<string>('');
  const [closeNotesInput, setCloseNotesInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);

  const isShiftOpen = !!shiftData?.activeShift;
  const totals = shiftData?.totals || {};

  const handleOpenCash = async () => {
    const amount = parseFloat(initialCashInput);
    if (isNaN(amount) || amount < 0) return alert('Ingrese un monto inicial válido');

    setIsLoading(true);
    try {
      const res = await fetch('/api/cash-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', initial_cash: amount }),
      });
      if (!res.ok) throw new Error('Error al abrir la caja');
      onRefresh();
      onClose();
    } catch (err) {
      alert('Ocurrió un error al abrir la caja');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterMovement = async () => {
    const amount = parseFloat(movementAmount);
    if (isNaN(amount) || amount <= 0 || !movementConcept) {
      return alert('Complete monto y concepto válido');
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/cash-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'movement',
          type: movementType,
          amount,
          concept: movementConcept,
        }),
      });
      if (!res.ok) throw new Error('Error al registrar movimiento');
      setMovementAmount('');
      setMovementConcept('');
      onRefresh();
      setTab('status');
    } catch (err) {
      alert('Error al registrar movimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseCash = async () => {
    const counted = parseFloat(countedCashInput);
    if (isNaN(counted) || counted < 0) return alert('Ingrese el monto contado en caja');

    setIsLoading(true);
    try {
      const res = await fetch('/api/cash-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          final_cash_counted: counted,
          notes: closeNotesInput,
        }),
      });
      if (!res.ok) throw new Error('Error al cerrar caja');
      onRefresh();
      onClose();
    } catch (err) {
      alert('Error al realizar el arqueo y cierre de caja');
    } finally {
      setIsLoading(false);
    }
  };

  const expectedCash = totals.expected_cash || 0;
  const countedCash = parseFloat(countedCashInput) || 0;
  const cashDifference = countedCash - expectedCash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Control de Caja & Arqueo</h3>
              <p className="text-xs text-slate-400">
                {isShiftOpen ? `Turno de caja N° ${shiftData.activeShift.id}` : 'No hay turno abierto'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setTab('status')}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'status' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resumen
          </button>
          {isShiftOpen && (
            <>
              <button
                onClick={() => setTab('movement')}
                className={`flex-1 py-2 rounded-xl transition ${
                  tab === 'movement' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                + / - Movimiento
              </button>
              <button
                onClick={() => setTab('close')}
                className={`flex-1 py-2 rounded-xl transition ${
                  tab === 'close' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cierre de Caja
              </button>
            </>
          )}
          {!isShiftOpen && (
            <button
              onClick={() => setTab('open')}
              className={`flex-1 py-2 rounded-xl transition ${
                tab === 'open' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Abrir Caja
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {tab === 'status' && (
            <div className="space-y-4">
              {/* Cash Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Monto Inicial</span>
                  <span className="text-lg font-bold text-white">
                    ${(totals.initial_cash || 0).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Efectivo Esperado</span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    ${expectedCash.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Ventas Mercado Pago</span>
                  <span className="text-base font-bold text-sky-400">
                    ${(totals.mp_sales || 0).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Ventas Tarjeta</span>
                  <span className="text-base font-bold text-purple-400">
                    ${(totals.card_sales || 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Extras Movimientos */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ventas en Efectivo:</span>
                  <span className="font-bold text-white">${(totals.cash_sales || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>+ Ingresos extra:</span>
                  <span className="font-bold">${(totals.ingresos_extra || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>- Egresos / Gastos:</span>
                  <span className="font-bold">${(totals.egresos_extra || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-amber-400">
                  <span>TOTAL FACTURADO:</span>
                  <span>${(totals.total_sales || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Movements history */}
              {shiftData?.movements?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">Movimientos del Turno:</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
                    {shiftData.movements.map((m: any) => (
                      <div key={m.id} className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="flex items-center gap-1">
                          {m.type === 'ingreso' ? (
                            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>{m.concept}</span>
                        </span>
                        <span className={`font-bold ${m.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.type === 'ingreso' ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'movement' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-semibold">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setMovementType('egreso')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      movementType === 'egreso'
                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    💸 Egreso / Gasto
                  </button>
                  <button
                    onClick={() => setMovementType('ingreso')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      movementType === 'ingreso'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    💵 Ingreso Extra
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Monto ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 3500"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Concepto / Motivo</label>
                <input
                  type="text"
                  placeholder="Ej: Compra de verdura en verdulería / Pago hielo"
                  value={movementConcept}
                  onChange={(e) => setMovementConcept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleRegisterMovement}
                disabled={isLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs uppercase"
              >
                Guardar Movimiento
              </button>
            </div>
          )}

          {tab === 'close' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 block">Efectivo Teórico Esperado en Cajón:</span>
                <span className="text-2xl font-black text-amber-400">
                  ${expectedCash.toLocaleString('es-AR')}
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">
                  Efectivo Contado Físicamente ($)
                </label>
                <input
                  type="number"
                  placeholder="Contar billetes en caja..."
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-lg font-bold focus:outline-none focus:border-amber-500 text-center"
                />
              </div>

              {countedCashInput && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex justify-between ${
                    cashDifference === 0
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : cashDifference > 0
                      ? 'bg-sky-950/60 border-sky-500 text-sky-300'
                      : 'bg-rose-950/60 border-rose-500 text-rose-300'
                  }`}
                >
                  <span>Diferencia de Arqueo:</span>
                  <span>
                    {cashDifference > 0 ? `+ $${cashDifference.toLocaleString('es-AR')} (Sobrante)` : cashDifference < 0 ? `- $${Math.abs(cashDifference).toLocaleString('es-AR')} (Faltante)` : 'Exacto (Sin diferencia)'}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notas de Cierre (Opcional)</label>
                <input
                  type="text"
                  placeholder="Observaciones sobre el turno..."
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <button
                onClick={handleCloseCash}
                disabled={isLoading}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg"
              >
                Cerrar Turno de Caja & Realizar Arqueo
              </button>
            </div>
          )}

          {tab === 'open' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">Monto Inicial de Caja ($)</label>
                <input
                  type="number"
                  placeholder="Monto para cambio inicial..."
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-lg font-bold focus:outline-none focus:border-amber-500 text-center"
                />
              </div>

              <button
                onClick={handleOpenCash}
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg"
              >
                Abrir Nuevo Turno de Caja
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
