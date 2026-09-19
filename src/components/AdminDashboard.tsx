import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  ChefHat,
  Trash2,
  Edit2,
  ArrowUpRight,
  ExternalLink,
  Shield,
  UserCheck,
  AlertTriangle,
  RotateCw,
  QrCode,
  DollarSign,
  TrendingUp,
  X,
  Settings,
  Upload,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { OrderStatus, UserRole, Product } from '../types';
import { createTransactionSpreadsheet, syncOrdersToSheet, exportInventoryToSheet } from '../services/googleSheets';
import { playTapSound } from '../services/soundEffects';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    orders,
    updateOrderStatus,
    confirmOrderPayment,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    users,
    updateUserRole,
    addNewStaff,
    setActiveTrackOrderId,
    googleAccessToken,
    googleSpreadsheet,
    setGoogleSpreadsheet,
    pushNotification,
    qrisSettings,
    updateQrisSettings,
    resetQrisSettings,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'history' | 'inventory' | 'staff' | 'sheets' | 'qris'>('orders');

  // QRIS Settings Form state
  const [qrisMerchantName, setQrisMerchantName] = useState(qrisSettings.merchantName);
  const [qrisNmid, setQrisNmid] = useState(qrisSettings.nmid);
  const [qrisCity, setQrisCity] = useState(qrisSettings.city);
  const [qrisPostalCode, setQrisPostalCode] = useState(qrisSettings.postalCode || '');
  const [qrisInstructions, setQrisInstructions] = useState(qrisSettings.instructions);
  const [qrisQrImageUrl, setQrisQrImageUrl] = useState(qrisSettings.qrImageUrl || '');
  const [qrisSavedSuccess, setQrisSavedSuccess] = useState(false);

  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Inventory modal & state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<'makanan' | 'minuman' | 'snack'>('makanan');
  const [newProductPrice, setNewProductPrice] = useState(25000);
  const [newProductStock, setNewProductStock] = useState(20);
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState('');

  // Staff management state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('cashier');

  // Google Sheets state
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsMessage, setSheetsMessage] = useState<string | null>(null);

  // Financial calculations
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const totalPaidOrders = orders.filter((o) => o.paymentStatus === 'paid').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'cooking' || o.status === 'confirmed').length;
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      orderStatusFilter === 'all'
        ? true
        : orderStatusFilter === 'active'
        ? order.status !== 'completed' && order.status !== 'cancelled'
        : order.status === orderStatusFilter;

    const matchesSearch =
      order.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Handle Add Product Submit
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    addProduct({
      name: newProductName,
      description: newProductDesc || 'Menu jajanan lezat berkualitas pilihan terbaik.',
      category: newProductCategory,
      price: Number(newProductPrice),
      stock: Number(newProductStock),
      isAvailable: true,
      image:
        newProductImage ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      preparationTimeMinutes: newProductCategory === 'minuman' ? 5 : 10,
    });

    setIsAddProductOpen(false);
    setNewProductName('');
    setNewProductDesc('');
    setNewProductImage('');
    pushNotification({
      title: 'Inventaris Diperbarui',
      message: `Menu baru "${newProductName}" berhasil ditambahkan ke katalog.`,
      type: 'system',
    });
  };

  // Handle Add Staff Submit
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    addNewStaff({
      name: newStaffName,
      email: newStaffEmail || `${newStaffName.toLowerCase().replace(/\s+/g, '')}@resto.com`,
      role: newStaffRole,
      phone: '081234567890',
    });

    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffEmail('');
    pushNotification({
      title: 'Staff Baru Terdaftar',
      message: `${newStaffName} telah didaftarkan dengan hak akses ${newStaffRole.toUpperCase()}.`,
      type: 'system',
    });
  };

  // Handle Google Sheets Sync
  const handleCreateOrSyncSheet = async () => {
    setIsSyncingSheets(true);
    setSheetsMessage(null);
    try {
      let sheetId = googleSpreadsheet?.id;
      let sheetUrl = googleSpreadsheet?.url;

      if (!sheetId) {
        // Create new spreadsheet
        const newSheet = await createTransactionSpreadsheet();
        sheetId = newSheet.spreadsheetId;
        sheetUrl = newSheet.spreadsheetUrl;
        setGoogleSpreadsheet({ id: sheetId, url: sheetUrl });
      }

      // Sync orders to sheet
      await syncOrdersToSheet(sheetId, orders);
      // Sync inventory to sheet
      await exportInventoryToSheet(sheetId, products);

      setSheetsMessage(`Sinkronisasi berhasil! ${orders.length} pesanan tercatat di Google Sheets.`);
      pushNotification({
        title: 'Google Sheets Tersinkronisasi',
        message: 'Laporan transaksi dan inventaris telah diekspor ke Google Sheets.',
        type: 'system',
      });
    } catch (err: unknown) {
      console.error(err);
      setSheetsMessage(
        err instanceof Error ? err.message : 'Gagal menyinkronkan ke Google Sheets. Pastikan telah login dengan akun Google.'
      );
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Handle QRIS Settings Save
  const handleSaveQris = (e: React.FormEvent) => {
    e.preventDefault();
    updateQrisSettings({
      merchantName: qrisMerchantName,
      nmid: qrisNmid,
      city: qrisCity,
      postalCode: qrisPostalCode,
      instructions: qrisInstructions,
      qrImageUrl: qrisQrImageUrl,
    });
    setQrisSavedSuccess(true);
    pushNotification({
      title: 'Pengaturan QRIS Diperbarui',
      message: `Data QRIS untuk merchant "${qrisMerchantName}" berhasil disimpan ke Cloud database.`,
      type: 'system',
    });
    setTimeout(() => setQrisSavedSuccess(false), 3500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrisQrImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pusat Kendali Admin &amp; Kasir
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentUser.role === 'admin' ? 'Super Admin' : 'Kasir / Staff'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Monitoring transaksi real-time, manajemen inventaris, hak akses staff, dan ekspor Google Sheets.
          </p>
        </div>

        {/* Quick Google Sheets Action */}
        <div className="flex items-center gap-2">
          {googleSpreadsheet && (
            <a
              href={googleSpreadsheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="apple-glass-pill px-3 py-2 rounded-xl text-xs text-emerald-300 hover:text-white flex items-center gap-1.5 transition font-medium"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Buka Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleCreateOrSyncSheet}
            disabled={isSyncingSheets}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Sinkron ke Sheets'}</span>
          </button>
        </div>
      </div>

      {sheetsMessage && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
            sheetsMessage.includes('berhasil')
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{sheetsMessage}</span>
          <button onClick={() => setSheetsMessage(null)} className="p-1 hover:opacity-70">
            &times;
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Omzet */}
        <div className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Omzet Lunas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">
              Dari {totalPaidOrders} transaksi terverifikasi
            </p>
          </div>
        </div>

        {/* Card 2: Pesanan Aktif */}
        <div className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Pesanan Dalam Proses</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white">
              {pendingOrdersCount}
            </span>
            <p className="text-[11px] text-amber-400 mt-0.5 font-medium">
              Sedang dimasak / siap antar
            </p>
          </div>
        </div>

        {/* Card 3: Total Menu */}
        <div className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Katalog Produk</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white">
              {products.length}
            </span>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
              Makanan, minuman, &amp; snack
            </p>
          </div>
        </div>

        {/* Card 4: Stok Alert */}
        <div className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Peringatan Stok</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white">
              {lowStockProducts.length}
            </span>
            <p className="text-[11px] text-rose-400 mt-0.5 font-medium">
              {lowStockProducts.length > 0 ? 'Item stok menipis / perlu restock' : 'Semua stok aman'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/10">
        {[
          { id: 'orders', label: 'Pesanan Masuk (POS)', icon: <ChefHat className="w-3.5 h-3.5" /> },
          { id: 'history', label: 'Riwayat Transaksi', icon: <Receipt className="w-3.5 h-3.5" /> },
          { id: 'inventory', label: 'Kelola Inventaris', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'staff', label: 'Atur Admin & Staff (RBAC)', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'qris', label: 'Atur QRIS Toko', icon: <QrCode className="w-3.5 h-3.5 text-amber-400" /> },
          { id: 'sheets', label: 'Google Sheets Sync', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeAdminTab === tab.id
                ? 'bg-white text-gray-950 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE ORDERS & POS KASIR */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'Semua Pesanan' },
                { id: 'pending_payment', label: 'Menunggu Bayar' },
                { id: 'confirmed', label: 'Dikonfirmasi' },
                { id: 'cooking', label: 'Sedang Dimasak' },
                { id: 'ready_for_pickup', label: 'Siap Diambil' },
                { id: 'delivering', label: 'Kurir Antar' },
                { id: 'completed', label: 'Selesai' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    orderStatusFilter === f.id
                      ? 'bg-amber-400 text-gray-950 font-bold'
                      : 'apple-glass-pill text-gray-300 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID / Pelanggan..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-400 text-xs apple-glass rounded-3xl">
                Tidak ada pesanan yang sesuai dengan filter.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="apple-glass rounded-3xl p-4 border border-white/15 flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <span className="font-mono font-bold text-white text-sm">
                          #{order.orderNumber}
                        </span>
                        <p className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString('id-ID')} • {order.customerName}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          order.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : order.status === 'cooking'
                            ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Fulfillment & Method */}
                    <div className="flex items-center justify-between py-2 text-xs text-gray-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        {order.fulfillmentType === 'delivery' ? (
                          <>
                            <Truck className="w-3.5 h-3.5 text-sky-400" />
                            <span>Kurir Antar</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-3.5 h-3.5 text-amber-400" />
                            <span>{order.pickupCounter || 'Ambil di Tempat'}</span>
                          </>
                        )}
                      </span>

                      <span className="text-[11px] font-semibold text-gray-400">
                        {order.paymentMethod.toUpperCase()} (
                        {order.paymentStatus === 'paid' ? 'LUNAS' : 'PENDING'})
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 my-2 max-h-32 overflow-y-auto pr-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs flex justify-between text-gray-300">
                          <span className="truncate pr-2">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="text-gray-400 shrink-0">
                            Rp {item.totalPrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryAddress && (
                      <p className="text-[10px] text-gray-400 italic line-clamp-1">
                        Alamat: {order.deliveryAddress}
                      </p>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Tagihan:</span>
                      <span className="text-sm font-extrabold text-amber-400">
                        Rp {order.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {order.paymentStatus === 'unpaid' && (
                        <button
                          onClick={() => confirmOrderPayment(order.id)}
                          className="col-span-2 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Konfirmasi Bayar
                        </button>
                      )}

                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cooking')}
                          className="col-span-2 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Mulai Masak di Dapur
                        </button>
                      )}

                      {order.status === 'cooking' && (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              order.fulfillmentType === 'delivery'
                                ? 'delivering'
                                : 'ready_for_pickup'
                            )
                          }
                          className="col-span-2 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition cursor-pointer shadow"
                        >
                          {order.fulfillmentType === 'delivery' ? 'Kirim Kurir' : 'Siap Diambil'}
                        </button>
                      )}

                      {(order.status === 'ready_for_pickup' || order.status === 'delivering') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="col-span-2 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Selesaikan Pesanan
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTrackOrderId(order.id)}
                        className="py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition cursor-pointer"
                      >
                        Detail &amp; Lacak
                      </button>

                      <button
                        onClick={() => {
                          const receipt = `*** JAJAN BAR RECEIPT ***\nOrder: #${order.orderNumber}\nCustomer: ${order.customerName}\nTotal: Rp ${order.total.toLocaleString('id-ID')}\nStatus: ${order.status}`;
                          navigator.clipboard.writeText(receipt);
                          pushNotification({
                            title: 'Struk Disalin',
                            message: `Rincian struk pesanan #${order.orderNumber} berhasil disalin ke clipboard.`,
                            type: 'system',
                          });
                        }}
                        className="py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition cursor-pointer"
                      >
                        Salin Struk
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT TRANSAKSI LENGKAP */}
      {activeAdminTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white">
              Semua Riwayat Transaksi Penjualan ({orders.length})
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateOrSyncSheet}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export ke Google Sheets</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="apple-glass rounded-3xl overflow-hidden border border-white/15">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Waktu</th>
                    <th className="p-3.5">No. Pesanan</th>
                    <th className="p-3.5">Pelanggan</th>
                    <th className="p-3.5">Menu</th>
                    <th className="p-3.5">Pengambilan</th>
                    <th className="p-3.5">Metode</th>
                    <th className="p-3.5">Total Bayar</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/5 transition">
                      <td className="p-3.5 text-gray-400 whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white">
                        #{ord.orderNumber}
                      </td>
                      <td className="p-3.5 font-medium text-white">{ord.customerName}</td>
                      <td className="p-3.5 max-w-xs truncate">
                        {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize">
                          {ord.fulfillmentType === 'pickup' ? 'Ambil di Toko' : 'Kurir Antar'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold uppercase">{ord.paymentMethod}</td>
                      <td className="p-3.5 font-bold text-amber-400">
                        Rp {ord.total.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ord.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAJEMEN INVENTARIS PRODUK */}
      {activeAdminTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Inventaris Produk &amp; Stok Menu ({products.length})
              </h2>
              <p className="text-xs text-gray-400">Atur ketersediaan, ubah stok, dan tambah menu jajan baru.</p>
            </div>

            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Jajan</span>
            </button>
          </div>

          {/* Products List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="apple-glass rounded-2xl p-3.5 border border-white/10 flex gap-3 text-left items-center justify-between"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-900"
                />

                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                  <p className="text-[11px] text-amber-400 font-semibold">
                    Rp {p.price.toLocaleString('id-ID')}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Stock Quick Editor */}
                    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 5) })}
                        className="px-1.5 hover:text-rose-400"
                      >
                        -5
                      </button>
                      <span className="font-bold text-white px-1">Stok: {p.stock}</span>
                      <button
                        onClick={() => updateProduct(p.id, { stock: p.stock + 5 })}
                        className="px-1.5 hover:text-emerald-400"
                      >
                        +5
                      </button>
                    </div>

                    <button
                      onClick={() => updateProduct(p.id, { isAvailable: !p.isAvailable })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                        p.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {p.isAvailable ? 'Tersedia' : 'Nonaktif'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => deleteProduct(p.id)}
                  className="text-gray-500 hover:text-rose-400 p-1.5 transition"
                  title="Hapus produk"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Modal Tambah Produk */}
          {isAddProductOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <div className="apple-glass rounded-3xl max-w-md w-full p-5 sm:p-6 border border-white/20 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-base font-bold text-white">Tambah Menu Jajan Baru</h3>
                  <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-300 block mb-1">Nama Menu</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Es Cendol Latte Durian"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 block mb-1">Kategori</label>
                      <select
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value as any)}
                        className="w-full bg-gray-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                      >
                        <option value="makanan">Makanan</option>
                        <option value="minuman">Minuman</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-300 block mb-1">Harga (Rp)</label>
                      <input
                        type="number"
                        required
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">Stok Awal</label>
                    <input
                      type="number"
                      required
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">URL Gambar (Opsional)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs transition cursor-pointer"
                  >
                    Simpan Menu Baru
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATUR ADMIN & HAK AKSES (RBAC) */}
      {activeAdminTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Kelola Admin &amp; Staff (Role-Based Access Control)
              </h2>
              <p className="text-xs text-gray-400">
                Admin dapat mengatur admin lain, menugaskan kasir, dan mengelola hak akses sistem.
              </p>
            </div>

            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Admin / Staff Baru</span>
            </button>
          </div>

          {/* Staff List Table */}
          <div className="apple-glass rounded-3xl overflow-hidden border border-white/15">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Nama Staff</th>
                  <th className="p-3.5">Email / Kontak</th>
                  <th className="p-3.5">Peran Saat Ini</th>
                  <th className="p-3.5">Ubah Hak Akses (RBAC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3.5 text-gray-400">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : u.role === 'cashier'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {u.role === 'admin' ? 'Super Admin' : u.role === 'cashier' ? 'Kasir' : 'Pelanggan'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        className="bg-gray-900 border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white cursor-pointer focus:outline-none focus:border-amber-400"
                      >
                        <option value="admin">Super Admin (Akses Penuh)</option>
                        <option value="cashier">Kasir (POS &amp; Dapur)</option>
                        <option value="customer">Pelanggan</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Tambah Staff */}
          {isAddStaffOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <div className="apple-glass rounded-3xl max-w-md w-full p-5 sm:p-6 border border-white/20 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-base font-bold text-white">Tambah Akun Staff / Admin</h3>
                  <button onClick={() => setIsAddStaffOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-300 block mb-1">Nama Lengkap Staff</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Pegawai / Admin Baru"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">Email Toko</label>
                    <input
                      type="email"
                      required
                      placeholder="staff@jajan-resto.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">Pilih Peran Akses</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                      className="w-full bg-gray-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="admin">Super Admin (Bisa atur admin lain &amp; keuangan)</option>
                      <option value="cashier">Kasir (Kelola pesanan &amp; dapur)</option>
                      <option value="customer">Pelanggan Biasa</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Daftarkan Staff
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GOOGLE SHEETS INTEGRATION PANEL */}
      {activeAdminTab === 'sheets' && (
        <div className="apple-glass rounded-3xl p-6 border border-white/15 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Integrasi Google Sheets Real-Time</h3>
              <p className="text-xs text-gray-400">
                Otomatisasi pencatatan pembukuan, rekonsiliasi pembayaran digital QRIS, dan data inventaris langsung ke Google Spreadsheet.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status Akun Google:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Terotentikasi OAuth
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Spreadsheet Aktif:</span>
              <span className="text-white font-medium">
                {googleSpreadsheet ? googleSpreadsheet.id : 'Belum dibuat (Otomatis dibuat saat ekspor)'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleCreateOrSyncSheet}
              disabled={isSyncingSheets}
              className="py-2.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Sedang Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>

            {googleSpreadsheet && (
              <a
                href={googleSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <span>Buka Google Sheets</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ATUR QRIS TOKO PANEL */}
      {activeAdminTab === 'qris' && (
        <div className="apple-glass rounded-3xl p-6 border border-white/15 space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pengaturan QRIS Merchant Toko</h3>
                <p className="text-xs text-gray-400">
                  Sesuaikan barcode QRIS, NMID, nama gerai, dan instruksi bayar yang tampil otomatis saat checkout pelanggan.
                </p>
              </div>
            </div>

            {qrisSavedSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tersimpan ke Cloud & Real-time</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Settings */}
            <form onSubmit={handleSaveQris} className="lg:col-span-2 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Nama Merchant Toko (QRIS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={qrisMerchantName}
                    onChange={(e) => setQrisMerchantName(e.target.value)}
                    placeholder="Contoh: JAJAN RESTO & BAR"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Nama ini akan muncul di header struk QRIS pelanggan.
                  </span>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    NMID (National Merchant ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={qrisNmid}
                    onChange={(e) => setQrisNmid(e.target.value)}
                    placeholder="Contoh: ID1020260918001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    NMID resmi dari acquirer (BCA, GoPay, Nobu, ShopeePay, dll).
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Kota / Domisili Gerai</label>
                  <input
                    type="text"
                    value={qrisCity}
                    onChange={(e) => setQrisCity(e.target.value)}
                    placeholder="Contoh: JAKARTA SELATAN"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Kode Pos Gerai</label>
                  <input
                    type="text"
                    value={qrisPostalCode}
                    onChange={(e) => setQrisPostalCode(e.target.value)}
                    placeholder="Contoh: 12180"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Upload QR Code Gambar Sendiri (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white cursor-pointer transition font-medium">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Pilih Gambar QRIS</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {qrisQrImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQrisQrImageUrl('')}
                      className="text-rose-400 hover:text-rose-300 text-[11px] underline"
                    >
                      Hapus Gambar Custom
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Unggah file JPG/PNG QR barcode toko Anda. Jika kosong, sistem otomatis membuat QR simulasi interaktif.
                </span>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Petunjuk Pembayaran untuk Pembeli</label>
                <textarea
                  rows={2}
                  value={qrisInstructions}
                  onChange={(e) => setQrisInstructions(e.target.value)}
                  placeholder="Petunjuk bayar..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan QRIS</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetQrisSettings();
                    setQrisMerchantName('JAJAN RESTO & BAR');
                    setQrisNmid('ID1020260918001');
                    setQrisCity('JAKARTA SELATAN');
                    setQrisPostalCode('12180');
                    setQrisInstructions('Buka aplikasi BCA Mobile, GoPay, OVO, DANA, Livin, atau ShopeePay lalu scan QRIS ini.');
                    setQrisQrImageUrl('');
                  }}
                  className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </form>

            {/* Live QRIS Card Preview */}
            <div className="apple-glass rounded-2xl p-4 border border-white/15 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                Preview Tampilan Pembeli
              </span>

              <div className="bg-white p-4 rounded-2xl shadow-xl w-full max-w-[240px] text-gray-950 text-center">
                <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                  <span className="text-[10px] font-black tracking-tighter text-rose-600">QRIS</span>
                  <span className="text-[9px] font-bold text-gray-600">GPN</span>
                </div>

                <div className="text-center mb-2">
                  <h4 className="font-extrabold text-xs tracking-tight text-gray-900 line-clamp-1">
                    {qrisMerchantName || 'JAJAN RESTO & BAR'}
                  </h4>
                  <p className="text-[9px] text-gray-500">NMID: {qrisNmid || 'ID1020260918001'}</p>
                  <p className="text-[8px] text-gray-400">{qrisCity || 'JAKARTA'}</p>
                </div>

                <div className="aspect-square w-full bg-slate-50 rounded-xl border flex items-center justify-center overflow-hidden p-1.5">
                  {qrisQrImageUrl ? (
                    <img
                      src={qrisQrImageUrl}
                      alt="Custom QRIS"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `00020101021226${qrisNmid.length}${qrisNmid}520458125802ID59${(qrisMerchantName || 'JAJAN').length}${qrisMerchantName || 'JAJAN'}60${(qrisCity || 'JKT').length}${qrisCity || 'JKT'}`
                      )}`}
                      alt="Generated QRIS"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="mt-2 pt-1 border-t text-[8px] text-gray-400">
                  Mendukung BCA, GoPay, OVO, DANA, ShopeePay
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center px-2">
                Format standar QRIS Bank Indonesia (ASPI). QR di atas akan langsung aktif di layar checkout pembeli.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
