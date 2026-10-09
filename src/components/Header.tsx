'use client';

import React from 'react';
import { 
  ShoppingBag, 
  ChefHat, 
  ClipboardList, 
  Wallet, 
  UtensilsCrossed, 
  TrendingUp, 
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shiftData: any;
  onOpenCashModal: () => void;
}

export default function Header({ activeTab, setActiveTab, shiftData, onOpenCashModal }: HeaderProps) {
  const isShiftOpen = !!shiftData?.activeShift;

  const tabs = [
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingBag },
    { id: 'kitchen', label: 'Cocina (KDS)', icon: ChefHat },
    { id: 'orders', label: 'Pedidos del Día', icon: ClipboardList },
    { id: 'cash', label: 'Caja & Arqueo', icon: Wallet },
    { id: 'menu', label: 'Menú & Precios', icon: UtensilsCrossed },
    { id: 'reports', label: 'Reportes', icon: TrendingUp },
  ];

  return (
    <header className="bg-white text-slate-900 shadow-sm border-b border-orange-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-white text-xl shadow-md shadow-orange-500/20">
              🍗
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-orange-600">Rotisería POS</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Sistema de Gestión & Comandas</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Cash Status Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenCashModal}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                isShiftOpen
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isShiftOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
