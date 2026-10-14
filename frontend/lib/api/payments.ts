import { apiRequest } from "./client";

export interface WalletTransaction {
  id: number;
  user_id: number;
  amount: string;
  transaction_type: "cash_in" | "cash_out";
  bank_transaction_id?: string;
  invoice_number?: string;
  payment_method?: string;
  gateway_reference?: string;
  created_at?: string;
}

export interface PayoutMethod {
  id: number;
  consultant_id: number;
  method_type: "bank_account" | "mobile_banking";
  account_holder_name: string;
  email_address?: string;
  phone_number?: string;
  mobile_bank_type?: string;
  mobile_bank_number?: string;
  bank_name?: string;
  account_number?: string;
  branch_name?: string;
  routing_number?: string;
}

export interface WithdrawalRequest {
  id: number;
  consultant_id: number;
  payout_method_id: number;
  amount: string;
  status: "pending" | "completed" | "rejected";
  notes?: string;
  transaction_reference?: string;
  created_at?: string;
}

export interface BalanceSummary {
  released_balance: string;
  holding_balance: string;
  withdrawable_balance: string;
  minimum_reserve: string;
}

export interface Order {
  id: number;
  user_id: number;
  assessment_id?: number | null;
  order_number: string;
  delivery_status: "pending" | "confirmed" | "in_progress" | "delivered";
  payment_status: "unpaid" | "paid" | "success";
  payment_method?: string;
  subtotal: string;
  total: string;
  bank_transaction_id?: string;
  invoice_number?: string;
  checkout_url?: string;
  payment_reference?: string;
  created_at?: string;
}

export interface CourseOrder {
  id: number;
  user_id: number;
  training_id: number;
  training_title?: string;
  price: string;
  order_number: string;
  bank_transaction_id?: string;
  invoice_number?: string;
  payment_method?: string;
  payment_status: "unpaid" | "paid" | "success";
  created_at?: string;
}

export interface CourseEnrollment {
  id: number;
  user_id: number;
  training_id: number;
  training_title?: string;
  access_enabled: boolean;
  enrollment_type: string;
  deadline?: string;
}

export interface RefundRequest {
  id: number;
  assessment_id: number;
  order_id: number;
  requested_by_id: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "processed";
  admin_notes?: string;
  processed_at?: string | null;
  created_at?: string;
}

export interface AssessmentSettlement {
  id: number;
  assessment_id: number;
  consultant_id: number;
  order_id?: number | null;
  gross_amount: string;
  net_amount: string;
  hold_until: string;
  status: "holding" | "released" | "refunded";
  released_at?: string | null;
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  return apiRequest<WalletTransaction[]>("/api/payments/wallet-transactions/");
}

export async function getPayoutMethods(): Promise<PayoutMethod[]> {
  return apiRequest<PayoutMethod[]>("/api/payments/payout-methods/");
}

export async function createPayoutMethod(data: Partial<PayoutMethod>): Promise<PayoutMethod> {
  return apiRequest<PayoutMethod>("/api/payments/payout-methods/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updatePayoutMethod(id: number, data: Partial<PayoutMethod>): Promise<PayoutMethod> {
  return apiRequest<PayoutMethod>(`/api/payments/payout-methods/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deletePayoutMethod(id: number): Promise<void> {
  return apiRequest<void>(`/api/payments/payout-methods/${id}/`, { method: "DELETE" });
}

export async function getWithdrawals(): Promise<WithdrawalRequest[]> {
  return apiRequest<WithdrawalRequest[]>("/api/payments/withdrawals/");
}

export async function createWithdrawal(data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest> {
  return apiRequest<WithdrawalRequest>("/api/payments/withdrawals/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getBalanceSummary(): Promise<BalanceSummary> {
  return apiRequest<BalanceSummary>("/api/payments/withdrawals/balance-summary/");
}

export async function getOrders(): Promise<Order[]> {
  return apiRequest<Order[]>("/api/payments/orders/");
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  return apiRequest<Order>("/api/payments/orders/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getCourseOrders(): Promise<CourseOrder[]> {
  return apiRequest<CourseOrder[]>("/api/payments/course-orders/");
}

export async function createCourseOrder(data: Partial<CourseOrder>): Promise<CourseOrder> {
  return apiRequest<CourseOrder>("/api/payments/course-orders/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getEnrollments(): Promise<CourseEnrollment[]> {
  return apiRequest<CourseEnrollment[]>("/api/payments/course-enrollments/");
}

export async function getRefundRequests(): Promise<RefundRequest[]> {
  return apiRequest<RefundRequest[]>("/api/payments/refund-requests/");
}

export async function createRefundRequest(data: Partial<RefundRequest>): Promise<RefundRequest> {
  return apiRequest<RefundRequest>("/api/payments/refund-requests/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getAssessmentSettlements(): Promise<AssessmentSettlement[]> {
  return apiRequest<AssessmentSettlement[]>("/api/payments/settlements/");
}

export interface TopupResponse extends Order {
  payment_configured?: boolean;
  message?: string;
}

export async function createTopupOrder(amount: number | string): Promise<TopupResponse> {
  return apiRequest<TopupResponse>("/api/payments/orders/", {
    method: "POST",
    body: JSON.stringify({ topup_amount: String(amount) }),
  });
}
