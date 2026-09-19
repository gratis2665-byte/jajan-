import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { ProductCategory } from '../types';
import {
  Search,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Cookie,
  SlidersHorizontal,
  Flame,
  Tag,
} from 'lucide-react';
import { playTapSound } from '../services/soundEffects';

export const MenuCatalog: React.FC = () => {
  const { products, orders, setActiveTrackOrderId, setActiveTab } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Active in-progress order banner check
  const activeOrder = orders.find(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  );

  const categories: { id: ProductCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'semua', label: 'Semua Menu', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'bestseller', label: 'Paling Laris', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'makanan', label: 'Makanan', icon: <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'snack', label: 'Snack & Camilan', icon: <Cookie className="w-3.5 h-3.5 text-amber-300" /> },
    { id: 'minuman', label: 'Kopi & Minuman', icon: <Coffee className="w-3.5 h-3.5 text-sky-400" /> },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'semua'
        ? true
        : selectedCategory === 'bestseller'
        ? p.isBestSeller
        : p.category === selectedCategory;

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Active Order Dynamic Island Callout (If user has an ongoing order) */}
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="apple-glass-pill p-3 sm:p-4 rounded-3xl border border-amber-400/30 bg-amber-400/10 flex items-center justify-between gap-3 text-left shadow-lg"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                Pesanan Anda #{activeOrder.orderNumber} sedang diproses ({activeOrder.status.replace('_', ' ')})
              </p>
              <p className="text-[11px] text-gray-300 truncate">
                {activeOrder.fulfillmentType === 'pickup'
                  ? `Siap diambil di ${activeOrder.pickupCounter || 'Counter Pick-up'}`
                  : 'Kurir sedang dalam perjalanan ke alamat Anda'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTrackOrderId(activeOrder.id);
              setActiveTab('tracker');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs hover:bg-amber-300 transition shrink-0 cursor-pointer shadow-md"
          >
            Lacak Live
          </button>
        </motion.div>
      )}

      {/* Hero Apple Glass Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 apple-glass border border-white/20 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-gradient-to-tr from-sky-500/20 to-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl text-left space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full apple-glass-pill text-[11px] text-amber-300 font-semibold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kelezatan Jajanan Otentik &amp; Kopi Pilihan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Jajan Praktis, Nikmat, <br />
            <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              Bayar Digital Real-Time.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl">
            Pesan santai favoritmu dengan QRIS dinamis &amp; e-wallet instan. Nikmati layanan kurir antar cepat atau ambil sendiri di outlet jajan.
          </p>

          {/* Promo code badge */}
          <div className="pt-1 flex items-center gap-2 text-xs">
            <div className="apple-glass-pill px-3 py-1.5 rounded-xl text-amber-300 font-bold flex items-center gap-1.5 border border-amber-400/30">
              <Tag className="w-3.5 h-3.5" />
              <span>Gunakan Voucher: JAJANHEMAT (Diskon 20%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Category & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                playTapSound();
                setSelectedCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-gray-950 shadow-lg scale-102 font-bold'
                  : 'apple-glass-pill text-gray-300 hover:text-white hover:bg-white/15'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari croffle, boba, toast, dll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pt-1">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center apple-glass rounded-3xl border border-white/10 space-y-3">
            <p className="text-sm font-semibold text-white">Menu tidak ditemukan</p>
            <p className="text-xs text-gray-400">
              Coba kata kunci lain atau pilih kategori "Semua Menu".
            </p>
            <button
              onClick={() => {
                setSelectedCategory('semua');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-white text-gray-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};
