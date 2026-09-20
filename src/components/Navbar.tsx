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
  PhoneCall,
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
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#EFE8DE] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('menu')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2C1810] text-[#FFC224] flex items-center justify-center font-bold text-lg shadow-xs">
              <span>☕</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold tracking-tight text-[#2C1810] font-heading">
                  Jajan<span className="text-[#D81A3C]">Katalog</span>
                </span>
              </div>
              <p className="text-[11px] text-[#8C7D73] font-medium">
                Pesan Makanan &amp; Minuman
              </p>
            </div>
          </button>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DEC8]">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-[#2C1810] text-white shadow-xs'
                : 'text-[#52311D] hover:text-[#1F1A17] hover:bg-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tracker');
              const activeOrder = orders.find((o) => o.status !== 'completed' && o.status !== 'cancelled');
              if (activeOrder) {
                setActiveTrackOrderId(activeOrder.id);
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'tracker'
                ? 'bg-[#2C1810] text-white shadow-xs'
                : 'text-[#52311D] hover:text-[#1F1A17] hover:bg-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lacak Pesanan</span>
            {activeOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D81A3C]" />
            )}
          </button>

          {/* Tab Kasir */}
          {(currentUser.role === 'cashier' || currentUser.role === 'admin') && (
            <button
              onClick={() => setActiveTab('cashier')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cashier'
                  ? 'bg-[#2C1810] text-white shadow-xs'
                  : 'text-[#52311D] hover:text-[#1F1A17] hover:bg-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-[#FFC224]" />
              <span>Kasir &amp; POS</span>
            </button>
          )}

          {/* Tab Admin */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-[#2C1810] text-white shadow-xs'
                  : 'text-[#52311D] hover:text-[#1F1A17] hover:bg-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#FFC224]" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hotline */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8DEC8] text-[#52311D] px-3 py-1.5 rounded-xl text-xs font-medium">
            <PhoneCall className="w-3.5 h-3.5 text-[#D81A3C]" />
            <span>Bantuan: 0812-3456-7890</span>
          </div>

          {/* Google Sheets Link */}
          {googleSpreadsheet && (
            <a
              href={googleSpreadsheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1.5 rounded-full font-medium transition"
              title="Buka Spreadsheet Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sheets</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="w-10 h-10 rounded-full border border-[#EFE8DE] bg-[#FAF7F2] text-[#52311D] hover:bg-[#F3ECE1] hover:text-[#1F1A17] transition relative flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D81A3C] text-[10px] text-white font-bold flex items-center justify-center ring-2 ring-white">
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
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl p-4 shadow-xl z-50 border border-[#EFE8DE]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE] mb-2">
                    <span className="text-xs font-bold text-[#1F1A17] flex items-center gap-1.5 font-heading">
                      <Bell className="w-3.5 h-3.5 text-[#D81A3C]" />
                      Pemberitahuan Pesanan
                    </span>
                    <span className="text-[10px] text-[#736962]">
                      {notifications.length} notif
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#736962] text-center py-4">Belum ada notifikasi.</p>
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
                              ? 'bg-[#FAF7F2] border-[#EFE8DE] text-[#736962]'
                              : 'bg-red-50/50 border-red-100 text-[#1F1A17]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[#1F1A17] truncate">{notif.title}</span>
                            <span className="text-[9px] text-[#736962] shrink-0">{notif.timestamp}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-2 text-[#52311D]">
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

          {/* Cart Trigger Button - Warm Food delivery button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EFE8DE] text-[#1F1A17] px-3.5 sm:px-4 py-2 rounded-full flex items-center gap-2.5 transition-all cursor-pointer relative group shadow-xs"
            aria-label="Buka Keranjang Belanja"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-[#D81A3C] group-hover:scale-110 transition-transform" />
              {cartTotalCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-[#D81A3C] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white"
                >
                  {cartTotalCount}
                </motion.span>
              )}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[9px] text-[#736962] uppercase tracking-wider font-bold">
                Keranjang
              </span>
              <span className="text-xs font-bold text-[#1F1A17] leading-none">
                {cartSubtotal > 0 ? `Rp ${cartSubtotal.toLocaleString('id-ID')}` : 'Rp 0'}
              </span>
            </div>
          </button>

          {/* Profile Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#EFE8DE] flex items-center justify-center text-[#52311D] hover:text-[#1F1A17] hover:bg-[#F3ECE1] transition cursor-pointer overflow-hidden shadow-xs"
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
