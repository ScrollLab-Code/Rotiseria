'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import type { Order, OrderItem } from '@/lib/types';

interface TicketModalProps {
  order: Order;
  onClose: () => void;
  mode?: 'ticket' | 'kitchen';
}

export default function TicketModal({ order, onClose, mode = 'ticket' }: TicketModalProps) {
  const [viewMode, setViewMode] = React.useState<'ticket' | 'kitchen'>(mode);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 text-slate-100 max-w-sm w-full border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header toolbar */}
        <div className="p-3 bg-slate-800 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setViewMode('ticket')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors border ${
                viewMode === 'ticket' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              Ticket Cliente
            </button>
            <button
              onClick={() => setViewMode('kitchen')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors border ${
                viewMode === 'kitchen' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              Comanda Cocina
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ticket Content Container */}
        <div className="p-4 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            id="printable-ticket"
            className={`w-full max-w-[320px] bg-white text-black font-mono p-3 text-xs border border-slate-300 printable-area ${
              viewMode === 'kitchen' ? 'border-amber-400 border-2' : ''
            }`}
          >
            {/* Header */}
            {viewMode === 'ticket' ? (
              <div className="text-center mb-3 border-b border-dashed border-slate-400 pb-2">
                <h2 className="text-base font-bold tracking-wider">EMPANADAS PICÚN</h2>
                <p className="text-[10px] text-gray-600">Rotisería & Comidas Caseras</p>
                <p className="text-[10px] text-gray-600">Tel: (011) 4567-8900</p>
                <div className="mt-2 text-left text-[11px] space-y-0.5">
                  <p><strong>Pedido N°: #{order.order_number}</strong></p>
                  <p>Fecha: {formattedDate}</p>
                  <p>Tipo: <span className="uppercase font-bold">{order.order_type}</span></p>
                  {order.customer_name && <p>Cliente: {order.customer_name}</p>}
                  {order.customer_phone && <p>Tel: {order.customer_phone}</p>}
                  {order.delivery_address && <p>Dirección: {order.delivery_address}</p>}
                </div>
              </div>
            ) : (
              /* Kitchen Comanda Header */
              <div className="text-center mb-3 border-b-2 border-black pb-2 bg-amber-100 -mx-3 -mt-3 p-3">
                <p className="text-[10px] font-bold text-gray-700">*** COMANDA DE COCINA ***</p>
                <h2 className="text-xl font-extrabold my-1">ORDEN #{order.order_number}</h2>
                <p className="text-xs font-bold uppercase tracking-wider bg-black text-white py-0.5 px-2">
                  {order.order_type === 'delivery' ? '🛵 DELIVERY' : order.order_type === 'retiro' ? '📦 RETIRO EN LOCAL' : '🍽️ MOSTRADOR'}
                </p>
                <p className="text-[10px] text-gray-700 mt-1">Hora: {formattedDate}</p>
                {order.customer_name && <p className="text-xs font-bold mt-1">Cliente: {order.customer_name}</p>}
              </div>
            )}

            {/* Items Table */}
            <div className="mb-3">
              <div className="flex border-b border-black font-bold pb-1 mb-1.5 text-[11px]">
                <span className="w-10">CANT</span>
                <span className="flex-1">DESCRIPCIÓN</span>
                {viewMode === 'ticket' && <span className="w-14 text-right">TOTAL</span>}
              </div>

              {order.items?.map((item: OrderItem, idx: number) => (
                <div key={idx} className="mb-1.5 pb-1 border-b border-slate-200">
                  <div className="flex text-[11px] font-semibold">
                    <span className="w-10 font-bold">
                      {item.unit_type === 'kilo' ? `${item.quantity}kg` : `${item.quantity}x`}
                    </span>
                    <span className="flex-1 font-bold">{item.product_name}</span>
                    {viewMode === 'ticket' && (
                      <span className="w-14 text-right font-bold">${item.subtotal?.toLocaleString('es-AR')}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[10px] font-bold text-red-600 bg-red-50 p-0.5 mt-0.5 pl-2 uppercase">
                      ⚠️ NOTA: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Order General Notes */}
            {order.notes && (
              <div className="mb-2 p-1.5 bg-yellow-100 border border-yellow-300 text-[10px]">
                <p className="font-bold text-yellow-900">Observaciones Generales:</p>
                <p className="text-yellow-800">{order.notes}</p>
              </div>
            )}

            {/* Delivery address details for kitchen */}
            {viewMode === 'kitchen' && order.delivery_address && (
              <div className="mb-2 p-1.5 bg-slate-100 text-[11px] border border-slate-300">
                <p className="font-bold">Dirección de Envío:</p>
                <p>{order.delivery_address}</p>
                {order.delivery_notes && <p className="text-[10px] text-gray-600">({order.delivery_notes})</p>}
              </div>
            )}

            {/* Ticket Totals & Payment */}
            {viewMode === 'ticket' && (
              <div className="border-t border-black pt-1.5 text-xs space-y-0.5">
                <div className="flex justify-between font-bold text-xs pt-0.5">
                  <span>TOTAL A PAGAR:</span>
                  <span>${order.total_amount?.toLocaleString('es-AR')}</span>
                </div>

                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Medio de Pago:</span>
                  <span className="font-bold uppercase">{order.payment_method}</span>
                </div>

                {order.payment_method === 'efectivo' && (
                  <>
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <span>Paga con:</span>
                      <span>${order.cash_paid?.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700 font-bold">
                      <span>Vuelto:</span>
                      <span>${order.change_amount?.toLocaleString('es-AR')}</span>
                    </div>
                  </>
                )}

                <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[9px] text-gray-500">
                  <p>¡Muchas gracias por su compra!</p>
                  <p>Conserve este ticket para retirar su pedido.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ticket, #printable-ticket * {
            visibility: visible;
          }
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            margin: 0;
            padding: 4mm;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
