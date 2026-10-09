'use client';

import React, { useState } from 'react';
import { ClipboardList, Search, Printer, XCircle, Bike, ShoppingBag, Package } from 'lucide-react';
import TicketModal from './TicketModal';

interface OrdersViewProps {
  orders: any[];
  onRefresh: () => void;
}

export default function OrdersView({ orders, onRefresh }: OrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toString().includes(searchTerm) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = orderTypeFilter === 'todos' || o.order_type === orderTypeFilter;
    const matchesStatus = statusFilter === 'todos' || o.kitchen_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleUpdateStatus = async (id: number, kitchen_status: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, kitchen_status }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 border-2 border-slate-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-500 text-white border-2 border-slate-900">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-slate-900">HISTORIAL DE PEDIDOS DEL DÍA</h2>
              <p className="text-xs text-orange-600 font-bold uppercase">{orders.length} PEDIDOS REGISTRADOS</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
              <input
                type="text"
                placeholder="BUSCAR POR # O CLIENTE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-orange-50/40 border-2 border-slate-900 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none uppercase"
              />
            </div>

            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="bg-white border-2 border-slate-900 text-slate-900 text-xs font-bold px-3 py-2 focus:outline-none uppercase"
            >
              <option value="todos">TODOS LOS TIPOS</option>
              <option value="mostrador">MOSTRADOR</option>
              <option value="delivery">DELIVERY</option>
              <option value="retiro">RETIRO</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border-2 border-slate-900 text-slate-900 text-xs font-bold px-3 py-2 focus:outline-none uppercase"
            >
              <option value="todos">TODOS LOS ESTADOS</option>
              <option value="pendiente">PENDIENTES</option>
              <option value="en_preparacion">EN PREPARACIÓN</option>
              <option value="listo">LISTOS</option>
              <option value="entregado">ENTREGADOS</option>
              <option value="cancelado">CANCELADOS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border-2 border-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-900 text-white font-black uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5"># ORDEN</th>
                <th className="px-4 py-3.5">HORA</th>
                <th className="px-4 py-3.5">TIPO</th>
                <th className="px-4 py-3.5">CLIENTE / DIRECCIÓN</th>
                <th className="px-4 py-3.5">PAGO</th>
                <th className="px-4 py-3.5">ESTADO</th>
                <th className="px-4 py-3.5 text-right">TOTAL</th>
                <th className="px-4 py-3.5 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 font-bold">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 font-black uppercase">
                    NO SE ENCONTRARON PEDIDOS
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-orange-50/30 transition">
                      <td className="px-4 py-3 font-black text-orange-600 text-base">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-bold">{dateStr}</td>
                      <td className="px-4 py-3 font-black uppercase">
                        {order.order_type === 'delivery' ? (
                          <span className="flex items-center gap-1 text-sky-700 bg-sky-100 px-2 py-0.5 border border-sky-400">
                            <Bike className="w-3.5 h-3.5" /> DELIVERY
                          </span>
                        ) : order.order_type === 'retiro' ? (
                          <span className="flex items-center gap-1 text-purple-700 bg-purple-100 px-2 py-0.5 border border-purple-400">
                            <Package className="w-3.5 h-3.5" /> RETIRO
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-400">
                            <ShoppingBag className="w-3.5 h-3.5" /> MOSTRADOR
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900 uppercase">
                          {order.customer_name || 'MOSTRADOR'}
                        </div>
                        {order.delivery_address && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {order.delivery_address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="uppercase font-black text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-300">
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 ${
                          order.kitchen_status === 'pendiente'
                            ? 'bg-rose-100 text-rose-900 border-rose-600'
                            : order.kitchen_status === 'en_preparacion'
                            ? 'bg-orange-100 text-orange-900 border-orange-600'
                            : order.kitchen_status === 'listo'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-600'
                            : order.kitchen_status === 'entregado'
                            ? 'bg-slate-100 text-slate-700 border-slate-400'
                            : 'bg-red-100 text-red-900 border-red-600'
                        }`}>
                          {order.kitchen_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                        ${order.total_amount?.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-900 transition"
                            title="Ver / Imprimir Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {order.kitchen_status !== 'cancelado' && order.kitchen_status !== 'entregado' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelado')}
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white border-2 border-slate-900 transition"
                              title="Cancelar Pedido"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <TicketModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          mode="ticket"
        />
      )}
    </div>
  );
}
