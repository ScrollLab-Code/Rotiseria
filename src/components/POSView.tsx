'use client';

import React, { useState } from 'react';
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
  Scale, 
  MessageSquare,
  CheckCircle2,
  Utensils
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
  const [inputWeightGrams, setInputWeightGrams] = useState<string>('500');

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-6rem)]">
      {/* LEFT SECTION: McDonald's Kiosk Style Product Grid (7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Search & Category Filter Header (Square) */}
        <div className="bg-white p-4 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
            <input
              type="text"
              placeholder="BUSCAR EN EL MENÚ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-orange-50/30 border-2 border-slate-900 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:bg-white text-xs uppercase"
            />
          </div>

          {/* Category Tabs (Square Buttons) */}
          <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider transition-all border-2 ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-orange-50 hover:border-orange-500'
              }`}
            >
              TODOS LOS PLATOS
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider transition-all border-2 ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-orange-50 hover:border-orange-500'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid (McDonald's Photo Cards - Square Frames) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-15rem)] pr-1">
          {filteredProducts.map((product) => {
            const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
            const imageUrl = product.image_url || defaultImg;

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
              >
                {/* Product Photo (McDonald's Kiosk Banner) */}
                <div className="relative w-full h-32 bg-slate-100 border-b-2 border-slate-900 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImg;
                    }}
                  />
                  
                  {/* Badge unit type */}
                  <div className="absolute top-2 right-2">
                    {product.unit_type === 'kilo' ? (
                      <span className="bg-purple-600 text-white text-[10px] font-black uppercase px-2 py-0.5 border border-slate-900 flex items-center gap-1 shadow-sm">
                        <Scale className="w-3 h-3" /> POR KILO
                      </span>
                    ) : (
                      <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-2 py-0.5 border border-slate-900 shadow-sm">
                        {product.unit_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[9px] font-extrabold text-orange-600 uppercase tracking-widest block">
                      {product.category_name}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-2 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-slate-100 pt-2">
                    <span className="text-base font-black text-slate-900">
                      ${product.price.toLocaleString('es-AR')}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="bg-orange-500 group-hover:bg-orange-600 text-white border border-slate-900 px-2.5 py-1 text-[11px] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>AGREGAR</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Checkout (5 cols - Square Industrial Theme) */}
      <div className="lg:col-span-5 bg-white rounded-none border-2 border-slate-900 p-5 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-4">
          {/* Order Header & Square Type Selector */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <h2 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              NUEVA COMANDA
            </h2>
            <div className="flex bg-slate-100 p-1 border-2 border-slate-900 text-xs font-black">
              <button
                onClick={() => setOrderType('mostrador')}
                className={`px-3 py-1.5 uppercase transition ${
                  orderType === 'mostrador'
                    ? 'bg-orange-500 text-white border border-slate-900 shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                MOSTRADOR
              </button>
              <button
                onClick={() => setOrderType('retiro')}
                className={`px-3 py-1.5 uppercase transition ${
                  orderType === 'retiro'
                    ? 'bg-orange-500 text-white border border-slate-900 shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                RETIRO
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`px-3 py-1.5 uppercase transition ${
                  orderType === 'delivery'
                    ? 'bg-orange-500 text-white border border-slate-900 shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                DELIVERY
              </button>
            </div>
          </div>

          {/* Delivery Details Inputs (Square) */}
          {(orderType === 'delivery' || orderType === 'retiro') && (
            <div className="bg-orange-50/40 p-3 border-2 border-slate-900 space-y-2 text-xs font-bold">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-600" />
                  <input
                    type="text"
                    placeholder="Nombre del Cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-900 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-600" />
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-900 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {orderType === 'delivery' && (
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-600" />
                  <input
                    type="text"
                    placeholder="Dirección Completa (Calle, Altura, Dpto)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-900 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase border-2 border-dashed border-slate-300 p-4">
                <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30 text-orange-600" />
                <p>LA COMANDA ESTÁ VACÍA</p>
                <p className="text-[10px] text-slate-400 mt-1">SELECCIONE PLATOS DEL MENÚ PARA AGREGAR</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-3 border-2 border-slate-900 flex items-center justify-between space-x-2 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-slate-900 uppercase">
                      <span>{item.product_name}</span>
                      <span className="text-orange-600 font-black">${item.subtotal.toLocaleString('es-AR')}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>
                        ${item.unit_price.toLocaleString('es-AR')} / {item.unit_type}
                      </span>

                      <button
                        onClick={() => {
                          setEditingNotesIndex(index);
                          setItemNoteInput(item.notes || '');
                        }}
                        className={`text-[10px] flex items-center gap-1 px-2 py-0.5 font-bold uppercase border ${
                          item.notes
                            ? 'bg-orange-500 text-white border-slate-900'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-orange-500'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {item.notes ? `NOTA: ${item.notes}` : '+ NOTA'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-100 border border-slate-900 p-1">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="text-slate-800 hover:text-orange-600 p-1 hover:bg-white border border-transparent hover:border-slate-900"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-slate-900 px-1 text-xs">
                      {item.unit_type === 'kilo' ? `${item.quantity}kg` : item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="text-slate-800 hover:text-orange-600 p-1 hover:bg-white border border-transparent hover:border-slate-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer: Payment & Total */}
        <div className="border-t-2 border-slate-900 pt-4 space-y-3 mt-4">
          <div>
            <label className="text-xs text-slate-900 font-black uppercase mb-1.5 block">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-black">
              <button
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-2 px-3 border-2 uppercase flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-orange-50'
                }`}
              >
                <DollarSign className="w-4 h-4" /> EFECTIVO
              </button>
              <button
                onClick={() => setPaymentMethod('mercadopago')}
                className={`py-2 px-3 border-2 uppercase flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'mercadopago'
                    ? 'bg-sky-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-orange-50'
                }`}
              >
                <QrCode className="w-4 h-4" /> M. PAGO
              </button>
              <button
                onClick={() => setPaymentMethod('tarjeta')}
                className={`py-2 px-3 border-2 uppercase flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-purple-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-orange-50'
                }`}
              >
                <CreditCard className="w-4 h-4" /> TARJETA
              </button>
            </div>
          </div>

          {paymentMethod === 'efectivo' && (
            <div className="grid grid-cols-2 gap-2 text-xs bg-orange-50/50 p-2.5 border-2 border-slate-900 font-bold">
              <div>
                <label className="text-[10px] text-slate-700 uppercase block font-extrabold">PAGA CON ($)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  className="w-full bg-white border border-slate-900 py-1 px-2 text-slate-900 font-black focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-700 uppercase block font-extrabold">VUELTO</label>
                <div className="py-1 px-2 font-black text-emerald-700 text-sm">
                  ${changeAmount > 0 ? changeAmount.toLocaleString('es-AR') : '0'}
                </div>
              </div>
            </div>
          )}

          <input
            type="text"
            placeholder="OBSERVACIONES DE LA COMANDA..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full bg-white border-2 border-slate-900 py-2 px-3 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none uppercase"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
              <span>TOTAL A PAGAR</span>
              <span className="text-orange-600 text-xl font-black">${cartTotal.toLocaleString('es-AR')}</span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className={`w-full py-4 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all ${
                cart.length > 0 && !isSubmitting
                  ? 'bg-orange-500 hover:bg-orange-600 text-white active:translate-x-0.5 active:translate-y-0.5'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-slate-300'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {isSubmitting ? 'PROCESANDO...' : `CONFIRMAR COMANDA ($${cartTotal.toLocaleString('es-AR')})`}
            </button>
          </div>
        </div>
      </div>

      {/* WEIGHT MODAL (Square) */}
      {weightModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 p-6 max-w-sm w-full space-y-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center space-x-3 border-b-2 border-slate-900 pb-3">
              <div className="p-3 bg-orange-500 text-white border-2 border-slate-900">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase">{weightModalItem.name}</h3>
                <p className="text-xs text-orange-600 font-bold">${weightModalItem.price.toLocaleString('es-AR')} por Kilo</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-900 block mb-1.5 font-black uppercase">INGRESAR GRAMOS (g):</label>
              <input
                type="number"
                step="50"
                value={inputWeightGrams}
                onChange={(e) => setInputWeightGrams(e.target.value)}
                className="w-full bg-orange-50/50 border-2 border-slate-900 py-2.5 px-4 text-slate-900 text-xl font-black text-center focus:outline-none"
              />
              <p className="text-xs text-orange-600 font-black text-center mt-2 uppercase">
                = {(parseFloat(inputWeightGrams) / 1000 || 0).toFixed(3)} kg ($
                {(((parseFloat(inputWeightGrams) / 1000) || 0) * weightModalItem.price).toLocaleString('es-AR')})
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs font-black">
              {['250', '500', '750', '1000'].map((grams) => (
                <button
                  key={grams}
                  onClick={() => setInputWeightGrams(grams)}
                  className="py-2 bg-slate-100 hover:bg-orange-500 hover:text-white border-2 border-slate-900"
                >
                  {grams}g
                </button>
              ))}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setWeightModalItem(null)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black border-2 border-slate-900 text-xs uppercase"
              >
                CANCELAR
              </button>
              <button
                onClick={handleAddWeightItem}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black border-2 border-slate-900 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                AGREGAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM NOTES MODAL */}
      {editingNotesIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 p-5 max-w-sm w-full space-y-3 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <h3 className="font-black text-slate-900 text-xs uppercase">NOTA DE PREPARACIÓN</h3>
            <input
              type="text"
              placeholder="Ej: Sin cebolla, Salsa aparte"
              value={itemNoteInput}
              onChange={(e) => setItemNoteInput(e.target.value)}
              className="w-full bg-orange-50/50 border-2 border-slate-900 py-2 px-3 text-slate-900 text-xs font-bold focus:outline-none uppercase"
            />
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setEditingNotesIndex(null)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black border-2 border-slate-900 text-xs uppercase"
              >
                CANCELAR
              </button>
              <button
                onClick={saveItemNotes}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black border-2 border-slate-900 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                GUARDAR
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
