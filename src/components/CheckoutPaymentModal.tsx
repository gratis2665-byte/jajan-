import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  X,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Download,
  AlertCircle,
} from 'lucide-react';
import { PaymentMethod, FulfillmentType } from '../types';
import { playTapSound } from '../services/soundEffects';

export const CheckoutPaymentModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    createOrder,
    confirmOrderPayment,
    setActiveTrackOrderId,
    setActiveTab,
    qrisSettings,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan');
  const [customerName, setCustomerName] = useState('Dimas Pratama');
  const [customerPhone, setCustomerPhone] = useState('085712345678');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(899); // 15 mins

  // Countdown timer for QRIS
  useEffect(() => {
    if (!isCheckoutOpen) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const deliveryFee = fulfillmentType === 'delivery' ? 12000 : 0;
  const serviceFee = 2000;
  const totalAmount = cartSubtotal + deliveryFee + serviceFee;

  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const vaNumber = '8271085712345678';

  const handleCopyVA = () => {
    navigator.clipboard.writeText(vaNumber);
    setCopiedVA(true);
    setTimeout(() => setCopiedVA(false), 2000);
  };

  const handleExecutePayment = (autoConfirm: boolean = true) => {
    playTapSound();
    setIsProcessing(true);

    setTimeout(() => {
      // 1. Create order
      const newOrder = createOrder({
        customerName,
        customerPhone,
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        paymentMethod,
      });

      // 2. If autoConfirm (e.g. simulated QRIS or e-wallet), confirm immediately
      if (autoConfirm) {
        confirmOrderPayment(newOrder.id);
      }

      setIsProcessing(false);
      setIsCheckoutOpen(false);

      // Open Tracker directly
      setActiveTrackOrderId(newOrder.id);
      setActiveTab('tracker');
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCheckoutOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="apple-glass rounded-3xl w-full max-w-xl overflow-hidden relative z-10 border border-white/20 shadow-2xl flex flex-col max-h-[92vh] bg-gray-950/90 text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pembayaran Digital Terintegrasi
                </h3>
                <p className="text-[11px] text-gray-400">
                  Enkripsi aman via Payment Gateway Resmi
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="w-8 h-8 rounded-full apple-glass-pill flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Total Display */}
            <div className="apple-glass rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block uppercase tracking-wider font-medium">
                  Total Tagihan Jajan
                </span>
                <span className="text-2xl font-black text-amber-400">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-right text-[11px] text-gray-300">
                <p className="font-semibold">{cart.length} Jenis Menu</p>
                <p className="text-gray-400 capitalize">
                  {fulfillmentType === 'pickup' ? 'Ambil Sendiri' : 'Kurir Antar'}
                </p>
              </div>
            </div>

            {/* Customer Details input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                Pilih Jalur Pembayaran
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'qris'
                      ? 'bg-amber-400/20 border-amber-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold">QRIS Real-Time</span>
                  <span className="text-[9px] text-emerald-400">Instan &amp; Bebas Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('gopay')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'gopay' || paymentMethod === 'ovo' || paymentMethod === 'dana' || paymentMethod === 'shopeepay'
                      ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  <span className="text-xs font-bold">E-Wallet</span>
                  <span className="text-[9px] text-gray-400">GoPay / OVO / Dana</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bca_va')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'bca_va'
                      ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold">Virtual Account</span>
                  <span className="text-[9px] text-gray-400">BCA / Mandiri / BRI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold">Bayar di Kasir</span>
                  <span className="text-[9px] text-gray-400">Tunai / EDC</span>
                </button>
              </div>
            </div>

            {/* Dynamic View Per Selected Payment */}
            {paymentMethod === 'qris' && (
              <div className="apple-glass rounded-2xl p-5 border border-white/15 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-between w-full text-xs">
                  <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">
                      QRIS
                    </span>
                    <span>Standar Pembayaran Nasional</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedCountdown}</span>
                  </div>
                </div>

                {/* QR Container with Scanner line animation */}
                <div className="relative p-3 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col items-center">
                  {/* Decorative Scanner beam */}
                  <motion.div
                    animate={{ y: [0, 160, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_10px_#f43f5e] z-10 pointer-events-none"
                  />

                  {qrisSettings?.qrImageUrl ? (
                    <img
                      src={qrisSettings.qrImageUrl}
                      alt={`QRIS ${qrisSettings.merchantName}`}
                      className="w-44 h-44 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    /* Stylized QR Code SVG */
                    <svg
                      viewBox="0 0 200 200"
                      className="w-44 h-44 mx-auto text-gray-950"
                      fill="currentColor"
                    >
                      {/* Corner Position Detection Boxes */}
                      <rect x="10" y="10" width="50" height="50" rx="6" fill="#000" />
                      <rect x="18" y="18" width="34" height="34" rx="4" fill="#fff" />
                      <rect x="26" y="26" width="18" height="18" rx="2" fill="#000" />

                      <rect x="140" y="10" width="50" height="50" rx="6" fill="#000" />
                      <rect x="148" y="18" width="34" height="34" rx="4" fill="#fff" />
                      <rect x="156" y="26" width="18" height="18" rx="2" fill="#000" />

                      <rect x="10" y="140" width="50" height="50" rx="6" fill="#000" />
                      <rect x="18" y="148" width="34" height="34" rx="4" fill="#fff" />
                      <rect x="26" y="156" width="18" height="18" rx="2" fill="#000" />

                      {/* Data Pixels Representation */}
                      <rect x="70" y="20" width="10" height="20" fill="#000" />
                      <rect x="90" y="15" width="25" height="10" fill="#000" />
                      <rect x="70" y="50" width="15" height="15" fill="#000" />
                      <rect x="100" y="40" width="20" height="15" fill="#000" />

                      <rect x="20" y="70" width="15" height="10" fill="#000" />
                      <rect x="45" y="75" width="15" height="25" fill="#000" />
                      <rect x="70" y="80" width="25" height="20" fill="#000" />
                      <rect x="110" y="70" width="20" height="20" fill="#000" />
                      <rect x="145" y="70" width="15" height="30" fill="#000" />
                      <rect x="170" y="80" width="20" height="15" fill="#000" />

                      <rect x="20" y="110" width="25" height="15" fill="#000" />
                      <rect x="65" y="115" width="20" height="15" fill="#000" />
                      <rect x="95" y="105" width="30" height="25" fill="#000" />
                      <rect x="140" y="115" width="20" height="15" fill="#000" />
                      <rect x="170" y="110" width="15" height="20" fill="#000" />

                      <rect x="75" y="145" width="20" height="20" fill="#000" />
                      <rect x="110" y="140" width="15" height="35" fill="#000" />
                      <rect x="135" y="150" width="30" height="15" fill="#000" />
                      <rect x="175" y="145" width="15" height="25" fill="#000" />

                      <rect x="70" y="175" width="25" height="15" fill="#000" />
                      <rect x="140" y="175" width="20" height="15" fill="#000" />

                      {/* Center Brand Pill */}
                      <circle cx="100" cy="100" r="16" fill="#e11d48" />
                      <text
                        x="100"
                        y="104"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#fff"
                        textAnchor="middle"
                      >
                        {qrisSettings?.merchantName ? qrisSettings.merchantName.slice(0, 7) : 'JAJAN'}
                      </text>
                    </svg>
                  )}
                </div>

                <div className="text-xs text-gray-300 space-y-0.5">
                  <p className="font-bold text-white text-sm">
                    {qrisSettings?.merchantName || 'JAJAN RESTO'}
                  </p>
                  <p className="font-semibold text-gray-300">
                    NMID: <span className="text-amber-400">{qrisSettings?.nmid || 'ID1020260918001'}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {qrisSettings?.instructions || 'Buka BCA Mobile, GoPay, OVO, Dana, Livin atau ShopeePay lalu scan QRIS di atas.'}
                  </p>
                </div>

                {/* Instant Simulator Action */}
                <button
                  type="button"
                  onClick={() => handleExecutePayment(true)}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Memverifikasi Pembayaran...' : 'Simulasi Scan & Konfirmasi Bayar Otomatis'}
                  </span>
                </button>
              </div>
            )}

            {/* E-Wallet Selection */}
            {(paymentMethod === 'gopay' || paymentMethod === 'ovo' || paymentMethod === 'dana' || paymentMethod === 'shopeepay') && (
              <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-3">
                <p className="text-xs font-semibold text-white">Pilih Aplikasi E-Wallet Anda:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'gopay', label: 'GoPay', color: 'border-sky-400 bg-sky-500/10' },
                    { id: 'ovo', label: 'OVO', color: 'border-purple-400 bg-purple-500/10' },
                    { id: 'dana', label: 'DANA', color: 'border-blue-400 bg-blue-500/10' },
                    { id: 'shopeepay', label: 'ShopeePay', color: 'border-orange-400 bg-orange-500/10' },
                  ].map((ew) => (
                    <button
                      key={ew.id}
                      type="button"
                      onClick={() => setPaymentMethod(ew.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                        paymentMethod === ew.id ? ew.color + ' text-white ring-1 ring-white/30' : 'border-white/10 text-gray-400'
                      }`}
                    >
                      {ew.label}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-white/5 text-xs text-gray-300 space-y-1">
                  <p className="font-semibold text-white">Panduan Pembayaran Instant:</p>
                  <p className="text-[11px] text-gray-400">
                    Notifikasi pembayaran akan langsung dikirimkan ke aplikasi {paymentMethod.toUpperCase()} pada nomor {customerPhone}.
                  </p>
                </div>
              </div>
            )}

            {/* Virtual Account Bank */}
            {paymentMethod === 'bca_va' && (
              <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Bank BCA Virtual Account</span>
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">
                    BCA
                  </span>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Nomor Virtual Account</span>
                    <span className="text-base font-mono font-bold text-amber-300 tracking-wider">
                      {vaNumber}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyVA}
                    className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    {copiedVA ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-gray-400">
                  Pembayaran akan diverifikasi secara otomatis dalam 10 detik setelah transfer berhasil.
                </p>
              </div>
            )}

            {/* Cash di Kasir */}
            {paymentMethod === 'cash' && (
              <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Banknote className="w-4 h-4" />
                  <span>Bayar Tunai / EDC di Kasir Toko</span>
                </div>
                <p className="text-gray-300 text-[11px]">
                  Silakan tunjukkan nomor pesanan ke kasir saat mengambil pesanan Anda di gerai Jajan.
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between gap-3">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
            >
              Kembali
            </button>

            <button
              onClick={() => handleExecutePayment(paymentMethod !== 'cash')}
              disabled={isProcessing}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-98 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {paymentMethod === 'cash' ? 'Buat Pesanan & Bayar di Kasir' : 'Konfirmasi & Selesaikan Pembayaran'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
