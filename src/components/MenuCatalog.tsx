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
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck,
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
    { id: 'bestseller', label: 'Paling Laris', icon: <Flame className="w-3.5 h-3.5 text-[#D81A3C]" /> },
    { id: 'makanan', label: 'Makanan', icon: <UtensilsCrossed className="w-3.5 h-3.5 text-[#D81A3C]" /> },
    { id: 'snack', label: 'Snack & Bakery', icon: <Cookie className="w-3.5 h-3.5 text-[#FFC224]" /> },
    { id: 'minuman', label: 'Kopi & Minuman', icon: <Coffee className="w-3.5 h-3.5 text-[#52311D]" /> },
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Active Order Banner */}
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-[#FFC224] bg-[#FFF8E7] flex items-center justify-between gap-3 text-left shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D81A3C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D81A3C]"></span>
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-[#1F1A17] truncate">
                Pesanan Anda #{activeOrder.orderNumber} sedang diproses ({activeOrder.status.replace('_', ' ')})
              </p>
              <p className="text-[11px] text-[#736962] truncate">
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
            className="px-4 py-2 rounded-full bg-[#D81A3C] text-white font-bold text-xs hover:bg-[#BF1231] transition shrink-0 cursor-pointer shadow-sm"
          >
            Lacak Live
          </button>
        </motion.div>
      )}

      {/* Hero Banner inspired directly by IMG_1820 & IMG_1819 (Warm Organic Curve, Food Delivery Scooter / Artisan Bakery) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FFF9EE] via-[#FFF3D6] to-[#FFE8A3] border border-[#EFE2C9] shadow-sm">
        {/* Decorative soft food pattern background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#361A0C_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 lg:p-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#E8DEC8] text-xs font-bold text-[#D81A3C] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FFC224] fill-[#FFC224]" />
              <span>We Deliver The Taste Of Life</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1F1A17] tracking-tight leading-tight font-heading">
              Get It Delivered Right <br />
              <span className="text-[#D81A3C]">To Your Door!</span>
            </h1>

            <p className="text-sm sm:text-base text-[#52311D] leading-relaxed max-w-xl">
              Nikmati aneka jajanan lezat, artisan toast, croffle hangat, dan kopi segar. Pesan instan dengan QRIS real-time atau bayar di tempat.
            </p>

            {/* Quick Search & Promo Input inside Hero like IMG_1820 */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#736962] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik makanan atau jajanan favorit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E0D3C1] rounded-full pl-11 pr-4 py-3 text-xs sm:text-sm text-[#1F1A17] placeholder-[#736962] focus:outline-none focus:border-[#D81A3C] shadow-2xs"
                />
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('browse-menu-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-red-900/15 flex items-center justify-center gap-2"
              >
                <span>Find Food</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Voucher Tag Pill */}
            <div className="pt-1 flex items-center gap-2 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8DEC8] text-[#361A0C] font-semibold text-[11px]">
                <Tag className="w-3.5 h-3.5 text-[#D81A3C]" />
                <span>Kode Promo: <strong>JAJANHEMAT</strong> (Diskon 20%)</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column (Curated Food Composition like IMG_1820 & IMG_1819) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Soft Warm Plate Glow */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-[#FFC224] to-[#FFE8A3] blur-2xl opacity-60 absolute" />

            <div className="relative z-10 w-full max-w-sm sm:max-w-md">
              <div className="bg-white/90 p-4 rounded-3xl border border-[#E8DEC8] shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80"
                  alt="Artisan Pastries & Bakery"
                  className="w-full h-48 sm:h-56 object-cover rounded-2xl"
                />
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#736962] font-semibold uppercase tracking-wider block">Special Bakery</span>
                    <h4 className="text-sm font-bold text-[#1F1A17] font-heading">Warm Fresh Croissant &amp; Pastry</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FFF8E7] text-[#361A0C] font-extrabold text-xs border border-[#FFC224]">
                    Fresh Baked
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browse Food Category Heading (Styled exactly like IMG_1820 "Browse Food Category") */}
      <div id="browse-menu-section" className="space-y-4 pt-2">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1F1A17] font-heading tracking-tight">
            Browse Food Category
          </h2>
          <p className="text-xs sm:text-sm text-[#736962]">
            Pilih kategori jajanan terfavorit dan pesan dengan mudah langsung diantar ke tempatmu.
          </p>
        </div>

        {/* Category Buttons & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Category Pills (Warm human-designed buttons) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playTapSound();
                  setSelectedCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-[#D81A3C] text-white border-[#D81A3C] shadow-sm font-bold scale-102'
                    : 'bg-white text-[#52311D] border-[#EFE8DE] hover:bg-[#FAF7F2] hover:text-[#1F1A17]'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input Filter */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#736962] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari croffle, boba, toast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#EFE8DE] rounded-full pl-10 pr-8 py-2 text-xs text-[#1F1A17] placeholder-[#736962] focus:outline-none focus:border-[#D81A3C] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#736962] hover:text-[#1F1A17] text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 pt-1">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-[#EFE8DE] space-y-3">
            <p className="text-sm font-bold text-[#1F1A17] font-heading">Menu tidak ditemukan</p>
            <p className="text-xs text-[#736962]">
              Coba kata kunci lain atau pilih kategori "Semua Menu".
            </p>
            <button
              onClick={() => {
                setSelectedCategory('semua');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-full bg-[#D81A3C] text-white font-bold text-xs hover:bg-[#BF1231] transition"
            >
              Tampilkan Semua Menu
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
