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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-orange-500 text-white">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Monitor de Cocina (KDS)</h2>
            <p className="text-xs text-orange-600 font-semibold">
              {activeOrders.length} pedido(s) en curso
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-slate-200 text-xs font-semibold bg-white">
            {[
              { id: 'activos', label: `En Curso (${activeOrders.length})`, color: 'bg-orange-500' },
              { id: 'pendiente', label: 'Pendientes', color: 'bg-rose-600' },
              { id: 'en_preparacion', label: 'En Preparación', color: 'bg-amber-500' },
              { id: 'listo', label: 'Listos', color: 'bg-emerald-600' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`px-3 py-1.5 transition border-r last:border-r-0 border-slate-200 ${
                  selectedStatus === s.id ? `${s.color} text-white` : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 text-white border border-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 text-slate-500">
          <ChefHat className="w-10 h-10 mx-auto mb-2 opacity-30 text-orange-600" />
          <p className="text-sm font-semibold text-slate-700">No hay comandas en este estado</p>
          <p className="text-xs text-slate-400 mt-0.5">Los nuevos pedidos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredOrders.map((order) => {
            const elapsed = getMinutesElapsed(order.created_at);
            const isUrgent = elapsed > 20;

            let leftBorder = 'border-l-4 border-l-orange-400';
            let badgeCls = 'bg-slate-100 text-slate-700';

            if (order.kitchen_status === 'pendiente') {
              leftBorder = isUrgent ? 'border-l-4 border-l-rose-600' : 'border-l-4 border-l-amber-500';
              badgeCls = 'bg-rose-600 text-white';
            } else if (order.kitchen_status === 'en_preparacion') {
              leftBorder = 'border-l-4 border-l-orange-500';
              badgeCls = 'bg-orange-500 text-white';
            } else if (order.kitchen_status === 'listo') {
              leftBorder = 'border-l-4 border-l-emerald-600';
              badgeCls = 'bg-emerald-600 text-white';
            }

            return (
              <div
                key={order.id}
                className={`bg-white border border-slate-200 ${leftBorder} flex flex-col justify-between space-y-3 overflow-hidden`}
              >
                {/* Card Header */}
                <div className="p-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-extrabold text-orange-600">#{order.order_number}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${badgeCls}`}>
                        {order.kitchen_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <div className={`flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 border ${
                        isUrgent ? 'bg-rose-600 text-white border-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{elapsed} min</span>
                      </div>

                      <button
                        onClick={() => setSelectedTicketOrder(order)}
                        className="p-1 bg-slate-800 text-white border border-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Order Type & Client */}
                  <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                    {order.order_type === 'delivery' ? (
                      <span className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 border border-sky-200">
                        <Bike className="w-3.5 h-3.5" /> Delivery
                      </span>
                    ) : order.order_type === 'retiro' ? (
                      <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200">
                        <Package className="w-3.5 h-3.5" /> Retiro
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <ShoppingBag className="w-3.5 h-3.5" /> Mostrador
                      </span>
                    )}
                    {order.customer_name && (
                      <span className="text-slate-900 font-bold">{order.customer_name}</span>
                    )}
                  </div>

                  {order.delivery_address && (
                    <p className="text-xs text-slate-700 mt-1.5 font-medium bg-orange-50/50 p-1.5 border-l-2 border-orange-400">
                      📍 {order.delivery_address}
                    </p>
                  )}

                  {/* Items */}
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items a preparar:</p>
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-2 border border-slate-100 text-xs">
                        <div className="flex items-center font-bold text-slate-900">
                          <span className="text-orange-600 font-extrabold text-xs mr-2 min-w-[36px]">
                            {item.unit_type === 'kilo' ? `${item.quantity}kg` : `${item.quantity}x`}
                          </span>
                          {item.product_name}
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-700 bg-rose-50 p-1 border-l-2 border-rose-500">
                            ⚠️ Nota: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-2 p-1.5 bg-amber-50 border-l-2 border-amber-400 text-xs text-amber-900 font-medium">
                      📌 {order.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-200 flex">
                  {order.kitchen_status === 'pendiente' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5" /> Iniciar Preparación
                    </button>
                  )}
                  {order.kitchen_status === 'en_preparacion' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'listo')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Listo
                    </button>
                  )}
                  {order.kitchen_status === 'listo' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'entregado')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" /> Entregado / Despachado
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
