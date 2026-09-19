import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  Store,
  Sparkles,
  ArrowRight,
  Receipt,
  Phone,
  QrCode,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { OrderStatus } from '../types';

export const OrderTrackerView: React.FC = () => {
  const {
    orders,
    activeTrackOrderId,
    setActiveTrackOrderId,
    updateOrderStatus,
    confirmOrderPayment,
    setActiveTab,
  } = useApp();

  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const pastOrders = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  const selectedOrder = orders.find((o) => o.id === activeTrackOrderId) || activeOrders[0] || pastOrders[0];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return 0;
      case 'confirmed':
        return 1;
      case 'cooking':
        return 2;
      case 'ready_for_pickup':
      case 'delivering':
        return 3;
      case 'completed':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pelacakan Pesanan Real-Time
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Pantau status persiapan dapur, kurir antar, dan nomor counter pick-up secara langsung.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('menu')}
          className="apple-glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-1.5 transition self-start cursor-pointer"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Pesan Menu Lain</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="apple-glass rounded-3xl p-12 text-center border border-white/10 space-y-3">
          <Clock className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Belum Ada Pesanan yang Dilacak</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Silakan pilih menu jajan favorit Anda di menu utama dan selesaikan pembayaran untuk mulai melacak.
          </p>
          <button
            onClick={() => setActiveTab('menu')}
            className="px-5 py-2.5 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs hover:bg-amber-300 transition"
          >
            Buka Katalog Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order Selector / Orders List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Daftar Pesanan ({orders.length})
            </h3>

            <div className="space-y-2.5">
              {orders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const isOngoing = ord.status !== 'completed' && ord.status !== 'cancelled';

                return (
                  <div
                    key={ord.id}
                    onClick={() => setActiveTrackOrderId(ord.id)}
                    className={`apple-glass rounded-2xl p-3.5 border transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400/60 bg-amber-400/10 shadow-lg'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="font-mono font-bold text-white text-xs">
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          ord.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isOngoing
                            ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 line-clamp-1 font-medium">
                      {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5 text-[10px] text-gray-400">
                      <span>{new Date(ord.createdAt).toLocaleTimeString('id-ID')}</span>
                      <span className="font-bold text-white">
                        Rp {ord.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Tracker Detail */}
          {selectedOrder && (
            <div className="lg:col-span-2 space-y-4">
              <div className="apple-glass rounded-3xl p-5 sm:p-6 border border-white/15 space-y-6">
                {/* Order Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        Pesanan #{selectedOrder.orderNumber}
                      </h2>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-amber-300 capitalize">
                        {selectedOrder.fulfillmentType === 'pickup' ? 'Ambil di Toko' : 'Kurir Antar'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Dibuat pada {new Date(selectedOrder.createdAt).toLocaleTimeString('id-ID')} • Metode: {selectedOrder.paymentMethod.toUpperCase()}
                    </p>
                  </div>

                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          selectedOrder.id,
                          'completed',
                          'Pesanan dikonfirmasi selesai oleh pelanggan.'
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi Diterima</span>
                    </button>
                  )}
                </div>

                {/* Stepper Visualization */}
                <div className="apple-glass rounded-2xl p-4 sm:p-5 border border-white/10">
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    {[
                      { key: 'confirmed', label: 'Dikonfirmasi', icon: <CheckCircle2 className="w-4 h-4" /> },
                      { key: 'cooking', label: 'Dimasak Dapur', icon: <ChefHat className="w-4 h-4" /> },
                      {
                        key: selectedOrder.fulfillmentType === 'delivery' ? 'delivering' : 'ready_for_pickup',
                        label: selectedOrder.fulfillmentType === 'delivery' ? 'Kurir Jalan' : 'Siap Diambil',
                        icon: selectedOrder.fulfillmentType === 'delivery' ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />,
                      },
                      { key: 'completed', label: 'Selesai', icon: <Sparkles className="w-4 h-4" /> },
                    ].map((step, idx) => {
                      const isCurrent = getStepIndex(selectedOrder.status) === idx + 1;
                      const isDone = getStepIndex(selectedOrder.status) > idx + 1;

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-amber-400 text-gray-950 ring-4 ring-amber-400/30 scale-105 shadow-md'
                                : isDone
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-800 text-gray-500 border border-white/10'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <span
                            className={`text-xs font-bold mt-2 ${
                              isCurrent ? 'text-amber-300' : isDone ? 'text-white' : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fulfillment Detail Box */}
                {selectedOrder.fulfillmentType === 'delivery' ? (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-gray-300 font-semibold">
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <Truck className="w-4 h-4" /> Pengantaran Kurir Instan
                      </span>
                      <span className="text-[10px] text-gray-400">Estimasi tiba: 20-30 mnt</span>
                    </div>
                    <p className="text-gray-300">
                      <span className="text-gray-400">Alamat:</span> {selectedOrder.deliveryAddress}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Store className="w-4 h-4" /> Pengambilan Mandiri di Gerai
                      </p>
                      <p className="text-gray-300 mt-1">
                        Tunjukkan nomor pesanan ke: <span className="font-bold text-white">{selectedOrder.pickupCounter || 'Counter A-03'}</span>
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded-lg">
                      <QrCode className="w-8 h-8 text-gray-950" />
                    </div>
                  </div>
                )}

                {/* Timeline Stream */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Log Pembaruan Status Real-Time
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.timeline.map((ev, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white capitalize">{ev.status.replace('_', ' ')}</span>
                            <span className="text-[10px] text-gray-500">{ev.timestamp}</span>
                          </div>
                          <p className="text-gray-400 text-[11px] mt-0.5">{ev.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items and Subtotal */}
                <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
                  <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
                    Rincian Tagihan
                  </h4>
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-gray-300">
                      <span>{it.quantity}x {it.product.name}</span>
                      <span>Rp {it.totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex justify-between font-extrabold text-sm text-white">
                    <span>Total Pembayaran</span>
                    <span className="text-amber-400">Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Quick Interactive Testing Controls */}
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Tes Transisi Status:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cooking')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-[11px]"
                    >
                      Dapur Masak
                    </button>
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          selectedOrder.id,
                          selectedOrder.fulfillmentType === 'delivery' ? 'delivering' : 'ready_for_pickup'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-[11px]"
                    >
                      {selectedOrder.fulfillmentType === 'delivery' ? 'Kurir Jalan' : 'Siap Ambil'}
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px]"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
