import { API_URL } from './config';

async function request(path, { body, timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export const fetchProducts = () => request('/products');
export const fetchSummary = () => request('/analytics/summary');
export const fetchTimeline = (days = 30) => request(`/analytics/sales-timeline?days=${days}`);
export const fetchCategories = () => request('/analytics/revenue-by-category');
export const fetchTopProducts = (limit = 5) => request(`/analytics/top-products?limit=${limit}`);
export const fetchStockAlerts = () => request('/analytics/stock-alerts');
export const createOrder = (payload) => request('/orders', { body: payload });

export const ORDERS_CSV_URL = `${API_URL}/analytics/export/orders.csv`;
export const PRODUCTS_CSV_URL = `${API_URL}/analytics/export/products.csv`;
