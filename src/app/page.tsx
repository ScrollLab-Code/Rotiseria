'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import POSView from '@/components/POSView';
import KitchenView from '@/components/KitchenView';
import OrdersView from '@/components/OrdersView';
import CashShiftModal from '@/components/CashShiftModal';
import MenuManagementView from '@/components/MenuManagementView';
import ReportsView from '@/components/ReportsView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('pos');
  
  // Data state
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [shiftData, setShiftData] = useState<any>(null);
  
  // Modals state
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchOrders(),
        fetchShiftData(),
      ]);
    } catch (err) {
      console.error('Error loading application data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  };

  const fetchOrders = async () => {
    const res = await fetch('/api/orders?date=today');
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
  };

  const fetchShiftData = async () => {
    const res = await fetch('/api/cash-shift');
    if (res.ok) {
      const data = await res.json();
      setShiftData(data);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-orange-50/30 text-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-orange-500 border-4 border-slate-900 flex items-center justify-center text-3xl animate-bounce shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          🍗
        </div>
        <div className="text-sm font-black uppercase tracking-widest text-orange-600 border-2 border-slate-900 px-4 py-2 bg-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">CARGANDO SISTEMA EMPANADAS PICÚN...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/20 text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shiftData={shiftData}
        onOpenCashModal={() => setIsCashModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          <POSView
            products={products}
            categories={categories}
            onOrderCreated={loadAllData}
            shiftData={shiftData}
          />
        )}

        {activeTab === 'kitchen' && (
          <KitchenView
            orders={orders}
            onRefresh={fetchOrders}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'cash' && (
          <div className="bg-white p-6 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <h2 className="text-xl font-black uppercase text-slate-900 tracking-wider">ARQUEO Y CONTROL DE CAJA</h2>
            <p className="text-xs text-slate-500 font-bold uppercase">
              GESTIONE LA APERTURA, CIERRE, MONTOS INICIALES E INGRESOS/EGRESOS ADICIONALES DE EFECTIVO.
            </p>
            <button
              onClick={() => setIsCashModalOpen(true)}
              className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-900 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition"
            >
              ABRIR PANEL DE CONTROL DE CAJA
            </button>
          </div>
        )}

        {activeTab === 'menu' && (
          <MenuManagementView
            products={products}
            categories={categories}
            onRefresh={fetchProducts}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Cash Shift Modal */}
      {isCashModalOpen && (
        <CashShiftModal
          shiftData={shiftData}
          onClose={() => setIsCashModalOpen(false)}
          onRefresh={loadAllData}
        />
      )}
    </div>
  );
}
