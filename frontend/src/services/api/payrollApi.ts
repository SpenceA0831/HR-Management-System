import { apiClient } from './apiClient';
import type {
  PayrollRun,
  Reimbursement,
  ApiResponse
} from '../../types';

/**
 * Payroll API Service
 * Handles payroll history and reimbursement API calls to Google Apps Script backend
 */

// ============================================================================
// PAYROLL HISTORY (ADMIN ONLY)
// ============================================================================

/**
 * Get all payroll history records (ADMIN only)
 * @param filters - Optional filters { year, status }
 */
export async function getPayrollHistory(filters?: {
  year?: number;
  status?: string;
}): Promise<ApiResponse<PayrollRun[]>> {
  const params = filters ? new URLSearchParams(filters as any).toString() : '';
  const action = params ? `getPayrollHistory&${params}` : 'getPayrollHistory';
  return apiClient.get<PayrollRun[]>(action);
}

/**
 * Get a single payroll run by ID (ADMIN only)
 * @param payrollId - Payroll run ID
 */
export async function getPayrollRun(payrollId: string): Promise<ApiResponse<PayrollRun>> {
  return apiClient.get<PayrollRun>(`getPayrollRun&payrollId=${payrollId}`);
}

/**
 * Log a new payroll run (ADMIN only)
 * Supports both PDF import and manual entry
 * @param data - Payroll run data
 */
export async function logPayroll(data: {
  runDate: string;
  checkDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  totalGross: number;
  totalNet: number;
  totalTaxes?: number;
  totalDeductions?: number;
  notes?: string;
  source: 'PDF_Import' | 'Manual';
}): Promise<ApiResponse<PayrollRun>> {
  return apiClient.post<PayrollRun>('logPayroll', data);
}

/**
 * Update payroll status (ADMIN only)
 * Status flow: Draft -> Approved -> Processed
 * @param payrollId - Payroll run ID
 * @param status - New status
 */
export async function updatePayrollStatus(
  payrollId: string,
  status: 'Draft' | 'Approved' | 'Processed'
): Promise<ApiResponse<PayrollRun>> {
  return apiClient.post<PayrollRun>('updatePayrollStatus', { payrollId, status });
}

/**
 * Process approved reimbursements (ADMIN only)
 * Marks selected reimbursements as "Reimbursed" and sets dateReimbursed
 * @param reimbursementIds - Array of reimbursement IDs to process
 * @param dateReimbursed - Date the reimbursements were processed (yyyy-MM-dd)
 */
export async function processReimbursements(
  reimbursementIds: string[],
  dateReimbursed: string
): Promise<ApiResponse<{ processedCount: number; processedIds: string[]; errors?: string[] }>> {
  return apiClient.post('processReimbursements', { reimbursementIds, dateReimbursed });
}

// ============================================================================
// REIMBURSEMENTS
// ============================================================================

/**
 * Get reimbursements with optional filters
 * Role-based: Staff see own, Managers/Admins see all
 * @param filters - Optional filters { status, reimbursementType, userId }
 */
export async function getReimbursements(filters?: {
  status?: string;
  reimbursementType?: string;
  userId?: string;
}): Promise<ApiResponse<Reimbursement[]>> {
  const params = filters ? new URLSearchParams(filters as any).toString() : '';
  const action = params ? `getReimbursements&${params}` : 'getReimbursements';
  return apiClient.get<Reimbursement[]>(action);
}

/**
 * Get a single reimbursement by ID
 * @param reimbursementId - Reimbursement ID
 */
export async function getReimbursement(reimbursementId: string): Promise<ApiResponse<Reimbursement>> {
  return apiClient.get<Reimbursement>(`getReimbursement&reimbursementId=${reimbursementId}`);
}

/**
 * Create a new reimbursement request
 * Any authenticated user can submit
 * @param data - Reimbursement data
 */
export async function createReimbursement(data: {
  expenseDate: string; // yyyy-MM-dd
  description: string;
  amount: number;
  reimbursementType: string; // Section 127, Section 129, or Expense Reimbursement
  methodOfReimbursement?: string; // Defaults to "Payroll Expense Reimbursement"
  notes?: string;
}): Promise<ApiResponse<Reimbursement>> {
  return apiClient.post<Reimbursement>('createReimbursement', data);
}

/**
 * Approve a reimbursement (MANAGER/ADMIN only)
 * Changes status from Pending -> Approved
 * @param reimbursementId - Reimbursement ID
 * @param comment - Optional approval comment
 */
export async function approveReimbursement(
  reimbursementId: string,
  comment?: string
): Promise<ApiResponse<Reimbursement>> {
  return apiClient.post<Reimbursement>('approveReimbursement', { reimbursementId, comment });
}

/**
 * Deny a reimbursement (MANAGER/ADMIN only)
 * Changes status from Pending -> Denied
 * @param reimbursementId - Reimbursement ID
 * @param comment - Required denial reason
 */
export async function denyReimbursement(
  reimbursementId: string,
  comment: string
): Promise<ApiResponse<Reimbursement>> {
  if (!comment) {
    throw new Error('Comment is required when denying a reimbursement');
  }
  return apiClient.post<Reimbursement>('denyReimbursement', { reimbursementId, comment });
}
