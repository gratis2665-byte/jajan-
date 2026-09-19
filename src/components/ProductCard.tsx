import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Clock, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';
import { playTapSound } from '../services/soundEffects';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { setSelectedProductForDetail, addToCart } = useApp();

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    if (product.options && product.options.length > 0) {
      setSelectedProductForDetail(product);
    } else {
      addToCart(product, 1, []);
    }
  };

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => setSelectedProductForDetail(product)}
      className="apple-glass-card rounded-3xl p-3.5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-gray-900/60">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
            {product.isBestSeller ? (
              <span className="apple-glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Best Seller
              </span>
            ) : (
              <span className="apple-glass-pill px-2 py-0.5 rounded-full text-[10px] font-medium text-gray-200 capitalize">
                {product.category}
              </span>
            )}

            {isOutOfStock ? (
              <span className="bg-rose-500/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-white">
                Habis
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-500/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-white">
                Sisa {product.stock}
              </span>
            ) : null}
          </div>

          {/* Bottom Info inside image */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-gray-200 font-medium pointer-events-none">
            <span className="apple-glass-pill px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              {product.preparationTimeMinutes} mnt
            </span>

            {product.options && product.options.length > 0 && (
              <span className="apple-glass-pill px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] text-indigo-300">
                <SlidersHorizontal className="w-2.5 h-2.5" />
                Custom
              </span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-amber-300 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Price & Add Button */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-gray-400 block font-medium">Harga</span>
          <span className="text-base font-bold text-white tracking-tight">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          onClick={handleAction}
          disabled={isOutOfStock}
          className={`h-9 px-3.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
            isOutOfStock
              ? 'bg-white/10 text-gray-500 cursor-not-allowed'
              : 'bg-white text-gray-900 hover:bg-amber-400 hover:text-gray-950 active:scale-95'
          }`}
          aria-label={`Tambah ${product.name} ke keranjang`}
        >
          {product.options && product.options.length > 0 ? (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Pilih</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
