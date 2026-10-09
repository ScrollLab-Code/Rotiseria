'use client';

import React from 'react';
import { 
  ShoppingBag, 
  ChefHat, 
  ClipboardList, 
  Wallet, 
  UtensilsCrossed, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle
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
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-amber-500/20">
              🍗
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-amber-400">Rotisería POS</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Sistema de Gestión & Comandas</p>
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isShiftOpen
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/80'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-400 hover:bg-rose-900/80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isShiftOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
