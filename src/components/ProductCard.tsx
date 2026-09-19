import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Clock, Plus, SlidersHorizontal, Sparkles, Star } from 'lucide-react';
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
      className="bg-white rounded-3xl p-4 flex flex-col justify-between cursor-pointer group border border-[#EFE8DE] shadow-xs hover:shadow-lg hover:border-[#E2D7C8] transition-all relative overflow-hidden"
    >
      <div>
        {/* Image Container with Badges (Inspired by IMG_1820 Clean Food Presentation) */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-[#FAF7F2] flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Top Badges (Yellow Recommended badge like IMG_1820) */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
            {product.isBestSeller ? (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FFC224] text-[#1F1A17] shadow-xs uppercase tracking-wide">
                Recommended
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-[#52311D] border border-[#EFE8DE] capitalize">
                {product.category}
              </span>
            )}

            {isOutOfStock ? (
              <span className="bg-[#D81A3C] px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs">
                Habis
              </span>
            ) : isLowStock ? (
              <span className="bg-[#FFC224] px-2 py-0.5 rounded-full text-[10px] font-bold text-[#1F1A17] shadow-xs">
                Sisa {product.stock}
              </span>
            ) : null}
          </div>

          {/* Cooking time pill */}
          <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] text-white font-medium">
            <Clock className="w-3 h-3 text-[#FFC224]" />
            <span>{product.preparationTimeMinutes} mnt</span>
          </div>
        </div>

        {/* 5-Star Rating row like IMG_1820 */}
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-3 h-3 text-[#FFC224] fill-[#FFC224]" />
          ))}
          <span className="text-[10px] text-[#736962] font-semibold ml-1">4.9</span>
        </div>

        {/* Product Details */}
        <h3 className="font-extrabold text-[#1F1A17] text-base leading-snug line-clamp-1 group-hover:text-[#D81A3C] transition-colors font-heading">
          {product.name}
        </h3>
        <p className="text-xs text-[#736962] mt-1 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Price & Add To Cart Button (Pill Button like IMG_1820 "Add To Cart") */}
      <div className="mt-4 pt-3 border-t border-[#EFE8DE] flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-[#736962] block font-semibold">Harga</span>
          <span className="text-base font-black text-[#1F1A17] tracking-tight font-heading">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          onClick={handleAction}
          disabled={isOutOfStock}
          className={`h-9 px-4 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            isOutOfStock
              ? 'bg-[#EFE8DE] text-[#736962] cursor-not-allowed'
              : 'bg-[#D81A3C] hover:bg-[#BF1231] text-white active:scale-95 shadow-red-900/10'
          }`}
          aria-label={`Tambah ${product.name} ke keranjang`}
        >
          {product.options && product.options.length > 0 ? (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Pilih Opsi</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
