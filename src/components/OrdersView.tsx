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
      {/* Search and Filters Header */}
      <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Historial de Pedidos del Día</h2>
              <p className="text-xs text-slate-500 font-medium">{orders.length} pedidos registrados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
              <input
                type="text"
                placeholder="Buscar por # o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-orange-50/40 border border-orange-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Type filter */}
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="bg-orange-50/40 border border-orange-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="todos">Todos los tipos</option>
              <option value="mostrador">Mostrador</option>
              <option value="delivery">Delivery</option>
              <option value="retiro">Retiro</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-orange-50/40 border border-orange-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_preparacion">En Preparación</option>
              <option value="listo">Listos</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table / List */}
      <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-orange-50/60 text-slate-700 font-bold uppercase tracking-wider border-b border-orange-200">
              <tr>
                <th className="px-4 py-3.5"># Orden</th>
                <th className="px-4 py-3.5">Hora</th>
                <th className="px-4 py-3.5">Tipo</th>
                <th className="px-4 py-3.5">Cliente / Dirección</th>
                <th className="px-4 py-3.5">Pago</th>
                <th className="px-4 py-3.5">Estado Cocina</th>
                <th className="px-4 py-3.5 text-right">Total</th>
                <th className="px-4 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No se encontraron pedidos.
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
                      <td className="px-4 py-3 font-black text-orange-600 text-sm">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{dateStr}</td>
                      <td className="px-4 py-3 font-semibold uppercase text-slate-700">
                        {order.order_type === 'delivery' ? (
                          <span className="flex items-center gap-1 text-sky-600">
                            <Bike className="w-3.5 h-3.5" /> Delivery
                          </span>
                        ) : order.order_type === 'retiro' ? (
                          <span className="flex items-center gap-1 text-purple-600">
                            <Package className="w-3.5 h-3.5" /> Retiro
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <ShoppingBag className="w-3.5 h-3.5" /> Mostrador
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {order.customer_name || 'Mostrador'}
                        </div>
                        {order.delivery_address && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {order.delivery_address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="uppercase font-bold text-slate-700">{order.payment_method}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            order.kitchen_status === 'pendiente'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : order.kitchen_status === 'en_preparacion'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : order.kitchen_status === 'listo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.kitchen_status === 'entregado'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
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
                            className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition"
                            title="Ver / Imprimir Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {order.kitchen_status !== 'cancelado' && order.kitchen_status !== 'entregado' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelado')}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
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

      {/* Ticket Modal */}
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
