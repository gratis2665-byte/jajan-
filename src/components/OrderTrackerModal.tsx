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
          className="fixed inset-0 bg-[#361A0C]/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden relative z-10 border border-[#EFE8DE] shadow-2xl flex flex-col max-h-[92vh] text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#D81A3C] flex items-center justify-center border border-red-100">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#1F1A17] tracking-tight font-heading">
                    Pesanan #{order.orderNumber}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                      order.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.status === 'cooking'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        : 'bg-red-50 text-[#D81A3C] border border-red-200'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-[#736962]">
                  Dipesan pada {new Date(order.createdAt).toLocaleTimeString('id-ID')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTrackOrderId(null)}
              className="w-8 h-8 rounded-full border border-[#EFE8DE] bg-white flex items-center justify-center text-[#736962] hover:text-[#1F1A17] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tracker Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 bg-white">
            {/* Real-Time Stepper Bar */}
            <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#EFE8DE]">
              <div className="grid grid-cols-4 gap-2 relative">
                {/* Connecting track line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#EFE8DE] -z-0" />
                <div
                  className="absolute top-4 left-6 h-0.5 bg-[#D81A3C] -z-0 transition-all duration-700"
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
                            ? 'bg-[#D81A3C] text-white ring-4 ring-red-100 scale-110 shadow-xs'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-[#A89C92] border border-[#EFE8DE]'
                        }`}
                      >
                        {st.icon}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-2 leading-tight font-heading ${
                          isCurrent ? 'text-[#D81A3C]' : isDone ? 'text-[#1F1A17]' : 'text-[#A89C92]'
                        }`}
                      >
                        {st.label}
                      </span>
                      <span className="text-[9px] text-[#736962] mt-0.5 hidden sm:block">
                        {st.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Payment Special Action Box */}
            {order.status === 'pending_payment' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-amber-800 font-heading">Menunggu Pembayaran</p>
                  <p className="text-[11px] text-[#736962]">
                    Selesaikan tagihan Rp {order.total.toLocaleString('id-ID')} via {order.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => confirmOrderPayment(order.id)}
                  className="px-3.5 py-1.5 rounded-full bg-[#D81A3C] text-white font-bold text-xs hover:bg-[#BF1231] transition cursor-pointer shadow-xs"
                >
                  Bayar Sekarang
                </button>
              </div>
            )}

            {/* Fulfillment Detail Cards (Pickup vs Delivery) */}
            {isDelivery ? (
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE8DE] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#D81A3C]" />
                    <span className="text-xs font-bold text-[#1F1A17] font-heading">Status Pengiriman Kurir Kilat</span>
                  </div>
                  <span className="text-[10px] text-[#D81A3C] font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    Instant Motor
                  </span>
                </div>

                {/* Driver Profile */}
                <div className="p-3 bg-white rounded-xl border border-[#EFE8DE] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1F1A17] text-white flex items-center justify-center font-bold text-sm">
                      B
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F1A17]">Budi Setiawan (Kurir Jajan)</p>
                      <p className="text-[11px] text-[#736962]">Honda Vario • B 4921 TKY</p>
                    </div>
                  </div>

                  <a
                    href="tel:081234567890"
                    className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#1F1A17] border border-[#EFE8DE] transition flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hubungi</span>
                  </a>
                </div>

                <div className="flex items-start gap-2 text-xs text-[#52311D]">
                  <MapPin className="w-3.5 h-3.5 text-[#D81A3C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1F1A17]">Alamat Pengantaran:</span>
                    <p className="text-[#736962] text-[11px]">
                      {order.deliveryAddress || 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE8DE] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-[#1F1A17] font-heading">Ambil Sendiri di Gerai Jajan</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {order.pickupCounter || 'Counter A-03'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EFE8DE] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#736962]">Tunjukkan barcode / no. pesanan ini ke barista:</p>
                    <p className="text-xl font-mono font-black text-[#D81A3C] mt-1 font-heading">
                      #{order.orderNumber}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#EFE8DE]">
                    <QrCode className="w-8 h-8 text-[#1F1A17]" />
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Stream */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#736962] uppercase tracking-wider block">
                Riwayat Aktivitas Pesanan Real-Time
              </label>
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE8DE] space-y-3">
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D81A3C] shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1F1A17] capitalize">
                          {event.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#A89C92]">{event.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#736962] leading-relaxed">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#736962] uppercase tracking-wider block">
                Ringkasan Menu
              </label>
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE8DE] space-y-2 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1">
                    <div className="min-w-0">
                      <p className="font-bold text-[#1F1A17] truncate">
                        {item.quantity}x {item.product.name}
                      </p>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-[10px] text-[#736962] truncate">
                          {item.selectedOptions.map((o) => o.choiceLabel).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-[#52311D] font-bold shrink-0">
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}

                <div className="pt-2 border-t border-[#EFE8DE] flex justify-between font-black text-sm text-[#1F1A17] font-heading">
                  <span>Total Bayar ({order.paymentMethod.toUpperCase()})</span>
                  <span className="text-[#D81A3C] text-base">
                    Rp {order.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DE] text-xs space-y-2">
              <p className="text-[11px] font-bold text-[#736962] uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Simulasi Alur Pesanan (Demo Real-Time):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'cooking')}
                  className="py-1.5 px-2.5 rounded-full bg-white hover:bg-[#F3ECE1] text-[#1F1A17] border border-[#EFE8DE] text-[11px] font-medium transition cursor-pointer"
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
                  className="py-1.5 px-2.5 rounded-full bg-white hover:bg-[#F3ECE1] text-[#1F1A17] border border-[#EFE8DE] text-[11px] font-medium transition cursor-pointer"
                >
                  Set: {isDelivery ? 'Kurir Jalan' : 'Siap Diambil'}
                </button>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="py-1.5 px-2.5 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition cursor-pointer col-span-2 sm:col-span-1"
                >
                  Set: Pesanan Selesai
                </button>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 sm:p-5 border-t border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between">
            <span className="text-xs text-[#736962]">
              CS Hotline: 0812-3456-7890
            </span>

            {order.status !== 'completed' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'completed', 'Dikonfirmasi selesai oleh pelanggan.')}
                className="py-2 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
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
