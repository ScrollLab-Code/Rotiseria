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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 bg-orange-500 text-white flex items-center justify-center text-2xl animate-bounce border border-orange-600">
          🍗
        </div>
        <div className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5">
          Cargando Sistema Empanadas Picún...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shiftData={shiftData}
        onOpenCashModal={() => setIsCashModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6">
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
          <div className="bg-white p-5 border border-slate-200 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Arqueo y Control de Caja</h2>
            <p className="text-xs text-slate-500">
              Gestione la apertura, cierre, montos iniciales e ingresos/egresos adicionales de efectivo.
            </p>
            <button
              onClick={() => setIsCashModalOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors"
            >
              Abrir Panel de Control de Caja
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
