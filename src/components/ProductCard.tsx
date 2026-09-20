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
    <div
      onClick={() => setSelectedProductForDetail(product)}
      className="bg-white rounded-2xl p-4 flex flex-col justify-between cursor-pointer group border border-[#E8DEC8] hover:border-[#C4B29C] hover:shadow-md transition-all relative"
    >
      <div>
        {/* Image Container */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-[#FAF7F2]">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
            {product.isBestSeller ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D81A3C] text-white shadow-xs">
                Favorit
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 text-[#52311D] border border-[#E8DEC8] capitalize">
                {product.category}
              </span>
            )}

            {isOutOfStock ? (
              <span className="bg-[#2C1810] px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs">
                Stok Habis
              </span>
            ) : isLowStock ? (
              <span className="bg-[#FFF4E5] border border-[#F5DCB7] px-2 py-0.5 rounded-md text-[10px] font-bold text-[#8C3A0A]">
                Sisa {product.stock}
              </span>
            ) : null}
          </div>

          {/* Prep time badge */}
          <div className="absolute bottom-2 left-2 bg-[#2C1810]/80 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] text-white font-medium">
            <Clock className="w-3 h-3 text-[#FFC224]" />
            <span>± {product.preparationTimeMinutes} menit</span>
          </div>
        </div>

        {/* Product Details */}
        <h3 className="font-bold text-[#2C1810] text-base leading-snug line-clamp-1 group-hover:text-[#D81A3C] transition-colors font-heading">
          {product.name}
        </h3>
        <p className="text-xs text-[#736962] mt-1.5 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Price & Add To Cart Button */}
      <div className="mt-4 pt-3 border-t border-[#EFE8DE] flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-[#8C7D73] block font-medium">Harga</span>
          <span className="text-base font-extrabold text-[#2C1810] tracking-tight font-heading">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          onClick={handleAction}
          disabled={isOutOfStock}
          className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isOutOfStock
              ? 'bg-[#EFE8DE] text-[#8C7D73] cursor-not-allowed'
              : 'bg-[#D81A3C] hover:bg-[#BF1231] text-white active:scale-95 shadow-xs'
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
              <span>Tambah</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
