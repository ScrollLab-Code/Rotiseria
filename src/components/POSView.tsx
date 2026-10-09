'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
import type { Category, Order, OrderItem, Product } from '@/lib/types';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  onOrderCreated: () => void;
}

export default function POSView({ products, categories, onOrderCreated }: POSViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'mostrador' | 'delivery' | 'retiro'>('mostrador');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'mercadopago' | 'tarjeta'>('efectivo');
  const [cashPaid, setCashPaid] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');

  // Weight modal
  const [weightModalItem, setWeightModalItem] = useState<Product | null>(null);
  const [inputWeightGrams, setInputWeightGrams] = useState<string>('500');

  // Notes modal
  const [editingNotesIndex, setEditingNotesIndex] = useState<number | null>(null);
  const [itemNoteInput, setItemNoteInput] = useState('');

  // Created order modal
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch && p.available === 1;
  });

  const addToCart = (product: Product, quantity: number = 1, notes: string = '') => {
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

      const data = await res.json() as Order;
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT SECTION: Product Catalog (7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        {/* Search & Category Filter */}
        <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en el menú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:bg-white focus:border-orange-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 font-medium transition-colors border ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white border-orange-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos los Platos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 font-medium transition-colors border whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white border-orange-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto max-h-[calc(100vh-14rem)] pr-0.5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No se encontraron productos disponibles.
            </div>
          ) : filteredProducts.map((product) => {
            const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
            const imageUrl = product.image_url || defaultImg;

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-orange-400 hover:shadow-md transition-all cursor-pointer flex flex-col group overflow-hidden active:scale-[0.99]"
              >
                {/* Product Photo */}
                <div className="relative w-full h-28 sm:h-32 lg:h-28 xl:h-32 bg-slate-100 border-b border-slate-100 overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    unoptimized
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => { e.currentTarget.src = defaultImg; }}
                  />
                  
                  {/* Badge unit type */}
                  <div className="absolute top-2 right-2">
                    {product.unit_type === 'kilo' ? (
                      <span className="bg-purple-600/90 text-white text-[10px] font-semibold px-2 py-1 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> Kilo
                      </span>
                    ) : (
                      <span className="bg-slate-900/80 text-white text-[10px] font-medium px-2 py-1">
                        {product.unit_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide block truncate">
                      {product.category_name}
                    </span>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 min-h-10 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <span className="text-base font-bold text-slate-900 whitespace-nowrap">
                      ${product.price.toLocaleString('es-AR')}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="min-h-10 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Checkout (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 p-4 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Order Header & Type Selector */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              Nueva Comanda
            </h2>
            <div className="flex bg-slate-100 p-0.5 border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setOrderType('mostrador')}
                className={`px-2.5 py-1 transition-colors ${
                  orderType === 'mostrador'
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mostrador
              </button>
              <button
                onClick={() => setOrderType('retiro')}
                className={`px-2.5 py-1 transition-colors ${
                  orderType === 'retiro'
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Retiro
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`px-2.5 py-1 transition-colors ${
                  orderType === 'delivery'
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Delivery
              </button>
            </div>
          </div>

          {/* Delivery Inputs */}
          {(orderType === 'delivery' || orderType === 'retiro') && (
            <div className="bg-orange-50/50 p-2.5 border border-orange-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-600" />
                  <input
                    type="text"
                    placeholder="Nombre Cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-600" />
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {orderType === 'delivery' && (
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-600" />
                  <input
                    type="text"
                    placeholder="Dirección Completa"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-1.5 overflow-y-auto max-h-[220px] pr-0.5">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed border-slate-200 p-3">
                <Utensils className="w-7 h-7 mx-auto mb-1.5 opacity-30 text-orange-600" />
                <p>La comanda está vacía</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Seleccione platos para agregar</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-2.5 border border-slate-200 flex items-center justify-between space-x-2 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-slate-900 font-semibold">
                      <span>{item.product_name}</span>
                      <span className="text-orange-600 font-bold">${item.subtotal.toLocaleString('es-AR')}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                      <span>
                        ${item.unit_price.toLocaleString('es-AR')} / {item.unit_type}
                      </span>

                      <button
                        onClick={() => {
                          setEditingNotesIndex(index);
                          setItemNoteInput(item.notes || '');
                        }}
                        className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 font-medium border ${
                          item.notes
                            ? 'bg-orange-500 text-white border-orange-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-400'
                        }`}
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        {item.notes ? `Nota: ${item.notes}` : '+ Nota'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 p-0.5">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="text-slate-700 hover:text-orange-600 p-1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-900 px-1 text-xs">
                      {item.unit_type === 'kilo' ? `${item.quantity}kg` : item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="text-slate-700 hover:text-orange-600 p-1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer: Payment & Total */}
        <div className="border-t border-slate-200 pt-3 space-y-2.5 mt-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold mb-1 block">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-1.5 px-2 border flex items-center justify-center gap-1 transition-colors ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('mercadopago')}
                className={`py-1.5 px-2 border flex items-center justify-center gap-1 transition-colors ${
                  paymentMethod === 'mercadopago'
                    ? 'bg-sky-600 text-white border-sky-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> M. Pago
              </button>
              <button
                onClick={() => setPaymentMethod('tarjeta')}
                className={`py-1.5 px-2 border flex items-center justify-center gap-1 transition-colors ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Tarjeta
              </button>
            </div>
          </div>

          {paymentMethod === 'efectivo' && (
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 border border-slate-200">
              <div>
                <label className="text-[10px] text-slate-600 font-medium block">Paga con ($)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  className="w-full bg-white border border-slate-200 py-1 px-2 text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 font-medium block">Vuelto</label>
                <div className="py-1 px-2 font-bold text-emerald-700 text-xs">
                  ${changeAmount > 0 ? changeAmount.toLocaleString('es-AR') : '0'}
                </div>
              </div>
            </div>
          )}

          <input
            type="text"
            placeholder="Observaciones de la comanda..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-1.5">
              <span>Total a pagar</span>
              <span className="text-orange-600 text-lg font-extrabold">${cartTotal.toLocaleString('es-AR')}</span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className={`w-full py-2.5 font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors ${
                cart.length > 0 && !isSubmitting
                  ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Procesando...' : `Confirmar Comanda ($${cartTotal.toLocaleString('es-AR')})`}
            </button>
          </div>
        </div>
      </div>

      {/* WEIGHT MODAL */}
      {weightModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 p-5 max-w-xs w-full space-y-3">
            <div className="flex items-center space-x-2.5 border-b border-slate-200 pb-2.5">
              <div className="p-2 bg-orange-500 text-white">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-xs">{weightModalItem.name}</h3>
                <p className="text-[11px] text-orange-600 font-medium">${weightModalItem.price.toLocaleString('es-AR')} por Kilo</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 block mb-1 font-semibold">Ingresar Gramos (g):</label>
              <input
                type="number"
                step="50"
                value={inputWeightGrams}
                onChange={(e) => setInputWeightGrams(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 py-1.5 px-3 text-slate-900 text-lg font-bold text-center focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-orange-600 font-semibold text-center mt-1.5">
                = {(parseFloat(inputWeightGrams) / 1000 || 0).toFixed(3)} kg ($
                {(((parseFloat(inputWeightGrams) / 1000) || 0) * weightModalItem.price).toLocaleString('es-AR')})
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              {['250', '500', '750', '1000'].map((grams) => (
                <button
                  key={grams}
                  onClick={() => setInputWeightGrams(grams)}
                  className="py-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white border border-slate-200 transition-colors"
                >
                  {grams}g
                </button>
              ))}
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setWeightModalItem(null)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddWeightItem}
                className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs border border-orange-600"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM NOTES MODAL */}
      {editingNotesIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 p-4 max-w-xs w-full space-y-2.5">
            <h3 className="font-semibold text-slate-900 text-xs">Nota de Preparación</h3>
            <input
              type="text"
              placeholder="Ej: Sin cebolla, Salsa aparte"
              value={itemNoteInput}
              onChange={(e) => setItemNoteInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 py-1.5 px-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-orange-500"
            />
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setEditingNotesIndex(null)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveItemNotes}
                className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs border border-orange-600"
              >
                Guardar
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
