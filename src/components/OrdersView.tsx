'use client';

import React, { useState } from 'react';
import { ClipboardList, Search, Printer, XCircle, Bike, ShoppingBag, Package } from 'lucide-react';
import TicketModal from './TicketModal';
import type { Order, KitchenStatus } from '@/lib/types';

interface OrdersViewProps {
  orders: Order[];
  onRefresh: () => void;
}

export default function OrdersView({ orders, onRefresh }: OrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toString().includes(searchTerm) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = orderTypeFilter === 'todos' || o.order_type === orderTypeFilter;
    const matchesStatus = statusFilter === 'todos' || o.kitchen_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleUpdateStatus = async (id: number, kitchen_status: KitchenStatus) => {
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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-3 border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-orange-500 text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Historial de Pedidos del Día</h2>
              <p className="text-xs text-orange-600 font-semibold">{orders.length} pedidos registrados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por # o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="mostrador">Mostrador</option>
              <option value="delivery">Delivery</option>
              <option value="retiro">Retiro</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_preparacion">En Preparación</option>
              <option value="listo">Listos</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-800 text-white font-semibold">
              <tr>
                <th className="px-3.5 py-2.5"># Orden</th>
                <th className="px-3.5 py-2.5">Hora</th>
                <th className="px-3.5 py-2.5">Tipo</th>
                <th className="px-3.5 py-2.5">Cliente / Dirección</th>
                <th className="px-3.5 py-2.5">Pago</th>
                <th className="px-3.5 py-2.5">Estado</th>
                <th className="px-3.5 py-2.5 text-right">Total</th>
                <th className="px-3.5 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400 font-semibold">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2 font-bold text-orange-600 text-sm">
                        #{order.order_number}
                      </td>
                      <td className="px-3.5 py-2 text-slate-500">{dateStr}</td>
                      <td className="px-3.5 py-2 font-semibold">
                        {order.order_type === 'delivery' ? (
                          <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 border border-sky-200">
                            <Bike className="w-3 h-3" /> Delivery
                          </span>
                        ) : order.order_type === 'retiro' ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200">
                            <Package className="w-3 h-3" /> Retiro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                            <ShoppingBag className="w-3 h-3" /> Mostrador
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2">
                        <div className="font-semibold text-slate-900">
                          {order.customer_name || 'Mostrador'}
                        </div>
                        {order.delivery_address && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {order.delivery_address}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-2">
                        <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2 py-0.5 border border-slate-200 text-[11px]">
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="px-3.5 py-2">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold capitalize border ${
                          order.kitchen_status === 'pendiente'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : order.kitchen_status === 'en_preparacion'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : order.kitchen_status === 'listo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.kitchen_status === 'entregado'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {order.kitchen_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-right font-bold text-slate-900">
                        ${order.total_amount?.toLocaleString('es-AR')}
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                            title="Ver / Imprimir Ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {order.kitchen_status !== 'cancelado' && order.kitchen_status !== 'entregado' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelado')}
                              className="p-1 bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                              title="Cancelar Pedido"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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
