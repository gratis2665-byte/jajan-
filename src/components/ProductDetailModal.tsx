import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Product, SelectedOption } from '../types';
import { X, Plus, Minus, Clock, ShoppingBag, Sparkles, Check, Star } from 'lucide-react';
import { playTapSound } from '../services/soundEffects';

export const ProductDetailModal: React.FC = () => {
  const { selectedProductForDetail, setSelectedProductForDetail, addToCart } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [notes, setNotes] = useState('');

  // Reset form when modal opens with a new product
  useEffect(() => {
    if (selectedProductForDetail) {
      setQuantity(1);
      setNotes('');
      // Set default first choice for single-choice option groups
      if (selectedProductForDetail.options) {
        const defaults: SelectedOption[] = selectedProductForDetail.options.map((opt) => ({
          optionName: opt.name,
          choiceLabel: opt.choices[0].label,
          extraPrice: opt.choices[0].extraPrice,
        }));
        setSelectedOptions(defaults);
      } else {
        setSelectedOptions([]);
      }
    }
  }, [selectedProductForDetail]);

  if (!selectedProductForDetail) return null;

  const product = selectedProductForDetail;

  const handleOptionSelect = (optionName: string, choiceLabel: string, extraPrice: number) => {
    playTapSound();
    setSelectedOptions((prev) => {
      const filtered = prev.filter((item) => item.optionName !== optionName);
      return [...filtered, { optionName, choiceLabel, extraPrice }];
    });
  };

  const extraTotal = selectedOptions.reduce((acc, opt) => acc + opt.extraPrice, 0);
  const unitPrice = product.price + extraTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedOptions, notes);
    setSelectedProductForDetail(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedProductForDetail(null)}
          className="fixed inset-0 bg-[#361A0C]/50 backdrop-blur-xs"
        />

        {/* Modal Content - Warm Human Craft Style */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative z-10 border border-[#EFE8DE] shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header Image */}
          <div className="relative w-full h-56 shrink-0 bg-[#FAF7F2]">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Close Button */}
            <button
              onClick={() => setSelectedProductForDetail(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 text-[#1F1A17] flex items-center justify-center hover:bg-white transition cursor-pointer shadow-md"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Product Title on Image */}
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                {product.isBestSeller && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FFC224] text-[#1F1A17] flex items-center gap-1 shadow-xs uppercase">
                    Recommended
                  </span>
                )}
                <span className="bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] text-white font-medium capitalize">
                  {product.category}
                </span>
                <span className="bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] text-[#FFC224] flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" /> {product.preparationTimeMinutes} mnt
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight font-heading drop-shadow-sm">
                {product.name}
              </h2>
            </div>
          </div>

          {/* Body Options */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left bg-white">
            <p className="text-xs sm:text-sm text-[#736962] leading-relaxed">{product.description}</p>

            {/* Custom Options */}
            {product.options &&
              product.options.map((optionGroup) => (
                <div key={optionGroup.name} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1F1A17] tracking-wide uppercase font-heading">
                      {optionGroup.name}
                    </label>
                    <span className="text-[11px] text-[#736962] font-medium">Pilih salah satu</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {optionGroup.choices.map((choice) => {
                      const isSelected = selectedOptions.some(
                        (so) => so.optionName === optionGroup.name && so.choiceLabel === choice.label
                      );

                      return (
                        <button
                          key={choice.label}
                          type="button"
                          onClick={() =>
                            handleOptionSelect(optionGroup.name, choice.label, choice.extraPrice)
                          }
                          className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-red-50/70 border-[#D81A3C] text-[#1F1A17] shadow-xs'
                              : 'bg-[#FAF7F2] border-[#EFE8DE] text-[#52311D] hover:bg-[#F3ECE1]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-[#D81A3C] bg-[#D81A3C]' : 'border-[#A89C92]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </div>
                            <span className="text-xs font-bold">{choice.label}</span>
                          </div>
                          {choice.extraPrice > 0 && (
                            <span className="text-[11px] font-bold text-[#D81A3C]">
                              +{choice.extraPrice.toLocaleString('id-ID')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Special Instructions / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F1A17] tracking-wide uppercase font-heading">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Saus dipisah, es jangan terlalu manis, dll."
                rows={2}
                className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-2xl p-3 text-xs text-[#1F1A17] placeholder-[#736962] focus:outline-none focus:border-[#D81A3C] transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-[#EFE8DE] bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2 bg-white border border-[#EFE8DE] p-1 rounded-full w-full sm:w-auto justify-between shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#1F1A17] flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                aria-label="Kurangi jumlah"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="text-sm font-extrabold text-[#1F1A17] px-3 min-w-[2rem] text-center font-heading">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setQuantity((q) => Math.min(product.stock, q + 1));
                }}
                disabled={quantity >= product.stock}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#1F1A17] flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                aria-label="Tambah jumlah"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Submit Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full sm:flex-1 py-3 px-6 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-extrabold text-sm flex items-center justify-between shadow-md shadow-red-900/15 active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-white" />
                <span>Tambah Pesanan</span>
              </div>
              <span className="font-black text-base font-heading">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
