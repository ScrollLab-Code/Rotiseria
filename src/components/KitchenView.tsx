'use client';

import React, { useState } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, Bike, ShoppingBag, Package, RefreshCw, Printer } from 'lucide-react';
import TicketModal from './TicketModal';

interface KitchenViewProps {
  orders: any[];
  onRefresh: () => void;
}

export default function KitchenView({ orders, onRefresh }: KitchenViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('activos');
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<any | null>(null);

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
      <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Monitor de Cocina (KDS)</h2>
            <p className="text-xs text-slate-500 font-medium">
              {activeOrders.length} pedido(s) pendientes de elaboración
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-orange-50/60 p-1 rounded-xl border border-orange-200 text-xs font-bold">
            <button
              onClick={() => setSelectedStatus('activos')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'activos' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              En Curso ({activeOrders.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pendiente')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'pendiente' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setSelectedStatus('en_preparacion')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'en_preparacion' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              En Horno / Fuego
            </button>
            <button
              onClick={() => setSelectedStatus('listo')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'listo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Listos
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 rounded-xl transition border border-slate-200"
            title="Actualizar comision"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-orange-200 text-slate-400 shadow-sm">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30 text-orange-500" />
          <p className="text-base font-bold text-slate-700">No hay comandas en este estado.</p>
          <p className="text-xs text-slate-500 mt-1">Los nuevos pedidos aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const elapsed = getMinutesElapsed(order.created_at);
            const isUrgent = elapsed > 20;

            let cardBorder = 'border-orange-200';
            let badgeBg = 'bg-slate-100 text-slate-700';

            if (order.kitchen_status === 'pendiente') {
              cardBorder = isUrgent ? 'border-rose-400 shadow-rose-100' : 'border-orange-300';
              badgeBg = 'bg-rose-50 text-rose-700 border border-rose-200';
            } else if (order.kitchen_status === 'en_preparacion') {
              cardBorder = 'border-orange-400';
              badgeBg = 'bg-orange-50 text-orange-700 border border-orange-300';
            } else if (order.kitchen_status === 'listo') {
              cardBorder = 'border-emerald-400';
              badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-300';
            }

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border ${cardBorder} shadow-sm p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden`}
              >
                <div>
                  {/* Order Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black text-orange-600">#{order.order_number}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeBg}`}>
                        {order.kitchen_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-lg ${
                          isUrgent ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed} min</span>
                      </div>

                      <button
                        onClick={() => setSelectedTicketOrder(order)}
                        className="p-1.5 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 rounded-lg transition"
                        title="Ver Comanda"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order Type & Client info */}
                  <div className="mt-3 flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-800">
                      {order.order_type === 'delivery' ? (
                        <>
                          <Bike className="w-4 h-4 text-sky-600" />
                          <span className="text-sky-600">DELIVERY</span>
                        </>
                      ) : order.order_type === 'retiro' ? (
                        <>
                          <Package className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-600">RETIRO EN LOCAL</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600">MOSTRADOR</span>
                        </>
                      )}
                    </span>

                    {order.customer_name && (
                      <span className="text-slate-800 font-bold">{order.customer_name}</span>
                    )}
                  </div>

                  {order.delivery_address && (
                    <p className="text-xs text-slate-600 mt-1 font-semibold bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                      📍 {order.delivery_address}
                    </p>
                  )}

                  {/* Items list */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ítems a preparar:</p>
                    <div className="space-y-1.5">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="bg-orange-50/30 p-2.5 rounded-xl border border-orange-100 text-xs">
                          <div className="flex items-center justify-between font-extrabold text-slate-900">
                            <span>
                              <span className="text-orange-600 font-black text-sm mr-2">
                                {item.unit_type === 'kilo' ? `${item.quantity} kg` : `${item.quantity}x`}
                              </span>
                              {item.product_name}
                            </span>
                          </div>

                          {item.notes && (
                            <p className="mt-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200 uppercase tracking-wide">
                              ⚠️ NOTA: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General order notes */}
                  {order.notes && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                      📌 <span className="font-bold">Observación:</span> {order.notes}
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex space-x-2">
                  {order.kitchen_status === 'pendiente' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
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
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2"
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
