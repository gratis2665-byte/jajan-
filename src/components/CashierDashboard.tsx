import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  Truck,
  Store,
  Printer,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  TrendingUp,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus, Product, CartItem, SelectedOption } from '../types';
import { playTapSound, playPaymentSuccessSound, playNotificationSound } from '../services/soundEffects';

export const CashierDashboard: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    confirmOrderPayment,
    currentUser,
    products,
    createOrder,
    pushNotification,
    qrisSettings,
  } = useApp();

  // Mode: 'pos' (Direct Point of Sales) | 'live_orders' (Kitchen & Pickup Management) | 'history' (Shift Transactions)
  const [cashierSubTab, setCashierSubTab] = useState<'pos' | 'live_orders' | 'history'>('pos');

  // POS State
  const [posCart, setPosCart] = useState<
    Array<{
      product: Product;
      quantity: number;
      selectedOptions: SelectedOption[];
      notes?: string;
    }>
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [productSearch, setProductSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerTable, setCustomerTable] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Live Orders State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cooking' | 'ready'>('all');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');

  // Filtered Products for POS
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch && p.isAvailable;
    });
  }, [products, selectedCategory, productSearch]);

  // Cart calculations
  const posSubtotal = posCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const posTaxAndService = 2000;
  const posTotal = posSubtotal > 0 ? posSubtotal + posTaxAndService : 0;
  const numericCashGiven = parseFloat(cashGiven.replace(/[^0-9]/g, '')) || 0;
  const changeAmount = numericCashGiven >= posTotal ? numericCashGiven - posTotal : 0;

  // Add item to POS cart
  const addToPosCart = (product: Product) => {
    playTapSound();
    setPosCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }
      return [...prev, { product, quantity: 1, selectedOptions: [] }];
    });
  };

  const updatePosQuantity = (index: number, delta: number) => {
    playTapSound();
    setPosCart((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  const clearPosCart = () => {
    setPosCart([]);
    setCustomerName('');
    setCustomerTable('');
    setCashGiven('');
  };

  // Submit POS Order
  const handleCheckoutPOS = () => {
    if (posCart.length === 0) return;
    if (paymentMethod === 'cash' && numericCashGiven < posTotal) {
      alert(`Uang tunai kurang! Total tagihan: Rp ${posTotal.toLocaleString('id-ID')}`);
      return;
    }

    const orderPayload: Partial<Order> = {
      customerName: customerName.trim() || `Tamu Meja ${customerTable || 'Kasir'}`,
      fulfillmentType,
      pickupCounter: customerTable ? `Meja ${customerTable}` : 'Ambil di Kasir',
      paymentMethod,
      paymentStatus: 'paid',
      status: 'cooking', // Langsung masuk antrean dapur
    };

    // Format cart items
    const formattedCart: CartItem[] = posCart.map((item, idx) => ({
      id: `pos-item-${Date.now()}-${idx}`,
      productId: item.product.id,
      product: item.product,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
      unitPrice: item.product.price,
      totalPrice: item.product.price * item.quantity,
    }));

    const created = createOrder({
      ...orderPayload,
      items: formattedCart,
      subtotal: posSubtotal,
      total: posTotal,
      serviceFee: posTaxAndService,
    });

    confirmOrderPayment(created.id);
    playPaymentSuccessSound();

    pushNotification({
      title: 'Pesanan POS Masuk Dapur',
      message: `Pesanan #${created.orderNumber} berhasil dicatat kasir & lunas.`,
      type: 'order_status',
      orderId: created.id,
    });

    setReceiptOrder(created);
    clearPosCart();
  };

  // Live Orders Filtering
  const liveOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchOrderQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchOrderQuery.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === 'pending') return o.paymentStatus === 'unpaid' || o.status === 'pending_payment';
      if (statusFilter === 'cooking') return o.status === 'cooking' || o.status === 'confirmed';
      if (statusFilter === 'ready') return o.status === 'ready_for_pickup' || o.status === 'delivering';
      return o.status !== 'completed' && o.status !== 'cancelled';
    });
  }, [orders, statusFilter, searchOrderQuery]);

  // Today stats for cashier
  const todayPaidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5 text-left">
      {/* Top Header Bar Kasir */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 apple-glass rounded-3xl p-4 sm:p-5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-gray-950 flex items-center justify-center font-black shadow-lg">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Mesin Kasir &amp; Dapur (POS)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Kasir Aktif: {currentUser.name}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Input pesanan langsung, cetak struk bayar, dan pantau antrean masak dapur secara real-time.
            </p>
          </div>
        </div>

        {/* Quick Shift Counter */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-xs">
          <div>
            <span className="text-gray-400 text-[10px] block font-medium">Omzet Shift Kasir</span>
            <span className="text-amber-400 font-extrabold text-sm">
              Rp {todayRevenue.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="h-6 w-px bg-white/10 mx-1" />
          <div>
            <span className="text-gray-400 text-[10px] block font-medium">Total Transaksi</span>
            <span className="text-white font-extrabold text-sm">{todayPaidOrders.length} Lunas</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Kasir */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setCashierSubTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            cashierSubTab === 'pos'
              ? 'bg-amber-400 text-gray-950 shadow-md'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Point of Sales (Input Pesanan)</span>
        </button>

        <button
          onClick={() => setCashierSubTab('live_orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
            cashierSubTab === 'live_orders'
              ? 'bg-amber-400 text-gray-950 shadow-md'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Antrean Dapur &amp; Ambil Pesanan</span>
          {liveOrders.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {liveOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCashierSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            cashierSubTab === 'history'
              ? 'bg-amber-400 text-gray-950 shadow-md'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Riwayat Struk &amp; Transaksi Shift</span>
        </button>
      </div>

      {/* TAB 1: POINT OF SALES (KASIR CEPAT) */}
      {cashierSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Kolom Kiri: Menu Grid (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Category & Search */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['semua', 'makanan', 'minuman', 'snack'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-gray-950 font-bold'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari menu kasir..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToPosCart(product)}
                  className="apple-glass rounded-2xl p-2.5 border border-white/10 hover:border-amber-400/50 flex flex-col text-left transition active:scale-95 group cursor-pointer"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/30 mb-2 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-bold">
                      Stok: {product.stock}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-white line-clamp-1 group-hover:text-amber-300 transition">
                    {product.name}
                  </h3>
                  <span className="text-amber-400 font-extrabold text-xs mt-0.5">
                    Rp {product.price.toLocaleString('id-ID')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Kolom Kanan: Keranjang & Billing POS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="apple-glass rounded-3xl p-5 border border-white/15 space-y-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <h3 className="font-extrabold text-sm text-white">Struk Pesanan Pelanggan</h3>
                  </div>
                  {posCart.length > 0 && (
                    <button
                      onClick={clearPosCart}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Batal / Reset
                    </button>
                  )}
                </div>

                {/* Input Tamu / Meja */}
                <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold block mb-1">
                      Nama Pelanggan / Tamu
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bpk. Budi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold block mb-1">
                      No. Meja / Counter
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Meja 05"
                      value={customerTable}
                      onChange={(e) => setCustomerTable(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 border-y border-white/10 py-3">
                  {posCart.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-xs">
                      Pilih menu di sebelah kiri untuk menambah ke kasir.
                    </div>
                  ) : (
                    posCart.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="flex-1 truncate">
                          <h4 className="text-xs font-bold text-white truncate">{item.product.name}</h4>
                          <span className="text-[11px] text-amber-400 font-semibold">
                            Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Quantity Buttons */}
                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                          <button
                            onClick={() => updatePosQuantity(index, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white font-bold"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updatePosQuantity(index, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-amber-400 hover:text-amber-300 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Ringkasan Biaya */}
                <div className="pt-3 space-y-1.5 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal Makanan:</span>
                    <span>Rp {posSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pajak &amp; Layanan:</span>
                    <span>Rp {posTaxAndService.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10 font-extrabold text-sm">
                    <span className="text-white">Total Tagihan:</span>
                    <span className="text-amber-400 text-base">
                      Rp {posTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Metode Pembayaran Kasir */}
                <div className="pt-3 space-y-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Uang Tunai (Cash)</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('qris')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                        paymentMethod === 'qris'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QRIS Merchant</span>
                    </button>
                  </div>

                  {/* Cash Input & Kembalian */}
                  {paymentMethod === 'cash' && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-gray-300 font-medium">Uang Diterima:</label>
                        <input
                          type="number"
                          placeholder="Rp..."
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          className="w-36 px-2.5 py-1 rounded-lg bg-white/5 border border-white/15 text-right font-bold text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex items-center justify-between text-gray-300 pt-1 border-t border-white/10">
                        <span>Kembalian:</span>
                        <span className="font-extrabold text-emerald-400">
                          Rp {changeAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'qris' && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs space-y-1">
                      <span className="font-bold text-rose-300">
                        Scan QRIS {qrisSettings.merchantName}
                      </span>
                      <p className="text-[10px] text-gray-400">
                        Tunjukkan QRIS merchant kepada pembeli lalu tekan Cetak &amp; Lunas.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Bayar & Selesai */}
              <button
                disabled={posCart.length === 0}
                onClick={handleCheckoutPOS}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-gray-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 mt-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Bayar Lunas &amp; Kirim ke Dapur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANTREAN DAPUR & STATUS PESANAN (KITCHEN DISPATCH) */}
      {cashierSubTab === 'live_orders' && (
        <div className="space-y-4">
          {/* Quick Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 apple-glass rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'Semua Aktif' },
                { id: 'cooking', label: 'Sedang Dimasak' },
                { id: 'ready', label: 'Siap Diambil / Diantar' },
                { id: 'pending', label: 'Belum Bayar' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-amber-400 text-gray-950 shadow'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari ID Pesanan / Tamu..."
                value={searchOrderQuery}
                onChange={(e) => setSearchOrderQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Cards Antrean Dapur */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveOrders.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-400 text-xs apple-glass rounded-3xl">
                Tidak ada pesanan dapur yang menunggu diproses.
              </div>
            ) : (
              liveOrders.map((order) => (
                <div
                  key={order.id}
                  className="apple-glass rounded-3xl p-4 border border-white/15 flex flex-col justify-between space-y-3 relative"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <span className="font-mono font-extrabold text-white text-base">
                          #{order.orderNumber}
                        </span>
                        <p className="text-[11px] text-gray-300 font-semibold">
                          {order.customerName} • {order.pickupCounter || 'Kasir'}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                          order.status === 'cooking'
                            ? 'bg-amber-500/20 text-amber-300 animate-pulse border border-amber-500/30'
                            : order.status === 'ready_for_pickup'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}
                      >
                        {order.status === 'cooking' ? 'Sedang Dimasak' : order.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1.5 my-3 max-h-40 overflow-y-auto pr-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="text-xs flex justify-between text-gray-200">
                          <span className="font-medium">
                            <strong className="text-amber-400 mr-1.5">{item.quantity}x</strong>
                            {item.product.name}
                          </span>
                          <span className="text-gray-400">Rp {item.totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryAddress && (
                      <p className="text-[10px] text-gray-400 italic">Antar ke: {order.deliveryAddress}</p>
                    )}
                  </div>

                  {/* Actions Kasir / Dapur */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Tagihan:</span>
                      <span className="text-sm font-extrabold text-amber-400">
                        Rp {order.total.toLocaleString('id-ID')} ({order.paymentMethod.toUpperCase()})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {order.paymentStatus === 'unpaid' && (
                        <button
                          onClick={() => confirmOrderPayment(order.id)}
                          className="col-span-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Terima Pembayaran Lunas
                        </button>
                      )}

                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cooking')}
                          className="col-span-2 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                        >
                          <ChefHat className="w-4 h-4" />
                          <span>Mulai Masak di Dapur</span>
                        </button>
                      )}

                      {order.status === 'cooking' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')}
                          className="col-span-2 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-gray-950 font-bold text-xs transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selesai Dimasak &amp; Siap Diambil</span>
                        </button>
                      )}

                      {order.status === 'ready_for_pickup' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="col-span-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Tandai Selesai / Diserahkan
                        </button>
                      )}

                      {/* Print Struk Button */}
                      <button
                        onClick={() => setReceiptOrder(order)}
                        className="col-span-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-gray-400" />
                        <span>Cetak Struk Transaksi</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT SHIFT & TRANSAKSI KASIR */}
      {cashierSubTab === 'history' && (
        <div className="apple-glass rounded-3xl p-5 border border-white/15 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-white">Rekap Transaksi Kasir</h3>
              <p className="text-xs text-gray-400">Daftar transaksi yang sudah diselesaikan dan dibayar.</p>
            </div>
            <span className="text-xs font-bold text-amber-400">
              {todayPaidOrders.length} Transaksi Terverifikasi
            </span>
          </div>

          <div className="divide-y divide-white/10 max-h-[500px] overflow-y-auto">
            {todayPaidOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">#{order.orderNumber}</span>
                    <span className="text-gray-300 font-medium">{order.customerName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      {order.paymentMethod.toUpperCase()} LUNAS
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString('id-ID')} •{' '}
                    {order.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-white">
                    Rp {order.total.toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => setReceiptOrder(order)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                    title="Cetak Struk"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL STRUK CETAK THERMAL KASIR */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white text-gray-950 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 font-mono text-xs">
            {/* Struk Header */}
            <div className="text-center border-b border-dashed border-gray-300 pb-3">
              <h3 className="font-black text-base uppercase tracking-tight text-gray-900">
                {qrisSettings.merchantName || 'JAJAN NUSANTARA RESTO'}
              </h3>
              <p className="text-[10px] text-gray-500">{qrisSettings.city || 'JAKARTA SELATAN'}</p>
              <p className="text-[10px] text-gray-500">NMID: {qrisSettings.nmid}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(receiptOrder.createdAt).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Info Order */}
            <div className="flex justify-between text-[11px] border-b border-dashed border-gray-300 pb-2">
              <span>No: #{receiptOrder.orderNumber}</span>
              <span>Kasir: {currentUser.name}</span>
            </div>

            {/* Items */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {receiptOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {it.quantity}x {it.product.name}
                  </span>
                  <span>Rp {it.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            {/* Subtotal & Total */}
            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>Rp {receiptOrder.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan:</span>
                <span>Rp {receiptOrder.serviceFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-200">
                <span>TOTAL:</span>
                <span>Rp {receiptOrder.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1">
                <span>Metode:</span>
                <span className="uppercase font-bold">{receiptOrder.paymentMethod} (LUNAS)</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[10px] text-gray-500 border-t border-dashed border-gray-300">
              <p>Terima kasih atas pesanan Anda!</p>
              <p>Selamat Menikmati Hidangan Lezat.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-800 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Thermal</span>
              </button>
              <button
                onClick={() => setReceiptOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
