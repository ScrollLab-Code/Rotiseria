'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, Bike, ShoppingBag, Package, RefreshCw, Printer } from 'lucide-react';
import TicketModal from './TicketModal';

interface KitchenViewProps {
  orders: any[];
  onRefresh: () => void;
}

export default function KitchenView({ orders, onRefresh }: KitchenViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('activos');
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<any | null>(null);

  // Filter orders
  const activeOrders = orders.filter((o) => o.kitchen_status !== 'entregado' && o.kitchen_status !== 'cancelado');
  const filteredOrders = orders.filter((o) => {
    if (selectedStatus === 'activos') return o.kitchen_status !== 'entregado' && o.kitchen_status !== 'cancelado';
    if (selectedStatus === 'todos') return true;
    return o.kitchen_status === selectedStatus;
  });

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, kitchen_status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const getMinutesElapsed = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return Math.floor((now - created) / 60000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Status Filter */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Monitor de Cocina (KDS)</h2>
            <p className="text-xs text-slate-400">
              {activeOrders.length} pedido(s) pendientes de elaboración
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setSelectedStatus('activos')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'activos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              En Curso ({activeOrders.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pendiente')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'pendiente' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setSelectedStatus('en_preparacion')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'en_preparacion' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              En Horno / Fuego
            </button>
            <button
              onClick={() => setSelectedStatus('listo')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'listo' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Listos
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Actualizar comisiones"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-bold text-slate-400">No hay comandas en este estado.</p>
          <p className="text-xs text-slate-600 mt-1">Los nuevos pedidos apareciendo aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const elapsed = getMinutesElapsed(order.created_at);
            const isUrgent = elapsed > 20;

            let cardBorder = 'border-slate-800';
            let badgeBg = 'bg-slate-800 text-slate-300';

            if (order.kitchen_status === 'pendiente') {
              cardBorder = isUrgent ? 'border-rose-500 shadow-rose-500/10' : 'border-amber-500/50';
              badgeBg = 'bg-rose-950 text-rose-400 border border-rose-800';
            } else if (order.kitchen_status === 'en_preparacion') {
              cardBorder = 'border-amber-500';
              badgeBg = 'bg-amber-950 text-amber-400 border border-amber-800';
            } else if (order.kitchen_status === 'listo') {
              cardBorder = 'border-emerald-500';
              badgeBg = 'bg-emerald-950 text-emerald-400 border border-emerald-800';
            }

            return (
              <div
                key={order.id}
                className={`bg-slate-900 rounded-2xl border ${cardBorder} shadow-lg p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden`}
              >
                <div>
                  {/* Order Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black text-amber-400">#{order.order_number}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeBg}`}>
                        {order.kitchen_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-lg ${
                          isUrgent ? 'bg-rose-900/60 text-rose-300 animate-pulse' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed} min</span>
                      </div>

                      <button
                        onClick={() => setSelectedTicketOrder(order)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Ver Comanda"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order Type & Client info */}
                  <div className="mt-3 flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      {order.order_type === 'delivery' ? (
                        <>
                          <Bike className="w-4 h-4 text-sky-400" />
                          <span className="text-sky-400">DELIVERY</span>
                        </>
                      ) : order.order_type === 'retiro' ? (
                        <>
                          <Package className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400">RETIRO EN LOCAL</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">MOSTRADOR</span>
                        </>
                      )}
                    </span>

                    {order.customer_name && (
                      <span className="text-slate-300 font-semibold">{order.customer_name}</span>
                    )}
                  </div>

                  {order.delivery_address && (
                    <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-950 p-2 rounded-lg border border-slate-800">
                      📍 {order.delivery_address}
                    </p>
                  )}

                  {/* Items list */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ítems a preparar:</p>
                    <div className="space-y-1.5">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                          <div className="flex items-center justify-between font-extrabold text-white">
                            <span>
                              <span className="text-amber-400 font-black text-sm mr-2">
                                {item.unit_type === 'kilo' ? `${item.quantity} kg` : `${item.quantity}x`}
                              </span>
                              {item.product_name}
                            </span>
                          </div>

                          {item.notes && (
                            <p className="mt-1 text-[11px] font-extrabold text-rose-400 bg-rose-950/60 p-1.5 rounded-lg border border-rose-900/80 uppercase tracking-wide">
                              ⚠️ NOTA: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General order notes */}
                  {order.notes && (
                    <div className="mt-3 p-2 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 font-medium">
                      📌 <span className="font-bold">Observación:</span> {order.notes}
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex space-x-2">
                  {order.kitchen_status === 'pendiente' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
                    >
                      <Flame className="w-4 h-4" /> Empezar a Preparar
                    </button>
                  )}

                  {order.kitchen_status === 'en_preparacion' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'listo')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Marcar como LISTO
                    </button>
                  )}

                  {order.kitchen_status === 'listo' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'entregado')}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" /> Entregado / Despachado
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TICKET MODAL */}
      {selectedTicketOrder && (
        <TicketModal
          order={selectedTicketOrder}
          onClose={() => setSelectedTicketOrder(null)}
          mode="kitchen"
        />
      )}
    </div>
  );
}
