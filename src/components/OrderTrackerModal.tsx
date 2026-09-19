import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  X,
  CheckCircle2,
  Clock,
  ChefHat,
  Store,
  Truck,
  MapPin,
  Phone,
  QrCode,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { OrderStatus } from '../types';

export const OrderTrackerModal: React.FC = () => {
  const {
    activeTrackOrderId,
    setActiveTrackOrderId,
    orders,
    updateOrderStatus,
    confirmOrderPayment,
  } = useApp();

  if (!activeTrackOrderId) return null;

  const order = orders.find((o) => o.id === activeTrackOrderId);
  if (!order) return null;

  const isDelivery = order.fulfillmentType === 'delivery';

  // Step definitions
  const steps: { key: OrderStatus; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'confirmed',
      label: 'Dikonfirmasi',
      icon: <CheckCircle2 className="w-4 h-4" />,
      desc: 'Pembayaran diverifikasi',
    },
    {
      key: 'cooking',
      label: 'Sedang Dimasak',
      icon: <ChefHat className="w-4 h-4" />,
      desc: 'Dapur sedang meracik',
    },
    {
      key: isDelivery ? 'delivering' : 'ready_for_pickup',
      label: isDelivery ? 'Kurir Mengantar' : 'Siap Diambil',
      icon: isDelivery ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />,
      desc: isDelivery ? 'Sedang dalam perjalanan' : `Ambil di ${order.pickupCounter || 'Counter A-01'}`,
    },
    {
      key: 'completed',
      label: 'Selesai',
      icon: <Sparkles className="w-4 h-4" />,
      desc: 'Pesanan telah diterima',
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return -1;
      case 'confirmed':
        return 0;
      case 'cooking':
        return 1;
      case 'ready_for_pickup':
      case 'delivering':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveTrackOrderId(null)}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="apple-glass rounded-3xl w-full max-w-2xl overflow-hidden relative z-10 border border-white/20 shadow-2xl flex flex-col max-h-[92vh] bg-gray-950/90 text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Pesanan #{order.orderNumber}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      order.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : order.status === 'cooking'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Dipesan pada {new Date(order.createdAt).toLocaleTimeString('id-ID')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTrackOrderId(null)}
              className="w-8 h-8 rounded-full apple-glass-pill flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tracker Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {/* Real-Time Stepper Bar */}
            <div className="apple-glass rounded-2xl p-5 border border-white/10">
              <div className="grid grid-cols-4 gap-2 relative">
                {/* Connecting track line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-white/10 -z-0" />
                <div
                  className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 -z-0 transition-all duration-700"
                  style={{
                    width: `${Math.max(0, Math.min(100, (currentStepIdx / 3) * 100))}%`,
                  }}
                />

                {steps.map((st, index) => {
                  const isDone = index <= currentStepIdx;
                  const isCurrent = index === currentStepIdx;

                  return (
                    <div key={st.key} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isCurrent
                            ? 'bg-amber-400 text-gray-950 ring-4 ring-amber-400/30 scale-110 shadow-lg'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-800 text-gray-500 border border-white/10'
                        }`}
                      >
                        {st.icon}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-2 leading-tight ${
                          isCurrent ? 'text-amber-300' : isDone ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {st.label}
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">
                        {st.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Payment Special Action Box */}
            {order.status === 'pending_payment' && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-amber-300">Menunggu Pembayaran</p>
                  <p className="text-[11px] text-gray-300">
                    Selesaikan tagihan Rp {order.total.toLocaleString('id-ID')} via {order.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => confirmOrderPayment(order.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs hover:bg-amber-300 transition cursor-pointer"
                >
                  Bayar Sekarang
                </button>
              </div>
            )}

            {/* Fulfillment Detail Cards (Pickup vs Delivery) */}
            {isDelivery ? (
              <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Status Pengiriman Kurir Kilat</span>
                  </div>
                  <span className="text-[10px] text-sky-300 font-semibold bg-sky-500/20 px-2 py-0.5 rounded-md">
                    Instant Motor
                  </span>
                </div>

                {/* Driver Profile */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      B
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Budi Setiawan (Kurir Jajan)</p>
                      <p className="text-[11px] text-gray-400">Honda Vario • B 4921 TKY</p>
                    </div>
                  </div>

                  <a
                    href="tel:081234567890"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hubungi</span>
                  </a>
                </div>

                <div className="flex items-start gap-2 text-xs text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Alamat Pengantaran:</span>
                    <p className="text-gray-400 text-[11px]">
                      {order.deliveryAddress || 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Ambil Sendiri di Gerai Jajan</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    {order.pickupCounter || 'Counter A-03'}
                  </span>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-400">Tunjukkan barcode / no. pesanan ini ke barista:</p>
                    <p className="text-xl font-mono font-black text-amber-300 mt-1">
                      #{order.orderNumber}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <QrCode className="w-8 h-8 text-gray-950" />
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Stream */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block">
                Riwayat Aktivitas Pesanan Real-Time
              </label>
              <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-3">
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white capitalize">
                          {event.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-500">{event.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block">
                Ringkasan Menu
              </label>
              <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        {item.quantity}x {item.product.name}
                      </p>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-[10px] text-gray-400 truncate">
                          {item.selectedOptions.map((o) => o.choiceLabel).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-300 font-semibold shrink-0">
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}

                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-white">
                  <span>Total Bayar ({order.paymentMethod.toUpperCase()})</span>
                  <span className="text-amber-400">
                    Rp {order.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Simulation Controls (For easy demo testing) */}
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Simulasi Alur Pesanan (Demo Real-Time):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'cooking')}
                  className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-[11px] font-medium transition cursor-pointer"
                >
                  Set: Dimasak Dapur
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateOrderStatus(
                      order.id,
                      isDelivery ? 'delivering' : 'ready_for_pickup'
                    )
                  }
                  className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-[11px] font-medium transition cursor-pointer"
                >
                  Set: {isDelivery ? 'Kurir Jalan' : 'Siap Diambil'}
                </button>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="py-1.5 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium transition cursor-pointer col-span-2 sm:col-span-1"
                >
                  Set: Pesanan Selesai
                </button>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Butuh bantuan? CS WhatsApp 0812-3456-7890
            </span>

            {order.status !== 'completed' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'completed', 'Dikonfirmasi selesai oleh pelanggan.')}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Pesanan Sudah Diterima</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
