import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Store,
  Truck,
  TicketPercent,
  ArrowRight,
  MapPin,
  Clock,
  Check,
} from 'lucide-react';
import { FulfillmentType } from '../types';
import { playTapSound } from '../services/soundEffects';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    setIsCheckoutOpen,
  } = useApp();

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherInput.trim().toUpperCase();

    if (code === 'JAJANHEMAT') {
      const discount = Math.min(15000, Math.round(cartSubtotal * 0.2));
      setAppliedVoucher({ code, discountAmount: discount });
      setVoucherInput('');
    } else if (code === 'GRATISONGKIR') {
      if (fulfillmentType === 'delivery') {
        setAppliedVoucher({ code, discountAmount: 12000 });
        setVoucherInput('');
      } else {
        setVoucherError('Voucher ini khusus untuk pengantaran kurir');
      }
    } else {
      setVoucherError('Kode voucher tidak valid (coba: JAJANHEMAT)');
    }
  };

  const deliveryFee = fulfillmentType === 'delivery' ? 12000 : 0;
  const serviceFee = 2000;
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const grandTotal = Math.max(0, cartSubtotal + deliveryFee + serviceFee - discount);

  const handleProceedToPayment = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-[#361A0C]/50 backdrop-blur-xs"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          {/* Drawer Card - Warm Human Craft Style */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-md bg-white flex flex-col justify-between border-l border-[#EFE8DE] shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#EFE8DE] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D81A3C] text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1F1A17] tracking-tight font-heading">
                    Keranjang Pesanan
                  </h2>
                  <p className="text-[11px] text-[#736962]">{cart.length} item unik dipilih</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-[#D81A3C] hover:text-[#BF1231] px-2 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer font-semibold"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full border border-[#EFE8DE] bg-white flex items-center justify-center text-[#736962] hover:text-[#1F1A17] transition cursor-pointer"
                  aria-label="Tutup keranjang"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAF7F2]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white border border-[#EFE8DE] flex items-center justify-center text-[#736962]">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base font-bold text-[#1F1A17] font-heading">
                    Keranjang Anda Masih Kosong
                  </h3>
                  <p className="text-xs text-[#736962] max-w-xs">
                    Yuk pilih jajanan lezat, snack, dan minuman segar favorit Anda di katalog menu kami!
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-3 px-5 py-2.5 rounded-full bg-[#D81A3C] text-white font-bold text-xs hover:bg-[#BF1231] transition cursor-pointer shadow-sm"
                  >
                    Eksplor Menu Jajan
                  </button>
                </div>
              ) : (
                <>
                  {/* Fulfillment Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#736962] uppercase tracking-wider">
                      Metode Pengantaran
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-[#EFE8DE]">
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setFulfillmentType('pickup');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          fulfillmentType === 'pickup'
                            ? 'bg-[#1F1A17] text-white shadow-xs'
                            : 'text-[#736962] hover:text-[#1F1A17]'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Ambil Sendiri</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setFulfillmentType('delivery');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          fulfillmentType === 'delivery'
                            ? 'bg-[#D81A3C] text-white shadow-xs'
                            : 'text-[#736962] hover:text-[#1F1A17]'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Kurir Antar</span>
                      </button>
                    </div>

                    {/* Delivery / Pickup Info Box */}
                    {fulfillmentType === 'delivery' ? (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EFE8DE] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-[#D81A3C] font-bold">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Alamat Pengiriman Kurir Instant:</span>
                        </div>
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Masukkan alamat pengiriman lengkap..."
                          className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-xl p-2 text-xs text-[#1F1A17] placeholder-[#736962] focus:outline-none focus:border-[#D81A3C]"
                        />
                        <p className="text-[10px] text-[#736962] flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-[#D81A3C]" /> Estimasi tiba: 25 - 35 menit
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EFE8DE] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[#52311D]">
                          <Store className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="font-bold text-[#1F1A17]">Pick-up di Outlet Jajan</p>
                            <p className="text-[10px] text-[#736962]">Siap dalam ±15 menit di Counter Pick-up</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Gratis
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-[#736962] uppercase tracking-wider">
                      Daftar Pesanan ({cart.length})
                    </label>

                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-3 border border-[#EFE8DE] flex gap-3 text-left shadow-xs"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#FAF7F2]"
                        />

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-[#1F1A17] truncate leading-tight font-heading">
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-[#736962] hover:text-[#D81A3C] transition p-1"
                                aria-label="Hapus item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Chosen options */}
                            {item.selectedOptions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedOptions.map((opt) => (
                                  <span
                                    key={opt.choiceLabel}
                                    className="text-[9px] bg-[#FAF7F2] text-[#52311D] px-1.5 py-0.5 rounded-md border border-[#EFE8DE]"
                                  >
                                    {opt.choiceLabel}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.notes && (
                              <p className="text-[10px] text-[#D81A3C] italic mt-0.5 truncate">
                                "{item.notes}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#EFE8DE]">
                            <span className="text-xs font-extrabold text-[#1F1A17]">
                              Rp {item.totalPrice.toLocaleString('id-ID')}
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#EFE8DE] rounded-lg p-0.5">
                              <button
                                onClick={() => {
                                  playTapSound();
                                  updateCartQuantity(item.id, -1);
                                }}
                                className="w-5 h-5 rounded-md hover:bg-white text-[#1F1A17] flex items-center justify-center transition cursor-pointer"
                                aria-label="Kurangi"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[11px] font-bold text-[#1F1A17] px-1">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  playTapSound();
                                  updateCartQuantity(item.id, 1);
                                }}
                                className="w-5 h-5 rounded-md hover:bg-white text-[#1F1A17] flex items-center justify-center transition cursor-pointer"
                                aria-label="Tambah"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Voucher */}
                  <div className="space-y-1.5">
                    <form onSubmit={handleApplyVoucher} className="flex gap-2">
                      <div className="relative flex-1">
                        <TicketPercent className="w-4 h-4 text-[#D81A3C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value)}
                          placeholder="Kode Voucher (JAJANHEMAT)"
                          className="w-full bg-white border border-[#EFE8DE] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1F1A17] uppercase placeholder-[#736962] focus:outline-none focus:border-[#D81A3C]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#1F1A17] hover:bg-[#361A0C] text-white text-xs font-bold transition cursor-pointer"
                      >
                        Pakai
                      </button>
                    </form>

                    {appliedVoucher && (
                      <div className="flex items-center justify-between text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl">
                        <span className="flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Voucher {appliedVoucher.code} Aktif
                        </span>
                        <span className="font-bold">-Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    {voucherError && (
                      <p className="text-[10px] text-[#D81A3C] px-1 font-semibold">{voucherError}</p>
                    )}
                  </div>

                  {/* Bill Summary */}
                  <div className="bg-white rounded-2xl p-4 border border-[#EFE8DE] space-y-2 text-xs shadow-xs">
                    <div className="flex justify-between text-[#52311D]">
                      <span>Subtotal Jajan</span>
                      <span className="font-semibold text-[#1F1A17]">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between text-[#52311D]">
                      <span>Biaya Pengantaran</span>
                      <span className="font-semibold text-[#1F1A17]">
                        {fulfillmentType === 'delivery' ? `Rp ${deliveryFee.toLocaleString('id-ID')}` : 'Gratis (Pick-up)'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#52311D]">
                      <span>Biaya Layanan &amp; Kemasan</span>
                      <span className="font-semibold text-[#1F1A17]">Rp {serviceFee.toLocaleString('id-ID')}</span>
                    </div>

                    {appliedVoucher && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Diskon Voucher</span>
                        <span>-Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-[#EFE8DE] flex justify-between text-sm font-black text-[#1F1A17] font-heading">
                      <span>Total Pembayaran</span>
                      <span className="text-[#D81A3C] text-base">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Checkout Action */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-[#EFE8DE] bg-white">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full py-3.5 px-5 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-extrabold text-sm flex items-center justify-between shadow-lg shadow-red-900/15 active:scale-98 transition cursor-pointer"
                >
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider block opacity-90 font-medium">
                      Lanjut Pembayaran
                    </span>
                    <span className="text-base font-black font-heading">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full font-bold text-xs">
                    <span>Pilih Bayar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
