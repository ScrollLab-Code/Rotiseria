'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import POSView from '@/components/POSView';
import KitchenView from '@/components/KitchenView';
import OrdersView from '@/components/OrdersView';
import CashShiftModal from '@/components/CashShiftModal';
import MenuManagementView from '@/components/MenuManagementView';
import ReportsView from '@/components/ReportsView';
import type { CashShiftData, Category, Order, Product } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('pos');
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shiftData, setShiftData] = useState<CashShiftData | null>(null);
  
  // Modals state
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('No se pudieron cargar los productos');
    return await res.json() as Product[];
  }, []);

  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('No se pudieron cargar las categorías');
    return await res.json() as Category[];
  }, []);

  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    const res = await fetch('/api/orders?date=today');
    if (!res.ok) throw new Error('No se pudieron cargar los pedidos');
    return await res.json() as Order[];
  }, []);

  const fetchShiftData = useCallback(async (): Promise<CashShiftData> => {
    const res = await fetch('/api/cash-shift');
    if (!res.ok) throw new Error('No se pudo cargar la caja');
    return await res.json() as CashShiftData;
  }, []);

  const refreshProducts = useCallback(async () => {
    setProducts(await fetchProducts());
  }, [fetchProducts]);

  const refreshOrders = useCallback(async () => {
    setOrders(await fetchOrders());
  }, [fetchOrders]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextProducts, nextCategories, nextOrders, nextShiftData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchOrders(),
        fetchShiftData(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setOrders(nextOrders);
      setShiftData(nextShiftData);
    } catch (err) {
      console.error('Error loading application data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchOrders, fetchProducts, fetchShiftData]);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [nextProducts, nextCategories, nextOrders, nextShiftData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchOrders(),
          fetchShiftData(),
        ]);
        if (isMounted) {
          setProducts(nextProducts);
          setCategories(nextCategories);
          setOrders(nextOrders);
          setShiftData(nextShiftData);
        }
      } catch (err) {
        console.error('Error loading application data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [fetchCategories, fetchOrders, fetchProducts, fetchShiftData]);

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
          />
        )}

        {activeTab === 'kitchen' && (
          <KitchenView
            orders={orders}
            onRefresh={refreshOrders}
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
            onRefresh={refreshProducts}
            onCategoryCreated={(category) => setCategories((current) => [...current, category])}
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
