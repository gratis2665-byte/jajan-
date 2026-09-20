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

      {/* Hero Banner: Warm Authentic Food Delivery & Bakery */}
      <div className="relative rounded-2xl overflow-hidden bg-[#FFFDF9] border border-[#E8DEC8] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 lg:p-10 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF4E5] border border-[#F5DCB7] text-xs font-semibold text-[#B83214]">
              <span>Pesan Antar &amp; Ambil di Tempat</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2C1810] tracking-tight leading-tight font-heading">
              Jajanan Segar &amp; Bakery Hangat, <br />
              <span className="text-[#D81A3C]">Langsung Diantar ke Meja Anda</span>
            </h1>

            <p className="text-sm text-[#5C4D44] leading-relaxed max-w-xl">
              Pilihan menu camilan lezat, toast panggang, croffle gurih, dan racikan kopi berkualitas. Bayar praktis pakai QRIS atau tunai di kasir.
            </p>

            {/* Quick Search & Promo Input */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C7D73] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari makanan atau minuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E5DAC8] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#D81A3C]"
                />
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('browse-menu-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lihat Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Promo Voucher */}
            <div className="pt-1 flex items-center gap-2 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF4E8] border border-[#EADFCB] text-[#4A3B32] font-medium text-xs">
                <Tag className="w-3.5 h-3.5 text-[#D81A3C]" />
                <span>Voucher: <strong className="text-[#2C1810]">JAJANHEMAT</strong> (Diskon 20%)</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-3 sm:p-4 rounded-2xl border border-[#E5DAC8] shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80"
                alt="Pastry & Bakery Segar"
                className="w-full h-48 sm:h-52 object-cover rounded-xl"
              />
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#8C7D73] font-medium block">Menu Rekomendasi</span>
                  <h4 className="text-sm font-bold text-[#2C1810] font-heading">Artisan Pastry &amp; Croffle</h4>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#FFF4E5] text-[#8C3A0A] font-bold text-xs border border-[#F5DCB7]">
                  Dipanggang Tiap Hari
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browse Food Category Heading */}
      <div id="browse-menu-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E8DEC8]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2C1810] font-heading tracking-tight">
              Daftar Menu &amp; Pilihan Jajanan
            </h2>
            <p className="text-xs sm:text-sm text-[#736962] mt-0.5">
              Pilih kategori menu atau gunakan kolom pencarian untuk memesan langsung.
            </p>
          </div>

          {/* Search Input Filter */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8C7D73] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari croffle, boba, toast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E0D3C1] rounded-xl pl-10 pr-8 py-2 text-xs text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#D81A3C]"
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

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                playTapSound();
                setSelectedCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-[#2C1810] text-white border-[#2C1810] shadow-xs'
                  : 'bg-white text-[#52311D] border-[#E8DEC8] hover:bg-[#FAF7F2] hover:text-[#1F1A17]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
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
