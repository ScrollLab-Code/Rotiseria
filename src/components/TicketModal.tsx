'use client';

import React, { useRef } from 'react';
import { Printer, X, ChefHat, Receipt, CheckCircle } from 'lucide-react';

interface TicketModalProps {
  order: any;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header toolbar */}
        <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('ticket')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'ticket' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Ticket Cliente
            </button>
            <button
              onClick={() => setViewMode('kitchen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'kitchen' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Comanda Cocina
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ticket Content Container (Printable) */}
        <div className="p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            id="printable-ticket"
            className={`w-full max-w-[340px] bg-white text-black font-mono p-4 rounded shadow-md text-xs border border-slate-300 printable-area ${
              viewMode === 'kitchen' ? 'border-amber-400 border-2' : ''
            }`}
          >
            {/* Header */}
            {viewMode === 'ticket' ? (
              <div className="text-center mb-4 border-b border-dashed border-slate-400 pb-3">
                <h2 className="text-lg font-bold tracking-wider">ROTISERÍA EL BUEN GUSTO</h2>
                <p className="text-[10px] text-gray-600">Comidas Caseras & Minutas</p>
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
              <div className="text-center mb-4 border-b-2 border-black pb-3 bg-amber-100 -mx-4 -mt-4 p-4 rounded-t">
                <p className="text-xs font-bold text-gray-700">*** COMANDA DE COCINA ***</p>
                <h2 className="text-2xl font-extrabold my-1">ORDEN #{order.order_number}</h2>
                <p className="text-sm font-bold uppercase tracking-wider bg-black text-white py-1 px-2 rounded">
                  {order.order_type === 'delivery' ? '🛵 DELIVERY' : order.order_type === 'retiro' ? '📦 RETIRO EN LOCAL' : '🍽️ MOSTRADOR'}
                </p>
                <p className="text-[10px] text-gray-700 mt-1">Hora: {formattedDate}</p>
                {order.customer_name && <p className="text-xs font-bold mt-1">Cliente: {order.customer_name}</p>}
              </div>
            )}

            {/* Items Table */}
            <div className="mb-4">
              <div className="flex border-b border-black font-bold pb-1 mb-2 text-[11px]">
                <span className="w-12">CANT</span>
                <span className="flex-1">DESCRIPCIÓN</span>
                {viewMode === 'ticket' && <span className="w-16 text-right">TOTAL</span>}
              </div>

              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="mb-2 pb-1 border-b border-slate-200">
                  <div className="flex text-[11px] font-semibold">
                    <span className="w-12 text-sm font-bold">
                      {item.unit_type === 'kilo' ? `${item.quantity} kg` : `${item.quantity}x`}
                    </span>
                    <span className="flex-1 font-bold text-sm">{item.product_name}</span>
                    {viewMode === 'ticket' && (
                      <span className="w-16 text-right font-bold">${item.subtotal?.toLocaleString('es-AR')}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[11px] font-bold text-red-600 bg-red-50 p-1 rounded mt-0.5 pl-4 uppercase">
                      ⚠️ NOTA: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Order General Notes */}
            {order.notes && (
              <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-[11px]">
                <p className="font-bold text-yellow-900">Observaciones Generales:</p>
                <p className="text-yellow-800">{order.notes}</p>
              </div>
            )}

            {/* Delivery address details for kitchen */}
            {viewMode === 'kitchen' && order.delivery_address && (
              <div className="mb-3 p-2 bg-slate-100 rounded text-xs border border-slate-300">
                <p className="font-bold">Dirección de Envío:</p>
                <p>{order.delivery_address}</p>
                {order.delivery_notes && <p className="text-[10px] text-gray-600">({order.delivery_notes})</p>}
              </div>
            )}

            {/* Ticket Totals & Payment */}
            {viewMode === 'ticket' && (
              <div className="border-t border-black pt-2 text-xs space-y-1">
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>TOTAL A PAGAR:</span>
                  <span>${order.total_amount?.toLocaleString('es-AR')}</span>
                </div>

                <div className="flex justify-between text-[11px] pt-1 text-gray-700">
                  <span>Medio de Pago:</span>
                  <span className="font-bold uppercase">{order.payment_method}</span>
                </div>

                {order.payment_method === 'efectivo' && (
                  <>
                    <div className="flex justify-between text-[11px] text-gray-700">
                      <span>Paga con:</span>
                      <span>${order.cash_paid?.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-700 font-bold">
                      <span>Vuelto:</span>
                      <span>${order.change_amount?.toLocaleString('es-AR')}</span>
                    </div>
                  </>
                )}

                <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-gray-500">
                  <p>¡Muchas gracias por su compra!</p>
                  <p>Conserve este ticket para retirar su pedido.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global CSS for printing ticket cleanly */}
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
            padding: 5mm;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
