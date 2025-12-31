export interface DealOptionConfig {
  value: boolean;
  note: string;
  activeNote: boolean;
  showNoteWhen: 'on' | 'off' | 'always'; // Điều kiện hiện note
}

export interface DealSetting {
  id: string;
  // Cấu hình giao hàng
  fastDelivery: DealOptionConfig;
  scheduledDelivery: DealOptionConfig;
  // Cấu hình thanh toán
  cashPayment: DealOptionConfig;
  bankTransfer: DealOptionConfig;

  //
  homeDelivery: DealOptionConfig; // Giao hàng tận nơi
  storePickup: DealOptionConfig; // Đến lấy tại cửa hàng
}
