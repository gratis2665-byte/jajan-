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
          className="fixed inset-0 bg-[#361A0C]/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="bg-white rounded-3xl w-full max-w-xl overflow-hidden relative z-10 border border-[#EFE8DE] shadow-2xl flex flex-col max-h-[92vh] text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D81A3C] text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F1A17] tracking-tight font-heading">
                  Konfirmasi &amp; Pembayaran
                </h3>
                <p className="text-[11px] text-[#736962]">
                  Pilih metode pembayaran resmi &amp; aman
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="w-8 h-8 rounded-full border border-[#EFE8DE] bg-white flex items-center justify-center text-[#736962] hover:text-[#1F1A17] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-white">
            {/* Total Display */}
            <div className="bg-[#FFF8E7] rounded-2xl p-4 border border-[#FFC224] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#736962] block uppercase tracking-wider font-bold">
                  Total Tagihan Jajan
                </span>
                <span className="text-2xl font-black text-[#D81A3C] font-heading">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-right text-[11px] text-[#52311D]">
                <p className="font-bold">{cart.length} Jenis Menu</p>
                <p className="text-[#736962] capitalize font-medium">
                  {fulfillmentType === 'pickup' ? 'Ambil Sendiri' : 'Kurir Antar'}
                </p>
              </div>
            </div>

            {/* Customer Details input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#52311D] block mb-1 font-heading">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#52311D] block mb-1 font-heading">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                />
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#736962] uppercase tracking-wider">
                Pilih Jalur Pembayaran
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'qris'
                      ? 'bg-red-50 border-[#D81A3C] text-[#1F1A17] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#EFE8DE] text-[#52311D] hover:bg-[#F3ECE1]'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-[#D81A3C]" />
                  <span className="text-xs font-bold font-heading">QRIS Real-Time</span>
                  <span className="text-[9px] text-emerald-700 font-semibold">Instan &amp; Otomatis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('gopay')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'gopay' || paymentMethod === 'ovo' || paymentMethod === 'dana' || paymentMethod === 'shopeepay'
                      ? 'bg-red-50 border-[#D81A3C] text-[#1F1A17] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#EFE8DE] text-[#52311D] hover:bg-[#F3ECE1]'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-sky-600" />
                  <span className="text-xs font-bold font-heading">E-Wallet</span>
                  <span className="text-[9px] text-[#736962]">GoPay / OVO / Dana</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bca_va')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'bca_va'
                      ? 'bg-red-50 border-[#D81A3C] text-[#1F1A17] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#EFE8DE] text-[#52311D] hover:bg-[#F3ECE1]'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold font-heading">Virtual Account</span>
                  <span className="text-[9px] text-[#736962]">BCA / Mandiri / BRI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'cash'
                      ? 'bg-red-50 border-[#D81A3C] text-[#1F1A17] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#EFE8DE] text-[#52311D] hover:bg-[#F3ECE1]'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold font-heading">Bayar di Kasir</span>
                  <span className="text-[9px] text-[#736962]">Tunai / EDC</span>
                </button>
              </div>
            </div>

            {/* Dynamic View Per Selected Payment */}
            {paymentMethod === 'qris' && (
              <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#EFE8DE] flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-between w-full text-xs">
                  <div className="flex items-center gap-1.5 text-[#52311D] font-bold">
                    <span className="px-2 py-0.5 rounded bg-[#D81A3C] text-white font-black text-[10px]">
                      QRIS
                    </span>
                    <span>{qrisSettings.merchantName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-rose-600 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedCountdown}</span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl border border-[#EFE8DE] shadow-sm">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021226580016ID.CO.QRIS.WWW01189360099800000000005204581253033605802ID5914JAJAN_MAK_MIN6007JAKARTA61051219062070703A01630489AB"
                    alt="QRIS Barcode"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                </div>

                <p className="text-[11px] text-[#736962] max-w-xs">
                  Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay), lalu pindai kode QR di atas.
                </p>

                {/* Simulation Button */}
                <button
                  type="button"
                  onClick={() => handleExecutePayment(true)}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Memverifikasi Pembayaran...' : 'Saya Sudah Bayar (Konfirmasi Otomatis)'}</span>
                </button>
              </div>
            )}

            {paymentMethod === 'bca_va' && (
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE8DE] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#736962]">Nomor Virtual Account:</span>
                  <span className="font-bold text-[#D81A3C]">BCA Virtual Account</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EFE8DE] flex items-center justify-between">
                  <span className="text-base font-mono font-bold tracking-wider text-[#1F1A17]">
                    {vaNumber}
                  </span>
                  <button
                    onClick={handleCopyVA}
                    className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#1F1A17] transition flex items-center gap-1 font-bold text-[11px]"
                  >
                    {copiedVA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVA ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecutePayment(true)}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-full bg-[#1F1A17] hover:bg-[#361A0C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isProcessing ? 'Memeriksa VA...' : 'Cek Status Pembayaran VA'}</span>
                </button>
              </div>
            )}

            {(paymentMethod === 'gopay' || paymentMethod === 'cash') && (
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE8DE] space-y-3 text-xs">
                <p className="text-[#52311D]">
                  {paymentMethod === 'cash'
                    ? 'Pesanan Anda akan dicatat dan dapat langsung dibayar tunai atau kartu saat mengambil pesanan di kasir outlet.'
                    : 'Pesanan akan diarahkan ke aplikasi dompet digital Anda untuk konfirmasi pembayaran instan.'}
                </p>

                <button
                  type="button"
                  onClick={() => handleExecutePayment(paymentMethod !== 'cash')}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{isProcessing ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang'}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
