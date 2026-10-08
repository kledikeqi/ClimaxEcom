import { API_URL } from './config';
import {
  CheckoutResponse,
  CategoryStat,
  DemoPayPayload,
  DemoPayResponse,
  OrderPayload,
  PaymentConfig,
  Product,
  StockAlert,
  Summary,
  TimelineResponse,
  TokenResponse,
  TopProduct,
  User,
  VerifyResponse,
} from './types';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  body?: unknown;
  timeout?: number;
}

async function request<T>(path: string, { body, timeout = 10000 }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const response = await fetch(`${API_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) {
      let detail = `Request failed with status ${response.status}`;
      try {
        const payload = (await response.json()) as { detail?: string };
        if (payload.detail) detail = payload.detail;
      } catch {
        // non-JSON error body, keep the generic message
      }
      throw new ApiError(response.status, detail);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const fetchProducts = () => request<Product[]>('/products');
export const fetchSummary = () => request<Summary>('/analytics/summary');
export const fetchTimeline = (days = 30) =>
  request<TimelineResponse>(`/analytics/sales-timeline?days=${days}`);
export const fetchCategories = () => request<CategoryStat[]>('/analytics/revenue-by-category');
export const fetchTopProducts = (limit = 5) =>
  request<TopProduct[]>(`/analytics/top-products?limit=${limit}`);
export const fetchStockAlerts = () => request<StockAlert[]>('/analytics/stock-alerts');
export const createOrder = (payload: OrderPayload) =>
  request<{ status: string; order_id: number }>('/orders', { body: payload });

export const registerAccount = (payload: {
  email: string;
  password: string;
  full_name: string;
}) => request<TokenResponse>('/auth/register', { body: payload });

export const login = (payload: { email: string; password: string }) =>
  request<TokenResponse>('/auth/login', { body: payload });

export const fetchMe = () => request<User>('/auth/me');

export const fetchPaymentConfig = () => request<PaymentConfig>('/payments/config');
export const createCheckout = (payload: OrderPayload) =>
  request<CheckoutResponse>('/payments/checkout', { body: payload });
export const demoPay = (payload: DemoPayPayload) =>
  request<DemoPayResponse>('/payments/demo-pay', { body: payload });
export const verifyPayment = (sessionId: string) =>
  request<VerifyResponse>(`/payments/verify?session_id=${encodeURIComponent(sessionId)}`);

export const ORDERS_CSV_URL = `${API_URL}/analytics/export/orders.csv`;
export const PRODUCTS_CSV_URL = `${API_URL}/analytics/export/products.csv`;
