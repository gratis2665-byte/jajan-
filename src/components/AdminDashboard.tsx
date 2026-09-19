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
  RefreshCw,
  Boxes,
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
    deleteUser,
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

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(20);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'available'>('all');

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
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F1A17] tracking-tight font-heading">
              Pusat Kendali Admin &amp; Kasir
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-50 text-[#D81A3C] border border-red-200">
              {currentUser.role === 'admin' ? 'Super Admin' : 'Kasir / Staff'}
            </span>
          </div>
          <p className="text-xs text-[#736962] mt-1">
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
              className="bg-white border border-[#EFE8DE] px-3.5 py-2 rounded-full text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition font-bold shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Buka Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleCreateOrSyncSheet}
            disabled={isSyncingSheets}
            className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
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
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <span>{sheetsMessage}</span>
          <button onClick={() => setSheetsMessage(null)} className="p-1 hover:opacity-70 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Omzet */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE8DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#736962] text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Omzet Lunas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-[#1F1A17] font-heading">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </span>
            <p className="text-[11px] text-emerald-700 mt-0.5 font-bold">
              Dari {totalPaidOrders} transaksi terverifikasi
            </p>
          </div>
        </div>

        {/* Card 2: Pesanan Aktif */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE8DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#736962] text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pesanan Dalam Proses</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-[#1F1A17] font-heading">
              {pendingOrdersCount}
            </span>
            <p className="text-[11px] text-amber-700 mt-0.5 font-bold">
              Sedang dimasak / siap antar
            </p>
          </div>
        </div>

        {/* Card 3: Total Menu */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE8DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#736962] text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Katalog Produk</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D81A3C] flex items-center justify-center border border-red-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-[#1F1A17] font-heading">
              {products.length}
            </span>
            <p className="text-[11px] text-[#736962] mt-0.5 font-medium">
              Makanan, minuman, &amp; snack
            </p>
          </div>
        </div>

        {/* Card 4: Stok Alert */}
        <div
          onClick={() => {
            setActiveAdminTab('inventory');
            setInventoryStockFilter(lowStockProducts.some(p => p.stock <= 0) ? 'out_of_stock' : 'low_stock');
          }}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE8DE] shadow-xs flex flex-col justify-between cursor-pointer hover:border-red-300 transition group"
          title="Klik untuk lihat menu yang perlu ditambah stoknya"
        >
          <div className="flex items-center justify-between text-[#736962] text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] group-hover:text-red-700 transition">Peringatan Stok</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-100 group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-[#1F1A17] font-heading">
              {lowStockProducts.length}
            </span>
            <p className="text-[11px] text-[#D81A3C] mt-0.5 font-bold flex items-center gap-1">
              <span>{lowStockProducts.length > 0 ? 'Item stok menipis / perlu restock' : 'Semua stok aman'}</span>
              {lowStockProducts.length > 0 && <span className="underline ml-1">Atur Stok &rarr;</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#EFE8DE]">
        {[
          { id: 'orders', label: 'Pesanan Masuk (POS)', icon: <ChefHat className="w-3.5 h-3.5" /> },
          { id: 'history', label: 'Riwayat Transaksi', icon: <Receipt className="w-3.5 h-3.5" /> },
          { id: 'inventory', label: 'Kelola Inventaris', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'staff', label: 'Atur Admin & Staff (RBAC)', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'qris', label: 'Atur QRIS Toko', icon: <QrCode className="w-3.5 h-3.5" /> },
          { id: 'sheets', label: 'Google Sheets Sync', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeAdminTab === tab.id
                ? 'bg-[#1F1A17] text-white shadow-xs'
                : 'bg-white text-[#52311D] border border-[#EFE8DE] hover:bg-[#FAF7F2]'
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    orderStatusFilter === f.id
                      ? 'bg-[#D81A3C] text-white shadow-xs'
                      : 'bg-white text-[#736962] border border-[#EFE8DE] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#736962] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID / Pelanggan..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#EFE8DE] rounded-full pl-9 pr-3 py-1.5 text-xs text-[#1F1A17] placeholder-[#A89F91] focus:outline-none focus:border-[#D81A3C]"
              />
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-16 text-center text-[#736962] text-xs bg-white border border-[#EFE8DE] rounded-3xl">
                Tidak ada pesanan yang sesuai dengan filter.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-4 border border-[#EFE8DE] shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                      <div>
                        <span className="font-mono font-black text-[#1F1A17] text-sm">
                          #{order.orderNumber}
                        </span>
                        <p className="text-[10px] text-[#736962]">
                          {new Date(order.createdAt).toLocaleTimeString('id-ID')} • {order.customerName}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : order.status === 'cooking'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-red-50 text-[#D81A3C] border border-red-200'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Fulfillment & Method */}
                    <div className="flex items-center justify-between py-2 text-xs text-[#52311D]">
                      <span className="flex items-center gap-1.5 font-bold">
                        {order.fulfillmentType === 'delivery' ? (
                          <>
                            <Truck className="w-3.5 h-3.5 text-[#D81A3C]" />
                            <span>Kurir Antar</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-3.5 h-3.5 text-amber-700" />
                            <span>{order.pickupCounter || 'Ambil di Tempat'}</span>
                          </>
                        )}
                      </span>

                      <span className="text-[11px] font-bold text-[#736962]">
                        {order.paymentMethod.toUpperCase()} (
                        {order.paymentStatus === 'paid' ? 'LUNAS' : 'PENDING'})
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 my-2 max-h-32 overflow-y-auto pr-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs flex justify-between text-[#1F1A17]">
                          <span className="truncate pr-2 font-medium">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="text-[#736962] shrink-0 font-bold">
                            Rp {item.totalPrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryAddress && (
                      <p className="text-[10px] text-[#736962] italic line-clamp-1 bg-[#FAF7F2] p-1.5 rounded-lg border border-[#EFE8DE]">
                        Alamat: {order.deliveryAddress}
                      </p>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="pt-2 border-t border-[#EFE8DE] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#736962] font-medium">Total Tagihan:</span>
                      <span className="text-sm font-black text-[#D81A3C] font-heading">
                        Rp {order.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {order.paymentStatus === 'unpaid' && (
                        <button
                          onClick={() => confirmOrderPayment(order.id)}
                          className="col-span-2 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                        >
                          Konfirmasi Bayar
                        </button>
                      )}

                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cooking')}
                          className="col-span-2 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer shadow-xs"
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
                          className="col-span-2 py-2 rounded-full bg-[#1F1A17] hover:bg-black text-white font-bold text-xs transition cursor-pointer shadow-xs"
                        >
                          {order.fulfillmentType === 'delivery' ? 'Kirim Kurir' : 'Siap Diambil'}
                        </button>
                      )}

                      {(order.status === 'ready_for_pickup' || order.status === 'delivering') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="col-span-2 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                        >
                          Selesaikan Pesanan
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTrackOrderId(order.id)}
                        className="py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EFE8DE] text-[#52311D] text-xs font-bold transition cursor-pointer"
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
                        className="py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EFE8DE] text-[#52311D] text-xs font-bold transition cursor-pointer"
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
            <h2 className="text-base font-bold text-[#1F1A17] font-heading">
              Semua Riwayat Transaksi Penjualan ({orders.length})
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateOrSyncSheet}
                className="px-3.5 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export ke Google Sheets</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#EFE8DE] shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#736962] uppercase tracking-wider font-bold text-[10px]">
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
                <tbody className="divide-y divide-[#EFE8DE] text-[#52311D]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAF7F2] transition">
                      <td className="p-3.5 text-[#736962] whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 font-mono font-black text-[#1F1A17]">
                        #{ord.orderNumber}
                      </td>
                      <td className="p-3.5 font-bold text-[#1F1A17]">{ord.customerName}</td>
                      <td className="p-3.5 max-w-xs truncate font-medium">
                        {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize font-semibold">
                          {ord.fulfillmentType === 'pickup' ? 'Ambil di Toko' : 'Kurir Antar'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold uppercase text-[11px]">{ord.paymentMethod}</td>
                      <td className="p-3.5 font-black text-[#D81A3C]">
                        Rp {ord.total.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : ord.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#1F1A17] font-heading flex items-center gap-2">
                <span>Inventaris Produk &amp; Stok Menu ({products.length})</span>
                {products.filter((p) => p.stock <= 0).length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                    {products.filter((p) => p.stock <= 0).length} Menu Habis
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#736962]">Atur ketersediaan, tambah stok saat habis, dan kelola menu jajan.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Jajan</span>
              </button>
            </div>
          </div>

          {/* Quick Alert Banner for Out-of-Stock Items */}
          {products.filter((p) => p.stock <= 0).length > 0 && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white text-[#D81A3C] shrink-0 mt-0.5 border border-red-100 shadow-2xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-900">
                    Ada {products.filter((p) => p.stock <= 0).length} menu dengan stok HABIS!
                  </h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Pelanggan tidak dapat memesan menu yang stoknya 0. Klik tombol restock untuk menambah stok kembali.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const outOfStockItems = products.filter((p) => p.stock <= 0);
                    outOfStockItems.forEach((p) => {
                      updateProduct(p.id, { stock: 20, isAvailable: true });
                    });
                    pushNotification({
                      title: 'Restock Massal Selesai',
                      message: `${outOfStockItems.length} menu yang habis berhasil diisi kembali stoknya (+20).`,
                      type: 'system',
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restock Semua (+20)</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: `Semua Menu (${products.length})` },
                { id: 'out_of_stock', label: `Stok Habis (${products.filter((p) => p.stock <= 0).length})` },
                { id: 'low_stock', label: `Stok Menipis (${products.filter((p) => p.stock > 0 && p.stock <= 5).length})` },
                { id: 'available', label: `Stok Aman (${products.filter((p) => p.stock > 5).length})` },
              ].map((filterTab) => (
                <button
                  key={filterTab.id}
                  onClick={() => setInventoryStockFilter(filterTab.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    inventoryStockFilter === filterTab.id
                      ? 'bg-[#1F1A17] text-white shadow-xs'
                      : 'bg-white text-[#736962] border border-[#EFE8DE] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {filterTab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#736962] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama menu..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full bg-white border border-[#EFE8DE] rounded-full pl-9 pr-3 py-1.5 text-xs text-[#1F1A17] placeholder-[#A89F91] focus:outline-none focus:border-[#D81A3C]"
              />
            </div>
          </div>

          {/* Products List Grid */}
          {(() => {
            const filteredProducts = products.filter((p) => {
              const matchesSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase());
              if (!matchesSearch) return false;
              if (inventoryStockFilter === 'out_of_stock') return p.stock <= 0;
              if (inventoryStockFilter === 'low_stock') return p.stock > 0 && p.stock <= 5;
              if (inventoryStockFilter === 'available') return p.stock > 5;
              return true;
            });

            if (filteredProducts.length === 0) {
              return (
                <div className="py-16 text-center text-[#736962] text-xs bg-white border border-[#EFE8DE] rounded-3xl">
                  Tidak ada menu jajan yang sesuai dengan filter inventaris ini.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredProducts.map((p) => {
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= 5;

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl p-3.5 border flex flex-col justify-between text-left transition shadow-xs ${
                        isOut
                          ? 'border-red-300 bg-red-50/30'
                          : isLow
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-[#EFE8DE]'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="relative shrink-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-[#EFE8DE]"
                          />
                          {isOut ? (
                            <span className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-[10px] font-bold text-white">
                              HABIS
                            </span>
                          ) : isLow ? (
                            <span className="absolute top-1 left-1 bg-amber-500 text-white font-black text-[9px] px-1 rounded shadow-xs">
                              Sisa {p.stock}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-[#1F1A17] truncate">{p.name}</h4>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="text-[#736962] hover:text-red-600 p-1 transition shrink-0 cursor-pointer"
                              title="Hapus produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-[#D81A3C] font-black">
                            Rp {p.price.toLocaleString('id-ID')}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isOut
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isOut ? 'Stok Kosong' : isLow ? `Sisa ${p.stock}` : `Stok: ${p.stock}`}
                            </span>

                            <button
                              onClick={() => updateProduct(p.id, { isAvailable: !p.isAvailable })}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition ${
                                p.isAvailable
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-[#FAF7F2] text-[#736962] border border-[#EFE8DE]'
                              }`}
                            >
                              {p.isAvailable ? 'Aktif' : 'Nonaktif'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Stock Adjustment Controls */}
                      <div className="mt-3 pt-2.5 border-t border-[#EFE8DE] flex items-center justify-between gap-2">
                        {/* Incremental Controls */}
                        <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#EFE8DE] rounded-full p-1 text-xs">
                          <button
                            onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })}
                            className="w-6 h-6 rounded-full bg-white hover:bg-red-50 flex items-center justify-center font-bold text-[#52311D] hover:text-red-700 transition border border-[#EFE8DE] cursor-pointer"
                            title="Kurang 1"
                          >
                            -1
                          </button>
                          <span className="font-bold text-[#1F1A17] px-1.5 text-center min-w-[28px]">
                            {p.stock}
                          </span>
                          <button
                            onClick={() => updateProduct(p.id, { stock: p.stock + 1, isAvailable: true })}
                            className="w-6 h-6 rounded-full bg-white hover:bg-emerald-50 flex items-center justify-center font-bold text-[#52311D] hover:text-emerald-700 transition border border-[#EFE8DE] cursor-pointer"
                            title="Tambah 1"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => updateProduct(p.id, { stock: p.stock + 5, isAvailable: true })}
                            className="px-1.5 h-6 rounded-full bg-white hover:bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-800 transition border border-[#EFE8DE] cursor-pointer"
                            title="Tambah 5"
                          >
                            +5
                          </button>
                        </div>

                        {/* Direct Restock Button */}
                        <button
                          onClick={() => {
                            setRestockProduct(p);
                            setRestockAmount(p.stock <= 0 ? 20 : 10);
                          }}
                          className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                            isOut
                              ? 'bg-[#D81A3C] hover:bg-[#BF1231] text-white animate-pulse'
                              : 'bg-[#1F1A17] hover:bg-black text-white'
                          }`}
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>{isOut ? 'Tambah Stok' : 'Restock'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Modal Restock Khusus */}
          {restockProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 border border-[#EFE8DE] shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-red-50 text-[#D81A3C] border border-red-100">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1A17] font-heading">Tambah Stok Produk</h3>
                      <p className="text-[11px] text-[#736962] truncate max-w-[200px]">
                        {restockProduct.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRestockProduct(null)}
                    className="text-[#736962] hover:text-[#1F1A17] p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DE] flex items-center justify-between">
                    <div>
                      <span className="text-[#736962] text-[11px] block font-medium">Stok Saat Ini:</span>
                      <span
                        className={`text-base font-extrabold ${
                          restockProduct.stock <= 0 ? 'text-red-600' : 'text-[#1F1A17]'
                        }`}
                      >
                        {restockProduct.stock <= 0 ? '0 (Habis)' : restockProduct.stock}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#736962] text-[11px] block text-right font-medium">Stok Baru:</span>
                      <span className="text-base font-extrabold text-emerald-700 text-right block">
                        {Math.max(0, restockProduct.stock + Number(restockAmount || 0))}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[#52311D] block mb-1 font-bold">
                      Jumlah Stok yang Ditambahkan:
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={restockAmount}
                      onChange={(e) => setRestockAmount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-sm font-black text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[11px] text-[#736962] block mb-1.5 font-semibold">Pilihan Cepat:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 20, 50, 100].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setRestockAmount(qty)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            restockAmount === qty
                              ? 'bg-[#D81A3C] text-white border-[#D81A3C]'
                              : 'bg-[#FAF7F2] text-[#52311D] hover:bg-white border-[#EFE8DE]'
                          }`}
                        >
                          +{qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRestockProduct(null)}
                      className="flex-1 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EFE8DE] text-[#52311D] font-bold text-xs transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newTotal = restockProduct.stock + Number(restockAmount || 0);
                        updateProduct(restockProduct.id, {
                          stock: newTotal,
                          isAvailable: true,
                        });
                        pushNotification({
                          title: 'Stok Berhasil Ditambahkan',
                          message: `Stok "${restockProduct.name}" berhasil ditambah +${restockAmount}. Total stok kini: ${newTotal}.`,
                          type: 'system',
                        });
                        setRestockProduct(null);
                      }}
                      className="flex-1 py-2.5 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Stok</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Tambah Produk */}
          {isAddProductOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-[#EFE8DE] shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                  <h3 className="text-base font-black text-[#1F1A17] font-heading">Tambah Menu Jajan Baru</h3>
                  <button onClick={() => setIsAddProductOpen(false)} className="text-[#736962] hover:text-[#1F1A17] cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[#52311D] font-bold block mb-1">Nama Menu</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Es Cendol Latte Durian"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[#52311D] font-bold block mb-1">Kategori</label>
                      <select
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value as any)}
                        className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17]"
                      >
                        <option value="makanan">Makanan</option>
                        <option value="minuman">Minuman</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[#52311D] font-bold block mb-1">Harga (Rp)</label>
                      <input
                        type="number"
                        required
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(Number(e.target.value))}
                        className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#52311D] font-bold block mb-1">Stok Awal</label>
                    <input
                      type="number"
                      required
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(Number(e.target.value))}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                    />
                  </div>

                  <div>
                    <label className="text-[#52311D] font-bold block mb-1">URL Gambar (Opsional)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                    />
                  </div>

                  <div>
                    <label className="text-[#52311D] font-bold block mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs transition cursor-pointer shadow-xs"
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
              <h2 className="text-base font-black text-[#1F1A17] font-heading">
                Kelola Admin &amp; Staff (Role-Based Access Control)
              </h2>
              <p className="text-xs text-[#736962]">
                Admin dapat mengatur admin lain, menugaskan kasir, dan mengelola hak akses sistem.
              </p>
            </div>

            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 rounded-full bg-[#1F1A17] hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Admin / Staff Baru</span>
            </button>
          </div>

          {/* Staff List Table */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#EFE8DE] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#736962] uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Nama Staff</th>
                  <th className="p-3.5">Email / Kontak</th>
                  <th className="p-3.5">Peran Saat Ini</th>
                  <th className="p-3.5">Ubah Hak Akses (RBAC)</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DE] text-[#52311D]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF7F2] transition">
                    <td className="p-3.5 font-bold text-[#1F1A17] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-50 text-[#D81A3C] border border-red-100 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3.5 text-[#736962]">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-50 text-[#D81A3C] border border-red-200'
                            : u.role === 'cashier'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {u.role === 'admin' ? 'Super Admin' : u.role === 'cashier' ? 'Kasir' : 'Pelanggan'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        className="bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-1 text-xs text-[#1F1A17] cursor-pointer focus:outline-none focus:border-[#D81A3C]"
                      >
                        <option value="admin">Super Admin (Akses Penuh)</option>
                        <option value="cashier">Kasir (POS &amp; Dapur)</option>
                        <option value="customer">Pelanggan</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          if (users.length <= 1) {
                            alert('Minimal harus tersisa 1 akun.');
                            return;
                          }
                          if (confirm(`Hapus akun ${u.name}?`)) {
                            deleteUser(u.id);
                            pushNotification({
                              title: 'Akun Dihapus',
                              message: `Akun ${u.name} telah dihapus dari sistem.`,
                              type: 'system',
                            });
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                        title={`Hapus Akun ${u.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Tambah Staff */}
          {isAddStaffOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-[#EFE8DE] shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                  <h3 className="text-base font-black text-[#1F1A17] font-heading">Tambah Akun Staff / Admin</h3>
                  <button onClick={() => setIsAddStaffOpen(false)} className="text-[#736962] hover:text-[#1F1A17] cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[#52311D] font-bold block mb-1">Nama Lengkap Staff</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Pegawai / Admin Baru"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                    />
                  </div>

                  <div>
                    <label className="text-[#52311D] font-bold block mb-1">Email Toko</label>
                    <input
                      type="email"
                      required
                      placeholder="staff@jajan-resto.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17] focus:outline-none focus:border-[#D81A3C]"
                    />
                  </div>

                  <div>
                    <label className="text-[#52311D] font-bold block mb-1">Pilih Peran Akses</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl p-2.5 text-xs text-[#1F1A17]"
                    >
                      <option value="admin">Super Admin (Bisa atur admin lain &amp; keuangan)</option>
                      <option value="cashier">Kasir (Kelola pesanan &amp; dapur)</option>
                      <option value="customer">Pelanggan Biasa</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-full bg-[#1F1A17] hover:bg-black text-white font-bold text-xs transition cursor-pointer shadow-xs"
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
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] space-y-4 max-w-3xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1F1A17] font-heading">Integrasi Google Sheets Real-Time</h3>
              <p className="text-xs text-[#736962]">
                Otomatisasi pencatatan pembukuan, rekonsiliasi pembayaran digital QRIS, dan data inventaris langsung ke Google Spreadsheet.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DE] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#736962]">Status Akun Google:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Terotentikasi OAuth
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#736962]">Spreadsheet Aktif:</span>
              <span className="text-[#1F1A17] font-bold">
                {googleSpreadsheet ? googleSpreadsheet.id : 'Belum dibuat (Otomatis dibuat saat ekspor)'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleCreateOrSyncSheet}
              disabled={isSyncingSheets}
              className="py-2.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Sedang Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>

            {googleSpreadsheet && (
              <a
                href={googleSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 rounded-full bg-white border border-[#EFE8DE] hover:bg-[#FAF7F2] text-[#1F1A17] font-bold text-xs flex items-center gap-2 transition"
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
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] space-y-6 max-w-4xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE8DE] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1F1A17] font-heading">Pengaturan QRIS Merchant Toko</h3>
                <p className="text-xs text-[#736962]">
                  Sesuaikan barcode QRIS, NMID, nama gerai, dan instruksi bayar yang tampil otomatis saat checkout pelanggan.
                </p>
              </div>
            </div>

            {qrisSavedSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tersimpan ke Cloud &amp; Real-time</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Settings */}
            <form onSubmit={handleSaveQris} className="lg:col-span-2 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#52311D] font-bold mb-1">
                    Nama Merchant Toko (QRIS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={qrisMerchantName}
                    onChange={(e) => setQrisMerchantName(e.target.value)}
                    placeholder="Contoh: JAJAN RESTO & BAR"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EFE8DE] text-[#1F1A17] placeholder-[#A89F91] focus:outline-none focus:border-[#D81A3C]"
                  />
                  <span className="text-[10px] text-[#736962] mt-1 block">
                    Nama ini akan muncul di header struk QRIS pelanggan.
                  </span>
                </div>

                <div>
                  <label className="block text-[#52311D] font-bold mb-1">
                    NMID (National Merchant ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={qrisNmid}
                    onChange={(e) => setQrisNmid(e.target.value)}
                    placeholder="Contoh: ID1020260918001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EFE8DE] text-[#1F1A17] placeholder-[#A89F91] focus:outline-none focus:border-[#D81A3C]"
                  />
                  <span className="text-[10px] text-[#736962] mt-1 block">
                    NMID resmi dari acquirer (BCA, GoPay, Nobu, ShopeePay, dll).
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#52311D] font-bold mb-1">Kota / Domisili Gerai</label>
                  <input
                    type="text"
                    value={qrisCity}
                    onChange={(e) => setQrisCity(e.target.value)}
                    placeholder="Contoh: JAKARTA SELATAN"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EFE8DE] text-[#1F1A17] placeholder-[#A89F91] focus:outline-none focus:border-[#D81A3C]"
                  />
                </div>

                <div>
                  <label className="block text-[#52311D] font-bold mb-1">Kode Pos Gerai</label>
                  <input
                    type="text"
                    value={qrisPostalCode}
                    onChange={(e) => setQrisPostalCode(e.target.value)}
                    placeholder="Contoh: 12180"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EFE8DE] text-[#1F1A17] placeholder-[#A89F91] focus:outline-none focus:border-[#D81A3C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#52311D] font-bold mb-1">Upload QR Code Gambar Sendiri (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#EFE8DE] text-[#1F1A17] cursor-pointer transition font-bold">
                    <Upload className="w-4 h-4 text-[#D81A3C]" />
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
                      className="text-red-600 hover:text-red-700 text-[11px] underline font-bold cursor-pointer"
                    >
                      Hapus Gambar Custom
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[#736962] mt-1 block">
                  Unggah file JPG/PNG QR barcode toko Anda. Jika kosong, sistem otomatis membuat QR simulasi interaktif.
                </span>
              </div>

              <div>
                <label className="block text-[#52311D] font-bold mb-1">Petunjuk Pembayaran untuk Pembeli</label>
                <textarea
                  rows={2}
                  value={qrisInstructions}
                  onChange={(e) => setQrisInstructions(e.target.value)}
                  placeholder="Petunjuk bayar..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EFE8DE] text-[#1F1A17] placeholder-[#A89F91] focus:outline-none focus:border-[#D81A3C]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-full bg-[#D81A3C] hover:bg-[#BF1231] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
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
                  className="py-2.5 px-4 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#736962] hover:text-[#1F1A17] border border-[#EFE8DE] text-xs font-bold transition cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </form>

            {/* Live QRIS Card Preview */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE8DE] flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-[11px] text-[#D81A3C] font-black uppercase tracking-wider">
                Preview Tampilan Pembeli
              </span>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#EFE8DE] w-full max-w-[240px] text-gray-950 text-center">
                <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-1.5 mb-2">
                  <span className="text-[10px] font-black tracking-tighter text-[#D81A3C]">QRIS</span>
                  <span className="text-[9px] font-bold text-gray-600">GPN</span>
                </div>

                <div className="text-center mb-2">
                  <h4 className="font-extrabold text-xs tracking-tight text-[#1F1A17] line-clamp-1">
                    {qrisMerchantName || 'JAJAN RESTO & BAR'}
                  </h4>
                  <p className="text-[9px] text-[#736962]">NMID: {qrisNmid || 'ID1020260918001'}</p>
                  <p className="text-[8px] text-[#736962]">{qrisCity || 'JAKARTA'}</p>
                </div>

                <div className="aspect-square w-full bg-stone-50 rounded-xl border border-[#EFE8DE] flex items-center justify-center overflow-hidden p-1.5">
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

                <div className="mt-2 pt-1 border-t border-[#EFE8DE] text-[8px] text-[#736962] font-medium">
                  Mendukung BCA, GoPay, OVO, DANA, ShopeePay
                </div>
              </div>

              <p className="text-[11px] text-[#736962] text-center px-2">
                Format standar QRIS Bank Indonesia (ASPI). QR di atas akan langsung aktif di layar checkout pembeli.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
