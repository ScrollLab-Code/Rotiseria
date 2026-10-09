'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Utensils, 
  Scale, 
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import TicketModal from './TicketModal';

interface POSViewProps {
  products: any[];
  categories: any[];
  onOrderCreated: () => void;
  shiftData: any;
}

export default function POSView({ products, categories, onOrderCreated, shiftData }: POSViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<any[]>([]);
  const [orderType, setOrderType] = useState<'mostrador' | 'delivery' | 'retiro'>('mostrador');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'mercadopago' | 'tarjeta'>('efectivo');
  const [cashPaid, setCashPaid] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');

  // Modal for weight input (for kilo items)
  const [weightModalItem, setWeightModalItem] = useState<any | null>(null);
  const [inputWeightGrams, setInputWeightGrams] = useState<string>('500'); // default 500g

  // Modal for editing item notes in cart
  const [editingNotesIndex, setEditingNotesIndex] = useState<number | null>(null);
  const [itemNoteInput, setItemNoteInput] = useState('');

  // Created order modal for instant print
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch && p.available === 1;
  });

  const addToCart = (product: any, quantity: number = 1, notes: string = '') => {
    // If unit type is kilo, prompt weight modal first if quantity is not predefined
    if (product.unit_type === 'kilo' && quantity === 1 && !notes) {
      setWeightModalItem(product);
      setInputWeightGrams('500');
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product_id === product.id && item.notes === notes
      );

      if (existingIdx > -1) {
        const newCart = [...prev];
        const newQty = newCart[existingIdx].quantity + quantity;
        newCart[existingIdx].quantity = newQty;
        newCart[existingIdx].subtotal = newQty * product.price;
        return newCart;
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            unit_price: product.price,
            quantity,
            unit_type: product.unit_type,
            subtotal: quantity * product.price,
            notes,
          },
        ];
      }
    });
  };

  const handleAddWeightItem = () => {
    if (!weightModalItem) return;
    const kilos = parseFloat(inputWeightGrams) / 1000;
    if (isNaN(kilos) || kilos <= 0) return;

    addToCart(weightModalItem, kilos);
    setWeightModalItem(null);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      const item = newCart[index];
      const step = item.unit_type === 'kilo' ? 0.25 : 1;
      const newQty = item.quantity + delta * step;

      if (newQty <= 0) {
        return newCart.filter((_, i) => i !== index);
      }

      item.quantity = Number(newQty.toFixed(3));
      item.subtotal = item.quantity * item.unit_price;
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const saveItemNotes = () => {
    if (editingNotesIndex === null) return;
    setCart((prev) => {
      const newCart = [...prev];
      newCart[editingNotesIndex].notes = itemNoteInput;
      return newCart;
    });
    setEditingNotesIndex(null);
    setItemNoteInput('');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const numericCashPaid = parseFloat(cashPaid) || 0;
  const changeAmount = paymentMethod === 'efectivo' && numericCashPaid > cartTotal ? numericCashPaid - cartTotal : 0;

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'delivery' && (!customerName || !deliveryAddress)) {
      alert('Por favor complete el nombre del cliente y la dirección de envío');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        order_type: orderType,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes,
        payment_method: paymentMethod,
        payment_status: 'pagado',
        kitchen_status: 'pendiente',
        total_amount: cartTotal,
        cash_paid: numericCashPaid,
        change_amount: changeAmount,
        notes: orderNotes,
        items: cart,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al crear el pedido');

      const data = await res.json();
      setCreatedOrder(data);

      // Reset cart and form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setDeliveryNotes('');
      setCashPaid('');
      setOrderNotes('');

      onOrderCreated();
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('Ocurrió un error al registrar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-5rem)]">
      {/* LEFT SECTION: Products & Categories (7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Search & Category Filter */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          {/* Categories Pills */}
          <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos los Platos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 rounded-2xl p-3.5 text-left transition-all flex flex-col justify-between group shadow-sm relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {product.category_name}
                  </span>
                  {product.unit_type === 'kilo' ? (
                    <span className="bg-purple-950 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-800 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Por Kilo
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {product.unit_type}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="text-base font-extrabold text-amber-400">
                  ${product.price.toLocaleString('es-AR')}
                </span>
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-all">
                  <Plus className="w-4 h-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SECTION: Active Order / Cart (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between shadow-xl">
        <div className="space-y-4">
          {/* Order Header & Type Selector */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              Nueva Comanda
            </h2>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setOrderType('mostrador')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  orderType === 'mostrador'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🍽️ Mostrador
              </button>
              <button
                onClick={() => setOrderType('retiro')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  orderType === 'retiro'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📦 Retiro
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  orderType === 'delivery'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛵 Delivery
              </button>
            </div>
          </div>

          {/* Delivery Details (if delivery or retiro) */}
          {(orderType === 'delivery' || orderType === 'retiro') && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nombre del Cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {orderType === 'delivery' && (
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Dirección Completa (Calle, Altura, Dpto)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>El pedido está vacío.</p>
                <p className="text-[11px] text-slate-600 mt-1">Haz clic en los platos para agregarlos a la comanda.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between space-x-2 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{item.product_name}</span>
                      <span className="text-amber-400">${item.subtotal.toLocaleString('es-AR')}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>
                        ${item.unit_price.toLocaleString('es-AR')} / {item.unit_type}
                      </span>

                      {/* Item Notes Button */}
                      <button
                        onClick={() => {
                          setEditingNotesIndex(index);
                          setItemNoteInput(item.notes || '');
                        }}
                        className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded ${
                          item.notes
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {item.notes ? `Nota: ${item.notes}` : '+ Nota'}
                      </button>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-white px-1 text-xs">
                      {item.unit_type === 'kilo' ? `${item.quantity}kg` : item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer: Payment & Total */}
        <div className="border-t border-slate-800 pt-4 space-y-3 mt-4">
          {/* Payment Method Selector */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <DollarSign className="w-4 h-4" /> Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('mercadopago')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'mercadopago'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" /> M. Pago
              </button>
              <button
                onClick={() => setPaymentMethod('tarjeta')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Tarjeta
              </button>
            </div>
          </div>

          {/* Cash Payment & Change Calculator */}
          {paymentMethod === 'efectivo' && (
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block">Paga con ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 10000"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block">Vuelto a entregar</label>
                <div className="py-1 px-2 font-extrabold text-emerald-400 text-sm">
                  ${changeAmount > 0 ? changeAmount.toLocaleString('es-AR') : '0'}
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          <input
            type="text"
            placeholder="Observaciones de la comanda (Ej. Para comer acá / Retira 20:30hs)"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          {/* Total & Confirm Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-base font-extrabold text-white">
              <span>TOTAL</span>
              <span className="text-amber-400 text-xl">${cartTotal.toLocaleString('es-AR')}</span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                cart.length > 0 && !isSubmitting
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {isSubmitting ? 'Procesando...' : `Confirmar Comanda ($${cartTotal.toLocaleString('es-AR')})`}
            </button>
          </div>
        </div>
      </div>

      {/* WEIGHT MODAL FOR KILO ITEMS */}
      {weightModalItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-950 text-purple-400 rounded-xl">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{weightModalItem.name}</h3>
                <p className="text-xs text-slate-400">${weightModalItem.price.toLocaleString('es-AR')} por Kilo</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">Ingresar gramos (g):</label>
              <input
                type="number"
                step="50"
                value={inputWeightGrams}
                onChange={(e) => setInputWeightGrams(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-lg font-bold focus:outline-none focus:border-amber-500 text-center"
              />
              <p className="text-xs text-amber-400 font-bold text-center mt-2">
                = {(parseFloat(inputWeightGrams) / 1000 || 0).toFixed(3)} kg ($
                {(((parseFloat(inputWeightGrams) / 1000) || 0) * weightModalItem.price).toLocaleString('es-AR')})
              </p>
            </div>

            {/* Quick Weight Buttons */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              {['250', '500', '750', '1000'].map((grams) => (
                <button
                  key={grams}
                  onClick={() => setInputWeightGrams(grams)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold"
                >
                  {grams}g
                </button>
              ))}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setWeightModalItem(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddWeightItem}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM NOTES MODAL */}
      {editingNotesIndex !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-3">
            <h3 className="font-bold text-white text-sm">Nota de preparación para el plato</h3>
            <input
              type="text"
              placeholder="Ej: Sin cebolla, Salsa aparte, Bien dorado"
              value={itemNoteInput}
              onChange={(e) => setItemNoteInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500"
            />
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setEditingNotesIndex(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={saveItemNotes}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs"
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATED ORDER TICKET MODAL */}
      {createdOrder && (
        <TicketModal
          order={createdOrder}
          onClose={() => setCreatedOrder(null)}
          mode="kitchen"
        />
      )}
    </div>
  );
}
