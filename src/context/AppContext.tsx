import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Product,
  CartItem,
  Order,
  OrderStatus,
  PushNotification,
  TransactionActivity,
  SelectedOption,
  QRISSettings,
} from '../types';
import { initialUsers, initialProducts, initialOrders, initialActivities } from '../data/initialData';
import { playNotificationSound, playPaymentSuccessSound } from '../services/soundEffects';
import { testFirestoreConnection, saveQrisSettingsToCloud, subscribeToQrisSettings, saveOrderToCloud } from '../services/firestoreService';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addNewStaff: (staffData: Omit<User, 'id'>) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  cart: CartItem[];
  addToCart: (product: Product, quantity: number, selectedOptions: SelectedOption[], notes?: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartTotalCount: number;
  cartSubtotal: number;

  orders: Order[];
  createOrder: (orderPayload: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, customMessage?: string) => void;
  confirmOrderPayment: (orderId: string) => void;
  activeTrackOrderId: string | null;
  setActiveTrackOrderId: (id: string | null) => void;

  notifications: PushNotification[];
  pushNotification: (notif: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  activeIslandNotification: PushNotification | null;
  dismissIslandNotification: () => void;

  activities: TransactionActivity[];
  addTransactionActivity: (activity: Omit<TransactionActivity, 'id' | 'timestamp'>) => void;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (prod: Product | null) => void;

  activeTab: 'menu' | 'tracker' | 'admin' | 'cashier';
  setActiveTab: (tab: 'menu' | 'tracker' | 'admin' | 'cashier') => void;

  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  googleSpreadsheet: { id: string; url: string } | null;
  setGoogleSpreadsheet: (sheet: { id: string; url: string } | null) => void;

  qrisSettings: QRISSettings;
  updateQrisSettings: (settings: Partial<QRISSettings>) => void;
  resetQrisSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('jajan_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('jajan_current_user');
    return saved ? JSON.parse(saved) : initialUsers[2]; // Default to Dimas Pratama (customer)
  });

  // Products state
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('jajan_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('jajan_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('jajan_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  // Real-time Activities state
  const [activities, setActivities] = useState<TransactionActivity[]>(initialActivities);

  // Notifications state
  const [notifications, setNotifications] = useState<PushNotification[]>([
    {
      id: 'notif-1',
      title: 'Selamat Datang di Jajan!',
      message: 'Nikmati promo diskon spesial JAJANHEMAT untuk pesanan pertama Anda.',
      timestamp: 'Baru saja',
      type: 'system',
      read: false,
    },
  ]);
  const [activeIslandNotification, setActiveIslandNotification] = useState<PushNotification | null>(null);

  // Active track order
  const [activeTrackOrderId, setActiveTrackOrderId] = useState<string | null>(null);

  // Modals and tabs
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'tracker' | 'admin' | 'cashier'>('menu');

  // Google Sheets state
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleSpreadsheet, setGoogleSpreadsheet] = useState<{ id: string; url: string } | null>(() => {
    const saved = localStorage.getItem('jajan_google_sheet');
    return saved ? JSON.parse(saved) : null;
  });

  // QRIS Settings state (customizable by Admin)
  const defaultQrisSettings: QRISSettings = {
    merchantName: 'JAJAN NUSANTARA RESTO',
    nmid: 'ID1020260918001',
    city: 'JAKARTA SELATAN',
    postalCode: '12180',
    instructions: 'Buka aplikasi BCA Mobile, GoPay, OVO, DANA, Livin, atau ShopeePay lalu scan QRIS ini.',
    autoConfirmationEnabled: true,
  };

  const [qrisSettings, setQrisSettings] = useState<QRISSettings>(() => {
    const saved = localStorage.getItem('jajan_qris_settings');
    if (saved) {
      try {
        return { ...defaultQrisSettings, ...JSON.parse(saved) };
      } catch {
        return defaultQrisSettings;
      }
    }
    return defaultQrisSettings;
  });

  const updateQrisSettings = (settings: Partial<QRISSettings>) => {
    setQrisSettings((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('jajan_qris_settings', JSON.stringify(updated));
      // Sync seamlessly to Cloud Firestore
      saveQrisSettingsToCloud(updated);
      return updated;
    });
  };

  const resetQrisSettings = () => {
    setQrisSettings(defaultQrisSettings);
    localStorage.setItem('jajan_qris_settings', JSON.stringify(defaultQrisSettings));
    saveQrisSettingsToCloud(defaultQrisSettings);
  };

  // Firestore initial connection and subscription to cloud updates
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = subscribeToQrisSettings((cloudSettings) => {
      if (cloudSettings && cloudSettings.merchantName) {
        setQrisSettings((prev) => ({ ...prev, ...cloudSettings }));
        localStorage.setItem('jajan_qris_settings', JSON.stringify(cloudSettings));
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Persist core state
  useEffect(() => {
    localStorage.setItem('jajan_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('jajan_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('jajan_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('jajan_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('jajan_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (googleSpreadsheet) {
      localStorage.setItem('jajan_google_sheet', JSON.stringify(googleSpreadsheet));
    }
  }, [googleSpreadsheet]);

  // Push notification helper
  const pushNotification = (notifData: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: PushNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Baru saja',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveIslandNotification(newNotif);
    playNotificationSound();

    // Auto-dismiss dynamic island after 5 seconds
    setTimeout(() => {
      setActiveIslandNotification((current) => (current?.id === newNotif.id ? null : current));
    }, 5000);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const dismissIslandNotification = () => {
    setActiveIslandNotification(null);
  };

  // Add Transaction activity helper
  const addTransactionActivity = (actData: Omit<TransactionActivity, 'id' | 'timestamp'>) => {
    const newAct: TransactionActivity = {
      ...actData,
      id: `act-${Date.now()}`,
      timestamp: 'Baru saja',
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  // Switch role helper
  const switchRole = (role: UserRole) => {
    const existing = users.find((u) => u.role === role);
    if (existing) {
      setCurrentUser(existing);
    } else {
      const fallback: User = {
        id: `user-${role}-${Date.now()}`,
        name: role === 'admin' ? 'Super Admin Toko' : role === 'cashier' ? 'Kasir Dapur' : 'Pelanggan Jajan',
        email: `${role}@apple-resto.com`,
        role,
      };
      setCurrentUser(fallback);
    }

    if (role === 'admin') {
      setActiveTab('admin');
    } else if (role === 'cashier') {
      setActiveTab('cashier');
    } else {
      setActiveTab('menu');
    }
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }
  };

  const addNewStaff = (staffData: Omit<User, 'id'>) => {
    const newStaff: User = {
      ...staffData,
      id: `staff-${Date.now()}`,
      isCustomAdmin: true,
    };
    setUsers((prev) => [...prev, newStaff]);
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Cart operations
  const addToCart = (
    product: Product,
    quantity: number,
    selectedOptions: SelectedOption[],
    notes?: string
  ) => {
    const optionsExtra = selectedOptions.reduce((acc, opt) => acc + opt.extraPrice, 0);
    const unitPrice = product.price + optionsExtra;
    const totalPrice = unitPrice * quantity;

    // Check if exact same item with same options exists
    const optionsKey = JSON.stringify(selectedOptions.sort((a, b) => a.optionName.localeCompare(b.optionName)));
    
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.notes === (notes || '') &&
          JSON.stringify(item.selectedOptions.sort((a, b) => a.optionName.localeCompare(b.optionName))) === optionsKey
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + quantity;
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          totalPrice: current.unitPrice * newQty,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        product,
        quantity,
        selectedOptions,
        notes: notes || '',
        unitPrice,
        totalPrice,
      };
      return [...prev, newItem];
    });

    // Reduce local stock display
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p))
    );

    // Push mini notification
    pushNotification({
      title: 'Ditambahkan ke Keranjang',
      message: `${quantity}x ${product.name} telah masuk ke keranjang belanja Anda.`,
      type: 'system',
    });
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  // Orders creation & management
  const createOrder = (orderPayload: Partial<Order>): Order => {
    const orderNumber = `JJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone || '081234567890',
      items: cart,
      subtotal: cartSubtotal,
      discount: orderPayload.discount || 0,
      serviceFee: 2000,
      deliveryFee: orderPayload.fulfillmentType === 'delivery' ? 12000 : 0,
      total: (cartSubtotal - (orderPayload.discount || 0)) + 2000 + (orderPayload.fulfillmentType === 'delivery' ? 12000 : 0),
      fulfillmentType: orderPayload.fulfillmentType || 'pickup',
      deliveryAddress: orderPayload.deliveryAddress,
      pickupCounter: orderPayload.fulfillmentType === 'pickup' ? `Counter ${['A-01', 'A-02', 'B-01', 'B-02'][Math.floor(Math.random() * 4)]}` : undefined,
      estimatedTimeMinutes: orderPayload.fulfillmentType === 'pickup' ? 15 : 30,
      paymentMethod: orderPayload.paymentMethod || 'qris',
      paymentStatus: 'unpaid',
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'pending_payment',
          timestamp: new Date().toLocaleTimeString('id-ID'),
          message: 'Pesanan dibuat. Menunggu konfirmasi pembayaran.',
        },
      ],
      ...orderPayload,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    saveOrderToCloud(newOrder);
    return newOrder;
  };

  // Payment confirmation with real-time celebrations
  const confirmOrderPayment = (orderId: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    let targetOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          targetOrder = {
            ...order,
            paymentStatus: 'paid',
            status: 'confirmed',
            updatedAt: new Date().toISOString(),
            timeline: [
              ...order.timeline,
              {
                status: 'confirmed',
                timestamp,
                message: `Pembayaran ${order.paymentMethod.toUpperCase()} Rp ${order.total.toLocaleString('id-ID')} terverifikasi sukses!`,
              },
            ],
          };
          return targetOrder;
        }
        return order;
      })
    );

    // Confetti explosion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#ffffff'],
    });

    // Audio chime
    playPaymentSuccessSound();

    if (targetOrder) {
      // Add real-time transaction activity
      const summary = targetOrder.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ');
      addTransactionActivity({
        orderId: targetOrder.orderNumber,
        customerName: targetOrder.customerName,
        itemsSummary: summary,
        total: targetOrder.total,
        paymentMethod: targetOrder.paymentMethod.toUpperCase(),
        type: 'payment_confirmed',
      });

      // Push notification
      pushNotification({
        title: 'Pembayaran Dikonfirmasi!',
        message: `Pesanan #${targetOrder.orderNumber} telah dibayar. Dapur kami segera menyiapkan makanan lezat Anda.`,
        type: 'payment',
        orderId: targetOrder.id,
      });

      saveOrderToCloud(targetOrder);

      // Auto-progress to cooking after 4 seconds for simulation
      setTimeout(() => {
        updateOrderStatus(orderId, 'cooking', 'Dapur sedang memasak & meracik menu pilihan Anda.');
      }, 4500);
    }
  };

  // Update order status (Cooking, Ready, Delivering, Completed)
  const updateOrderStatus = (orderId: string, status: OrderStatus, customMessage?: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    let updatedOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          let message = customMessage;
          if (!message) {
            switch (status) {
              case 'cooking':
                message = 'Dapur sedang memasak & meracik menu pilihan Anda.';
                break;
              case 'ready_for_pickup':
                message = `Pesanan siap diambil di ${order.pickupCounter || 'Counter A-01'}. Silakan tunjukkan nomor pesanan #${order.orderNumber}.`;
                break;
              case 'delivering':
                message = 'Kurir kilat sedang dalam perjalanan mengantarkan ke alamat Anda.';
                break;
              case 'completed':
                message = 'Pesanan telah selesai diserahkan. Selamat menikmati jajanannya!';
                break;
              case 'cancelled':
                message = 'Pesanan telah dibatalkan.';
                break;
              default:
                message = `Status pesanan diperbarui menjadi ${status}`;
            }
          }

          updatedOrder = {
            ...order,
            status,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...order.timeline,
              {
                status,
                timestamp,
                message,
              },
            ],
          };
          return updatedOrder;
        }
        return order;
      })
    );

    if (updatedOrder) {
      let notifTitle = 'Update Status Pesanan';
      if (status === 'cooking') notifTitle = 'Pesanan Sedang Dimasak 🍳';
      if (status === 'ready_for_pickup') notifTitle = 'Siap Diambil di Tempat! 🛍️';
      if (status === 'delivering') notifTitle = 'Kurir Sedang Mengantar 🛵';
      if (status === 'completed') notifTitle = 'Pesanan Selesai 🎉';

      pushNotification({
        title: notifTitle,
        message: `Pesanan #${updatedOrder.orderNumber}: ${customMessage || 'Status terkini telah diperbarui.'}`,
        type: 'order_status',
        orderId: updatedOrder.id,
      });

      if (status === 'completed') {
        addTransactionActivity({
          orderId: updatedOrder.orderNumber,
          customerName: updatedOrder.customerName,
          itemsSummary: updatedOrder.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', '),
          total: updatedOrder.total,
          paymentMethod: updatedOrder.paymentMethod.toUpperCase(),
          type: 'order_completed',
        });
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        switchRole,
        updateUserRole,
        addNewStaff,

        products,
        addProduct,
        updateProduct,
        deleteProduct,

        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotalCount,
        cartSubtotal,

        orders,
        createOrder,
        updateOrderStatus,
        confirmOrderPayment,
        activeTrackOrderId,
        setActiveTrackOrderId,

        notifications,
        pushNotification,
        markNotificationRead,
        activeIslandNotification,
        dismissIslandNotification,

        activities,
        addTransactionActivity,

        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedProductForDetail,
        setSelectedProductForDetail,

        activeTab,
        setActiveTab,

        googleAccessToken,
        setGoogleAccessToken,
        googleSpreadsheet,
        setGoogleSpreadsheet,

        qrisSettings,
        updateQrisSettings,
        resetQrisSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
