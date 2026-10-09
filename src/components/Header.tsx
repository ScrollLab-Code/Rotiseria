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
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingBag },
    { id: 'kitchen', label: 'Cocina (KDS)', icon: ChefHat },
    { id: 'orders', label: 'Pedidos del Día', icon: ClipboardList },
    { id: 'cash', label: 'Caja & Arqueo', icon: Wallet },
    { id: 'menu', label: 'Menú & Precios', icon: UtensilsCrossed },
    { id: 'reports', label: 'Reportes', icon: TrendingUp },
  ];

  return (
    <header className="bg-white text-slate-900 border-b-2 border-slate-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Image */}
          <div className="flex items-center space-x-3">
            <div className="h-14 w-auto bg-white p-1 border-2 border-slate-900 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Empanadas Picún Rotisería Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">Empanadas Picún</h1>
              <p className="text-xs font-bold text-orange-600 tracking-widest uppercase">Rotisería & Comidas</p>
            </div>
          </div>

          {/* Navigation Tabs - Clean Square Style */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-2 ${
                    isActive
                      ? 'bg-orange-500 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Cash Status Button - Square Badge */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenCashModal}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                isShiftOpen
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-rose-50 border-rose-600 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <span className={`w-2.5 h-2.5 ${isShiftOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
              <span>{isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
