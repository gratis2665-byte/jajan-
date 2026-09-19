export type UserRole = 'customer' | 'cashier' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isCustomAdmin?: boolean;
}

export type ProductCategory = 'semua' | 'makanan' | 'minuman' | 'snack' | 'bestseller';

export interface ProductOption {
  name: string;
  choices: {
    label: string;
    extraPrice: number;
  }[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'makanan' | 'minuman' | 'snack';
  isBestSeller?: boolean;
  image: string;
  stock: number;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  options?: ProductOption[];
}

export interface SelectedOption {
  optionName: string;
  choiceLabel: string;
  extraPrice: number;
}

export interface CartItem {
  id: string; // unique cart entry id
  productId: string;
  product: Product;
  quantity: number;
  selectedOptions: SelectedOption[];
  notes?: string;
  unitPrice: number;
  totalPrice: number;
}

export type FulfillmentType = 'pickup' | 'delivery';

export type PaymentMethod = 'qris' | 'gopay' | 'ovo' | 'dana' | 'shopeepay' | 'bca_va' | 'cash';

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cooking'
  | 'ready_for_pickup'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  message: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  serviceFee: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string;
  pickupCounter?: string;
  estimatedTimeMinutes: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimelineEvent[];
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order_status' | 'payment' | 'system';
  read: boolean;
  orderId?: string;
}

export interface TransactionActivity {
  id: string;
  orderId: string;
  customerName: string;
  itemsSummary: string;
  total: number;
  paymentMethod: string;
  timestamp: string;
  type: 'payment_confirmed' | 'order_placed' | 'order_completed';
}

export interface QRISSettings {
  merchantName: string;
  nmid: string;
  qrisPayload?: string; // string or QR data
  qrImageUrl?: string; // custom uploaded QR image URL or base64
  city: string;
  postalCode?: string;
  instructions: string;
  autoConfirmationEnabled: boolean;
}
