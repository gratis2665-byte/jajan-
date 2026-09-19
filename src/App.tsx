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
  PhoneCall,
} from 'lucide-react';
import { playTapSound } from './services/soundEffects';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, cartTotalCount, setIsCartOpen, currentUser } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1F1A17] selection:bg-[#FFC224] selection:text-[#1F1A17] pb-20 sm:pb-10 font-sans">
      {/* Top Floating Dynamic Island */}
      <DynamicIslandNotification />

      {/* Main Navigation Bar */}
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

      {/* Warm Bakery / Food Delivery Footer (Inspired by IMG_1820 & IMG_1819) */}
      <footer className="mt-20 border-t border-[#EFE8DE] bg-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D81A3C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                🍪
              </div>
              <span className="font-extrabold text-[#1F1A17] text-lg tracking-tight font-heading">
                Food<span className="text-[#D81A3C]">Jajan</span> Delivery &amp; Bakery
              </span>
            </div>
            <p className="text-xs text-[#736962] max-w-sm">
              Sistem pemesanan jajanan dan bakery otentik dengan QRIS instan, pelacakan live pesanan, dan rekap otomatis.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-[#52311D]">
            <span className="px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#EFE8DE] flex items-center gap-1.5 font-medium">
              <QrCode className="w-3.5 h-3.5 text-[#D81A3C]" />
              <span>QRIS Standard Nasional</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#EFE8DE] flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pembayaran Terverifikasi</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#EFE8DE] flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#FFC224]" />
              <span>Buka: 08.00 - 22.00 WIB</span>
            </span>
          </div>

          <div className="text-xs text-[#736962]">
            <p className="flex items-center justify-center md:justify-end gap-1 font-medium">
              Dibuat dengan rasa cinta kuliner untuk UMKM Indonesia
            </p>
            <p className="text-[11px] text-[#A89C92] mt-0.5">
              Food Delivery &amp; Pastry Order System
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Bottom Dock (Warm clean human tab bar) */}
      <div className="md:hidden fixed bottom-3 inset-x-4 z-40">
        <div className="rounded-full p-1.5 border border-[#EFE8DE] shadow-xl flex items-center justify-around bg-white/95 backdrop-blur-md">
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('menu');
            }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full transition cursor-pointer ${
              activeTab === 'menu' ? 'text-[#D81A3C] font-bold bg-red-50' : 'text-[#736962]'
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
              activeTab === 'tracker' ? 'text-[#D81A3C] font-bold bg-red-50' : 'text-[#736962]'
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
            className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full text-[#736962] hover:text-[#1F1A17] transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px]">Keranjang</span>
            {cartTotalCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#D81A3C] text-white font-bold text-[9px] flex items-center justify-center">
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
                activeTab === 'cashier' ? 'text-[#1F1A17] font-bold bg-[#FFC224]' : 'text-[#736962]'
              }`}
            >
              <Store className="w-4 h-4" />
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
                activeTab === 'admin' ? 'text-white font-bold bg-[#1F1A17]' : 'text-[#736962]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px]">Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Product Detail Modal */}
      <ProductDetailModal />

      {/* Checkout Payment Modal */}
      <CheckoutPaymentModal />

      {/* Order Tracker Modal */}
      <OrderTrackerModal />

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
