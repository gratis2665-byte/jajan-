import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DynamicIslandNotification } from './components/DynamicIslandNotification';
import { MenuCatalog } from './components/MenuCatalog';
import { AdminDashboard } from './components/AdminDashboard';
import { CashierDashboard } from './components/CashierDashboard';
import { OrderTrackerView } from './components/OrderTrackerView';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AuthModal } from './components/AuthModal';
import {
  UtensilsCrossed,
  Clock,
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  QrCode,
  ShieldCheck,
  Heart,
  Store,
} from 'lucide-react';
import { playTapSound } from './services/soundEffects';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, cartTotalCount, setIsCartOpen, currentUser } = useApp();

  return (
    <div className="min-h-screen flex flex-col text-slate-100 selection:bg-amber-400 selection:text-gray-950 pb-20 sm:pb-10">
      {/* Top Floating Dynamic Island */}
      <DynamicIslandNotification />

      {/* Main Glass Navigation Bar */}
      <Navbar />

      {/* Tab View Router */}
      <main className="flex-1 w-full">
        {activeTab === 'menu' && <MenuCatalog />}
        {activeTab === 'tracker' && <OrderTrackerView />}
        {activeTab === 'cashier' && (currentUser.role === 'cashier' || currentUser.role === 'admin') && (
          <CashierDashboard />
        )}
        {activeTab === 'admin' && currentUser.role === 'admin' && <AdminDashboard />}
      </main>

      {/* Modern Apple Glass Footer */}
      <footer className="mt-16 border-t border-white/10 bg-black/40 backdrop-blur-xl py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white font-black text-xs">
                J
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                JAJAN Makanan &amp; Minuman
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm">
              Sistem pemesanan makanan, minuman, dan snack modern dengan QRIS real-time &amp; tracking pesanan dapur.
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-300">
            <span className="apple-glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>QRIS Standard Nasional</span>
            </span>
            <span className="apple-glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enkripsi Pembayaran Aman</span>
            </span>
            <span className="apple-glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Buka Setiap Hari: 08.00 - 22.00</span>
            </span>
          </div>

          <div className="text-xs text-gray-400">
            <p className="flex items-center justify-center md:justify-end gap-1">
              Dibuat dengan <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> untuk UMKM Indonesia
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Tema Apple Liquid Glass • Next/Vite High Performance
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Bottom Dock (Single Apple Liquid Tab Bar) */}
      <div className="md:hidden fixed bottom-3 inset-x-4 z-40">
        <div className="rounded-full p-1.5 border border-white/20 shadow-xl flex items-center justify-around bg-gray-950/90 backdrop-blur-2xl">
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('menu');
            }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full transition cursor-pointer ${
              activeTab === 'menu' ? 'text-amber-400 font-bold bg-white/10' : 'text-gray-400'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="text-[10px]">Menu</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              setActiveTab('tracker');
            }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full transition cursor-pointer ${
              activeTab === 'tracker' ? 'text-amber-400 font-bold bg-white/10' : 'text-gray-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px]">Lacak</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              setIsCartOpen(true);
            }}
            className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full text-gray-400 hover:text-white transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px]">Keranjang</span>
            {cartTotalCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                {cartTotalCount}
              </span>
            )}
          </button>

          {(currentUser.role === 'cashier' || currentUser.role === 'admin') && (
            <button
              onClick={() => {
                playTapSound();
                setActiveTab('cashier');
              }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full transition cursor-pointer ${
                activeTab === 'cashier' ? 'text-amber-400 font-bold bg-white/10' : 'text-gray-400'
              }`}
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span className="text-[10px]">Kasir</span>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                playTapSound();
                setActiveTab('admin');
              }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full transition cursor-pointer ${
                activeTab === 'admin' ? 'text-amber-400 font-bold bg-white/10' : 'text-gray-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px]">Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <ProductDetailModal />
      <CheckoutPaymentModal />
      <OrderTrackerModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
