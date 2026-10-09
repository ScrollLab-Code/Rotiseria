'use client';

import React, { useState } from 'react';
import { ClipboardList, Search, Printer, CheckCircle2, Clock, XCircle, Eye, Bike, ShoppingBag, Package } from 'lucide-react';
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
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Historial de Pedidos del Día</h2>
              <p className="text-xs text-slate-400">{orders.length} pedidos registrados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por # o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Type filter */}
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
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
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
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
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
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
                    <tr key={order.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-extrabold text-amber-400 text-sm">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{dateStr}</td>
                      <td className="px-4 py-3 font-medium uppercase text-slate-300">
                        {order.order_type === 'delivery' ? (
                          <span className="flex items-center gap-1 text-sky-400">
                            <Bike className="w-3.5 h-3.5" /> Delivery
                          </span>
                        ) : order.order_type === 'retiro' ? (
                          <span className="flex items-center gap-1 text-purple-400">
                            <Package className="w-3.5 h-3.5" /> Retiro
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <ShoppingBag className="w-3.5 h-3.5" /> Mostrador
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">
                          {order.customer_name || 'Mostrador'}
                        </div>
                        {order.delivery_address && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {order.delivery_address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="uppercase font-bold text-slate-200">{order.payment_method}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            order.kitchen_status === 'pendiente'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : order.kitchen_status === 'en_preparacion'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : order.kitchen_status === 'listo'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : order.kitchen_status === 'entregado'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-red-950 text-red-400'
                          }`}
                        >
                          {order.kitchen_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-white text-sm">
                        ${order.total_amount?.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                            title="Ver / Imprimir Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {order.kitchen_status !== 'cancelado' && order.kitchen_status !== 'entregado' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelado')}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg transition"
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
