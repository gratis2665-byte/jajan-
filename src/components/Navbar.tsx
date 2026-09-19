import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Clock,
  LayoutDashboard,
  User as UserIcon,
  Bell,
  Sparkles,
  ExternalLink,
  Store,
  FileSpreadsheet,
} from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    cartTotalCount,
    cartSubtotal,
    setIsCartOpen,
    setIsAuthModalOpen,
    activeTab,
    setActiveTab,
    notifications,
    markNotificationRead,
    orders,
    setActiveTrackOrderId,
    googleSpreadsheet,
  } = useApp();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read);
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 pt-3 pb-2">
      <div className="max-w-7xl mx-auto apple-glass rounded-3xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4 border border-white/15">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('menu')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">Jajan</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-gray-400 -mt-1 font-medium tracking-wide">
                Food & Beverage Bar
              </p>
            </div>
          </button>
        </div>

        {/* Center Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 apple-glass-pill p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Menu Jajan
          </button>

          <button
            onClick={() => {
              setActiveTab('tracker');
              const activeOrder = orders.find((o) => o.status !== 'completed' && o.status !== 'cancelled');
              if (activeOrder) {
                setActiveTrackOrderId(activeOrder.id);
              }
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'tracker'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Lacak Pesanan
            {activeOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          {/* Tab Kasir: Dedicated POS & Kitchen Dispatch for Cashier and Admin */}
          {(currentUser.role === 'cashier' || currentUser.role === 'admin') && (
            <button
              onClick={() => setActiveTab('cashier')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cashier'
                  ? 'bg-amber-400 text-gray-950 font-bold shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              Kasir &amp; POS
              {currentUser.role === 'cashier' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                  Shift
                </span>
              )}
            </button>
          )}

          {/* Only Super Admin can see and access Admin Tab */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-semibold">
                Super
              </span>
            </button>
          )}
        </nav>

        {/* Right Action Icons: Role Switcher, Google Sheet badge, Notif, Cart, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Sheets Link shortcut if exists */}
          {googleSpreadsheet && (
            <a
              href={googleSpreadsheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 px-2.5 py-1.5 rounded-xl transition"
              title="Buka Spreadsheet Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sheets Terhubung</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="apple-glass-pill p-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/20 transition relative cursor-pointer"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center ring-2 ring-gray-900">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 apple-glass rounded-2xl p-3 shadow-2xl z-50 border border-white/20"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-sky-400" />
                      Pemberitahuan Pesanan
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {notifications.length} notif
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Belum ada notifikasi.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            if (notif.orderId) {
                              setActiveTrackOrderId(notif.orderId);
                              setActiveTab('tracker');
                              setIsNotifDropdownOpen(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            notif.read
                              ? 'bg-white/5 border-white/5 text-gray-400'
                              : 'bg-white/10 border-white/15 text-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white truncate">{notif.title}</span>
                            <span className="text-[9px] text-gray-400 shrink-0">{notif.timestamp}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-2 text-gray-300">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="apple-glass-pill hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-2xl flex items-center gap-2 transition-all cursor-pointer relative group border border-white/20 shadow-md"
            aria-label="Buka Keranjang Belanja"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              {cartTotalCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-gray-900"
                >
                  {cartTotalCount}
                </motion.span>
              )}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Keranjang
              </span>
              <span className="text-xs font-bold text-white leading-none">
                {cartSubtotal > 0 ? `Rp ${cartSubtotal.toLocaleString('id-ID')}` : 'Kosong'}
              </span>
            </div>
          </button>

          {/* Profile Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-9 h-9 rounded-2xl apple-glass-pill flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/20 transition cursor-pointer overflow-hidden border border-white/20"
            title="Kelola Profil & Login"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
