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
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          {/* Drawer Card */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-md apple-glass flex flex-col justify-between border-l border-white/20 shadow-2xl bg-gray-950/85 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Keranjang Belanja</h2>
                  <p className="text-[11px] text-gray-400">{cart.length} item unik dipilih</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer font-medium"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full apple-glass-pill flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
                  aria-label="Tutup keranjang"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Keranjang Anda Masih Kosong</h3>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Yuk pilih jajanan lezat dan minuman segar favorit Anda di katalog menu kami!
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-white text-gray-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
                  >
                    Eksplor Menu Jajan
                  </button>
                </div>
              ) : (
                <>
                  {/* Fulfillment Type Selector (Kurir Antar vs Ambil di Tempat) */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                      Metode Penerimaan
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setFulfillmentType('pickup');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          fulfillmentType === 'pickup'
                            ? 'bg-amber-400 text-gray-950 shadow-md'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Ambil di Tempat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setFulfillmentType('delivery');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          fulfillmentType === 'delivery'
                            ? 'bg-amber-400 text-gray-950 shadow-md'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Kurir Antar</span>
                      </button>
                    </div>

                    {/* Delivery / Pickup Info Box */}
                    {fulfillmentType === 'delivery' ? (
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Alamat Pengiriman Kurir Instant:</span>
                        </div>
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Masukkan alamat pengiriman lengkap..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                        />
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" /> Estimasi tiba: 25 - 35 menit
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Store className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="font-semibold text-white">Pick-up di Outlet Jajan</p>
                            <p className="text-[10px] text-gray-400">Siap dalam ±15 menit di Counter Pick-up</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400">Gratis</span>
                      </div>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                      Daftar Pesanan ({cart.length})
                    </label>

                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="apple-glass rounded-2xl p-3 border border-white/10 flex gap-3 text-left"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-900"
                        />

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-white truncate leading-tight">
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-500 hover:text-rose-400 transition p-1"
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
                                    className="text-[9px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-md"
                                  >
                                    {opt.choiceLabel}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.notes && (
                              <p className="text-[10px] text-amber-300/80 italic mt-0.5 truncate">
                                "{item.notes}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                            <span className="text-xs font-bold text-white">
                              Rp {item.totalPrice.toLocaleString('id-ID')}
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg p-0.5">
                              <button
                                onClick={() => {
                                  playTapSound();
                                  updateCartQuantity(item.id, -1);
                                }}
                                className="w-5 h-5 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                                aria-label="Kurangi"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[11px] font-bold text-white px-1">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  playTapSound();
                                  updateCartQuantity(item.id, 1);
                                }}
                                className="w-5 h-5 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
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
                        <TicketPercent className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value)}
                          placeholder="Kode Voucher (JAJANHEMAT)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white uppercase placeholder-gray-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Pakai
                      </button>
                    </form>

                    {appliedVoucher && (
                      <div className="flex items-center justify-between text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-2 rounded-xl">
                        <span className="flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Voucher {appliedVoucher.code} Aktif
                        </span>
                        <span>-Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    {voucherError && (
                      <p className="text-[10px] text-rose-400 px-1">{voucherError}</p>
                    )}
                  </div>

                  {/* Bill Summary */}
                  <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal Jajan</span>
                      <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between text-gray-300">
                      <span>Biaya Pengantaran</span>
                      <span>
                        {fulfillmentType === 'delivery' ? `Rp ${deliveryFee.toLocaleString('id-ID')}` : 'Gratis (Pick-up)'}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-300">
                      <span>Biaya Layanan &amp; Kemasan</span>
                      <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
                    </div>

                    {appliedVoucher && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Diskon Voucher</span>
                        <span>-Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-extrabold text-white">
                      <span>Total Pembayaran</span>
                      <span className="text-amber-400">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Checkout Action */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-black/40 backdrop-blur-md">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm flex items-center justify-between shadow-xl shadow-rose-500/20 active:scale-98 transition cursor-pointer"
                >
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider block opacity-80 font-medium">
                      Lanjut Pembayaran Digital
                    </span>
                    <span className="text-base font-bold">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl font-bold text-xs">
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
