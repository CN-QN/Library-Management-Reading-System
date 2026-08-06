import apiClient from '../api-client';

export interface PaymentQrData {
  orderCode: string;
  qrCodeUrl: string;
  amount: number;
  paymentContent: string;
  bookId: string;
  bookTitle: string;
  status: string;
}

export interface CheckAccessData {
  hasAccess: boolean;
  bookId: string;
}

/**
 * Khởi tạo mã QR thanh toán VietQR SePay cho sách Premium.
 */
export async function createPaymentQr(bookId: string): Promise<PaymentQrData> {
  const res = await apiClient.post('/payments/create-qr', { bookId });
  return res.data?.data || res.data;
}

/**
 * Lấy trạng thái đơn hàng thanh toán hiện tại.
 */
export async function getOrderStatus(orderCode: string): Promise<PaymentQrData> {
  const res = await apiClient.get(`/payments/status/${encodeURIComponent(orderCode)}`);
  return res.data?.data || res.data;
}

/**
 * Kiểm tra xem độc giả đã có quyền truy cập cuốn sách này chưa.
 */
export async function checkBookAccess(bookId: string): Promise<CheckAccessData> {
  const res = await apiClient.get(`/payments/check-access/${encodeURIComponent(bookId)}`);
  return res.data?.data || res.data;
}
