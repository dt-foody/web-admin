export interface DealSetting {
  id: string;
  allowFastDelivery: boolean; // Giao hàng nhanh
  allowScheduledDelivery: boolean; // Giao hàng sau
  allowCashPayment: boolean; // Thanh toán tiền mặt
  allowBankTransfer: boolean; // Thanh toán chuyển khoản
}
