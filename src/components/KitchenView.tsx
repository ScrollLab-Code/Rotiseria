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
      {/* Header */}
      <div className="bg-white p-4 border-2 border-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-500 text-white border-2 border-slate-900">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900">MONITOR DE COCINA (KDS)</h2>
            <p className="text-xs text-orange-600 font-bold uppercase">
              {activeOrders.length} PEDIDO(S) EN CURSO
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border-2 border-slate-900 text-xs font-black bg-white">
            {[
              { id: 'activos', label: `EN CURSO (${activeOrders.length})`, color: 'bg-orange-500' },
              { id: 'pendiente', label: 'PENDIENTES', color: 'bg-rose-600' },
              { id: 'en_preparacion', label: 'EN PREPARACIÓN', color: 'bg-amber-500' },
              { id: 'listo', label: 'LISTOS', color: 'bg-emerald-600' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`px-3 py-2 uppercase transition border-r last:border-r-0 border-slate-900 ${
                  selectedStatus === s.id ? `${s.color} text-white` : 'text-slate-700 hover:bg-orange-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-900 text-white border-2 border-slate-900 hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-slate-400 text-slate-500">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30 text-orange-600" />
          <p className="text-base font-black uppercase text-slate-700">NO HAY COMANDAS EN ESTE ESTADO</p>
          <p className="text-xs text-slate-500 mt-1 uppercase font-bold">LOS NUEVOS PEDIDOS APARECERÁN AQUÍ AUTOMÁTICAMENTE</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const elapsed = getMinutesElapsed(order.created_at);
            const isUrgent = elapsed > 20;

            let leftBorder = 'border-l-4 border-l-orange-400';
            let badgeCls = 'bg-slate-200 text-slate-900';

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
                className={`bg-white border-2 border-slate-900 ${leftBorder} flex flex-col justify-between space-y-4 overflow-hidden`}
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl font-black text-orange-600">#{order.order_number}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 ${badgeCls}`}>
                        {order.kitchen_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 text-xs font-black px-2 py-1 border ${
                        isUrgent ? 'bg-rose-600 text-white border-rose-900 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed} MIN</span>
                      </div>

                      <button
                        onClick={() => setSelectedTicketOrder(order)}
                        className="p-1.5 bg-slate-900 text-white border border-slate-900 hover:bg-slate-700 transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order Type & Client */}
                  <div className="mt-3 flex items-center justify-between text-xs font-black uppercase">
                    {order.order_type === 'delivery' ? (
                      <span className="flex items-center gap-1.5 text-sky-700 bg-sky-100 px-2 py-0.5 border border-sky-400">
                        <Bike className="w-4 h-4" /> DELIVERY
                      </span>
                    ) : order.order_type === 'retiro' ? (
                      <span className="flex items-center gap-1.5 text-purple-700 bg-purple-100 px-2 py-0.5 border border-purple-400">
                        <Package className="w-4 h-4" /> RETIRO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-400">
                        <ShoppingBag className="w-4 h-4" /> MOSTRADOR
                      </span>
                    )}
                    {order.customer_name && (
                      <span className="text-slate-900 font-black">{order.customer_name}</span>
                    )}
                  </div>

                  {order.delivery_address && (
                    <p className="text-xs text-slate-700 mt-2 font-bold bg-orange-50/50 p-2 border-l-4 border-orange-500">
                      📍 {order.delivery_address}
                    </p>
                  )}

                  {/* Items */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ITEMS A PREPARAR:</p>
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-2.5 border-2 border-slate-200 text-xs">
                        <div className="flex items-center font-black text-slate-900 uppercase">
                          <span className="text-orange-600 font-black text-sm mr-2 min-w-[40px]">
                            {item.unit_type === 'kilo' ? `${item.quantity}KG` : `${item.quantity}x`}
                          </span>
                          {item.product_name}
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-[11px] font-black text-rose-700 bg-rose-100 p-1.5 border-l-4 border-rose-600 uppercase">
                            ⚠️ NOTA: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-3 p-2 bg-amber-100 border-l-4 border-amber-500 text-xs text-amber-900 font-bold uppercase">
                      📌 {order.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t-2 border-slate-900 flex">
                  {order.kitchen_status === 'pendiente' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase flex items-center justify-center gap-2"
                    >
                      <Flame className="w-4 h-4" /> INICIAR PREPARACIÓN
                    </button>
                  )}
                  {order.kitchen_status === 'en_preparacion' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'listo')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> MARCAR COMO LISTO
                    </button>
                  )}
                  {order.kitchen_status === 'listo' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'entregado')}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-white font-black text-xs uppercase flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" /> ENTREGADO / DESPACHADO
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
