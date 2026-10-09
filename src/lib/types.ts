export type ProductUnit = 'unidad' | 'kilo' | 'porcion';
export type OrderType = 'mostrador' | 'delivery' | 'retiro';
export type PaymentMethod = 'efectivo' | 'mercadopago' | 'tarjeta' | 'combinado';
export type PaymentStatus = 'pendiente' | 'pagado';
export type KitchenStatus = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';

export interface Category {
  id: number;
  name: string;
  icon?: string;
  display_order?: number;
}

export interface Product {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  price: number;
  unit_type: ProductUnit;
  available: 0 | 1;
  image_url: string | null;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  unit_type: ProductUnit;
  subtotal: number;
  notes: string;
}

export interface Order {
  id: number;
  order_number: number;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_notes: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  kitchen_status: KitchenStatus;
  total_amount: number;
  cash_paid: number;
  change_amount: number;
  notes: string;
  cash_shift_id: number | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CashShift {
  id: number;
  opened_at: string;
  closed_at: string | null;
  initial_cash: number;
  final_cash_expected: number | null;
  final_cash_counted: number | null;
  notes: string | null;
  status: 'abierta' | 'cerrada';
}

export interface CashMovement {
  id: number;
  cash_shift_id: number;
  type: 'ingreso' | 'egreso';
  amount: number;
  concept: string;
  created_at: string;
}

export interface CashShiftData {
  activeShift: CashShift | null;
  salesSummary?: {
    payment_method: PaymentMethod;
    total_orders: number;
    total_amount: number;
  }[];
  movements?: CashMovement[];
  totals?: {
    initial_cash: number;
    cash_sales: number;
    mp_sales: number;
    card_sales: number;
    combined_sales: number;
    total_sales: number;
    ingresos_extra: number;
    egresos_extra: number;
    expected_cash: number;
  };
}
