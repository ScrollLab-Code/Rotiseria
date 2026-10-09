'use client';

import React from 'react';
import Image from 'next/image';
import { 
  ShoppingBag, 
  ChefHat, 
  ClipboardList, 
  Wallet, 
  UtensilsCrossed, 
  TrendingUp, 
} from 'lucide-react';
import type { CashShiftData } from '@/lib/types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shiftData: CashShiftData | null;
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
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand Image */}
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-auto bg-white p-0.5 border border-slate-200 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Empanadas Picún Logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">Empanadas Picún</h1>
              <p className="text-[10px] font-medium text-orange-600 leading-none">Rotisería & Comidas</p>
            </div>
          </div>

          {/* Navigation Tabs - Clean Compact Style */}
          <nav className="flex space-x-1 overflow-x-auto py-1 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold transition-colors border ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Cash Status Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCashModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold border transition-colors ${
                isShiftOpen
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span className={`w-2 h-2 ${isShiftOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
