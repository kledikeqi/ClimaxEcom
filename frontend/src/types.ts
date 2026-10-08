export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  description: string;
  colors: string[];
  badge: string | null;
  stock: number;
  sizes: string[];
}

export interface CartItem extends Product {
  selectedSize: string;
  qty: number;
}

export interface OrderItemPayload {
  product_id?: number;
  id?: number;
  name: string;
  category?: string;
  price?: string;
  unit_price?: number;
  size?: string;
  selectedSize?: string;
  qty: number;
}

export interface OrderPayload {
  customer_name: string;
  address: string;
  phone: string;
  total_price: number;
  items: OrderItemPayload[];
}

export interface DemoCard {
  number: string;
  exp: string;
  cvc: string;
}

export interface DemoPayPayload extends OrderPayload {
  card: DemoCard;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PaymentConfig {
  mode: 'stripe' | 'demo';
  currency: string;
}

export interface CheckoutResponse {
  mode: 'stripe' | 'demo';
  url?: string;
  order_id: number | null;
}

export interface DemoPayResponse {
  status: string;
  mode: string;
  order_id: number;
}

export interface VerifyResponse {
  status: string;
  paid: boolean;
  order_id: number;
}

export interface Order {
  id: number;
  customer_name: string;
  address: string;
  phone: string;
  total_price: number;
  items: OrderItemPayload[];
  status: string;
  created_at: string | null;
  is_demo: boolean;
  user_id: number | null;
  payment_method: string | null;
}

export interface Summary {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  units_sold: number;
  unique_customers: number;
  revenue_last_7d: number;
  revenue_previous_7d: number;
  revenue_growth_pct: number | null;
  orders_last_7d: number;
  top_category: string | null;
  low_stock_products: number;
  inventory_value: number;
  has_demo_data: boolean;
  generated_at: string;
}

export interface TimelinePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TimelineResponse {
  days: number;
  points: TimelinePoint[];
}

export interface CategoryStat {
  category: string;
  revenue: number;
  units: number;
  orders: number;
  share_pct: number;
}

export interface TopProduct {
  product_id: number;
  name: string;
  units: number;
  revenue: number;
  orders: number;
}

export interface StockAlert {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  units_sold: number;
}

export type LoadStatus = 'loading' | 'ready' | 'error';

export interface ProductState {
  status: LoadStatus;
  data: Product[];
}

export type AppView = 'shop' | 'wishlist' | 'dashboard' | 'creators' | 'contact';
