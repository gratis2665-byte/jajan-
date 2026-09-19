import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  Store,
  Sparkles,
  Receipt,
  QrCode,
  RotateCcw,
} from 'lucide-react';
import { OrderStatus } from '../types';

export const OrderTrackerView: React.FC = () => {
  const {
    orders,
    activeTrackOrderId,
    setActiveTrackOrderId,
    updateOrderStatus,
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F1A17] tracking-tight font-heading">
            Pelacakan Pesanan Real-Time
          </h1>
          <p className="text-xs text-[#736962] mt-1">
            Pantau status persiapan dapur, kurir antar, dan nomor counter pick-up secara langsung.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('menu')}
          className="px-4 py-2 rounded-full border border-[#EFE8DE] bg-white text-xs font-bold text-[#1F1A17] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition self-start cursor-pointer shadow-2xs"
        >
          <Store className="w-3.5 h-3.5 text-[#D81A3C]" />
          <span>Pesan Menu Lain</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE8DE] space-y-3 shadow-sm">
          <Clock className="w-12 h-12 text-[#A89C92] mx-auto" />
          <h3 className="text-base font-bold text-[#1F1A17] font-heading">Belum Ada Pesanan yang Dilacak</h3>
          <p className="text-xs text-[#736962] max-w-sm mx-auto">
            Silakan pilih menu jajan favorit Anda di menu utama dan selesaikan pembayaran untuk mulai melacak.
          </p>
          <button
            onClick={() => setActiveTab('menu')}
            className="px-5 py-2.5 rounded-full bg-[#D81A3C] text-white font-bold text-xs hover:bg-[#BF1231] transition shadow-xs cursor-pointer"
          >
            Buka Katalog Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order Selector / Orders List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#736962] uppercase tracking-wider">
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
                    className={`bg-white rounded-2xl p-4 border transition cursor-pointer ${
                      isSelected
                        ? 'border-[#D81A3C] ring-2 ring-[#D81A3C]/10 shadow-md'
                        : 'border-[#EFE8DE] hover:border-[#D1C7BA]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="font-mono font-bold text-[#1F1A17] text-xs">
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          ord.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOngoing
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#52311D] line-clamp-1 font-medium">
                      {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EFE8DE] text-[10px] text-[#736962]">
                      <span>{new Date(ord.createdAt).toLocaleTimeString('id-ID')}</span>
                      <span className="font-black text-[#1F1A17] text-xs">
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
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EFE8DE] shadow-sm space-y-6">
                {/* Order Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE8DE]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[#1F1A17] tracking-tight font-heading">
                        Pesanan #{selectedOrder.orderNumber}
                      </h2>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#FAF7F2] text-[#52311D] border border-[#EFE8DE] capitalize">
                        {selectedOrder.fulfillmentType === 'pickup' ? 'Ambil di Toko' : 'Kurir Antar'}
                      </span>
                    </div>
                    <p className="text-xs text-[#736962] mt-0.5">
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
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi Diterima</span>
                    </button>
                  )}
                </div>

                {/* Stepper Visualization */}
                <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#EFE8DE]">
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
                                ? 'bg-[#D81A3C] text-white ring-4 ring-red-100 scale-105 shadow-xs'
                                : isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-[#A89C92] border border-[#EFE8DE]'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <span
                            className={`text-xs font-bold mt-2 font-heading ${
                              isCurrent ? 'text-[#D81A3C]' : isDone ? 'text-[#1F1A17]' : 'text-[#A89C92]'
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
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DE] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#52311D] font-bold">
                      <span className="flex items-center gap-1.5 text-[#D81A3C]">
                        <Truck className="w-4 h-4" /> Pengantaran Kurir Instan
                      </span>
                      <span className="text-[10px] text-[#736962] font-normal">Estimasi: 20-30 mnt</span>
                    </div>
                    <p className="text-[#52311D]">
                      <span className="text-[#736962]">Alamat:</span> {selectedOrder.deliveryAddress}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DE] flex items-center justify-between text-xs">
                    <div>
                      <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-emerald-600" /> Pengambilan Mandiri di Gerai
                      </p>
                      <p className="text-[#52311D] mt-1">
                        Tunjukkan nomor pesanan ke: <span className="font-bold text-[#1F1A17]">{selectedOrder.pickupCounter || 'Counter A-03'}</span>
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-[#EFE8DE]">
                      <QrCode className="w-8 h-8 text-[#1F1A17]" />
                    </div>
                  </div>
                )}

                {/* Timeline Stream */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#736962] uppercase tracking-wider">
                    Log Pembaruan Status Real-Time
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.timeline.map((ev, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE8DE] text-xs flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#D81A3C] mt-1 shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#1F1A17] capitalize">{ev.status.replace('_', ' ')}</span>
                            <span className="text-[10px] text-[#A89C92]">{ev.timestamp}</span>
                          </div>
                          <p className="text-[#736962] text-[11px] mt-0.5">{ev.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items and Subtotal */}
                <div className="pt-2 border-t border-[#EFE8DE] space-y-2 text-xs">
                  <h4 className="font-bold text-[#736962] uppercase tracking-wider text-[11px]">
                    Rincian Tagihan
                  </h4>
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-[#52311D]">
                      <span>{it.quantity}x {it.product.name}</span>
                      <span className="font-semibold text-[#1F1A17]">Rp {it.totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#EFE8DE] flex justify-between font-black text-sm text-[#1F1A17] font-heading">
                    <span>Total Pembayaran</span>
                    <span className="text-[#D81A3C] text-base">Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Quick Interactive Testing Controls */}
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DE] text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-[#736962] uppercase tracking-wider flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Tes Transisi Status:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cooking')}
                      className="px-3 py-1 rounded-full bg-white hover:bg-[#F3ECE1] text-[#1F1A17] border border-[#EFE8DE] text-[11px] font-medium cursor-pointer"
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
                      className="px-3 py-1 rounded-full bg-white hover:bg-[#F3ECE1] text-[#1F1A17] border border-[#EFE8DE] text-[11px] font-medium cursor-pointer"
                    >
                      {selectedOrder.fulfillmentType === 'delivery' ? 'Kurir Jalan' : 'Siap Ambil'}
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold cursor-pointer"
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
