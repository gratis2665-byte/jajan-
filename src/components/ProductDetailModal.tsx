import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Product, SelectedOption } from '../types';
import { X, Plus, Minus, Clock, ShoppingBag, Sparkles, Check } from 'lucide-react';
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
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="apple-glass rounded-3xl w-full max-w-lg overflow-hidden relative z-10 border border-white/20 shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header Image */}
          <div className="relative w-full h-56 shrink-0 bg-gray-950">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

            {/* Close Button */}
            <button
              onClick={() => setSelectedProductForDetail(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Product Title on Image */}
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                {product.isBestSeller && (
                  <span className="apple-glass-pill px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Best Seller
                  </span>
                )}
                <span className="apple-glass-pill px-2 py-0.5 rounded-full text-[10px] text-gray-300 capitalize">
                  {product.category}
                </span>
                <span className="apple-glass-pill px-2 py-0.5 rounded-full text-[10px] text-sky-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {product.preparationTimeMinutes} mnt
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{product.name}</h2>
            </div>
          </div>

          {/* Body Options */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left text-gray-200">
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{product.description}</p>

            {/* Custom Options */}
            {product.options &&
              product.options.map((optionGroup) => (
                <div key={optionGroup.name} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white tracking-wide uppercase">
                      {optionGroup.name}
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">Pilih salah satu</span>
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
                              ? 'bg-amber-400/15 border-amber-400/50 text-white shadow-sm'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-amber-400 bg-amber-400' : 'border-gray-500'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-gray-950 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-medium">{choice.label}</span>
                          </div>
                          {choice.extraPrice > 0 && (
                            <span className="text-[11px] font-semibold text-amber-300">
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
              <label className="text-xs font-semibold text-white tracking-wide uppercase">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Saus dipisah, es jangan terlalu banyak, dll."
                rows={2}
                className="w-full bg-white/5 border border-white/15 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-white/15 bg-gray-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3 bg-white/10 border border-white/15 p-1 rounded-2xl w-full sm:w-auto justify-between">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                aria-label="Kurangi jumlah"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="text-sm font-bold text-white px-3 min-w-[2rem] text-center">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setQuantity((q) => Math.min(product.stock, q + 1));
                }}
                disabled={quantity >= product.stock}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                aria-label="Tambah jumlah"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Submit Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-gray-950 font-bold text-sm flex items-center justify-between shadow-lg shadow-rose-500/20 active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-950" />
                <span>Tambah Pesanan</span>
              </div>
              <span className="font-extrabold text-base">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
