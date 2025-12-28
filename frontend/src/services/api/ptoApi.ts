import { apiClient } from './apiClient';
import type {
  PtoRequest,
  PtoBalance,
  Holiday,
  BlackoutDate,
  SystemConfig,
  ApiResponse
} from '../../types';

/**
 * PTO API Service
 * Handles all PTO-related API calls to Google Apps Script backend
 */

// ============================================================================
// PTO Requests
// ============================================================================

export async function getPtoRequests(filters?: {
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<PtoRequest[]>> {
  const params = new URLSearchParams(filters as any).toString();
  const action = params ? `getPtoRequests&${params}` : 'getPtoRequests';
  return apiClient.get<PtoRequest[]>(action);
}

export async function getPtoRequest(requestId: string): Promise<ApiResponse<PtoRequest>> {
  return apiClient.get<PtoRequest>(`getPtoRequest&requestId=${requestId}`);
}

export async function createPtoRequest(data: {
  type: string;
  startDate: string;
  endDate: string;
  isHalfDayStart: boolean;
  isHalfDayEnd: boolean;
  reason?: string;
  attachment?: string;
}): Promise<ApiResponse<PtoRequest>> {
  return apiClient.post<PtoRequest>('createPtoRequest', data);
}

export async function updatePtoRequest(
  requestId: string,
  updates: Partial<PtoRequest>
): Promise<ApiResponse<PtoRequest>> {
  return apiClient.post<PtoRequest>('updatePtoRequest', {
    requestId,
    updates,
  });
}

export async function approvePtoRequest(
  requestId: string,
  comment?: string
): Promise<ApiResponse<PtoRequest>> {
  return apiClient.post<PtoRequest>('approvePtoRequest', {
    requestId,
    comment,
  });
}

export async function denyPtoRequest(
  requestId: string,
  comment: string
): Promise<ApiResponse<PtoRequest>> {
  return apiClient.post<PtoRequest>('denyPtoRequest', {
    requestId,
    comment,
  });
}

export async function cancelPtoRequest(requestId: string): Promise<ApiResponse<PtoRequest>> {
  return apiClient.post<PtoRequest>('cancelPtoRequest', { requestId });
}

// ============================================================================
// PTO Balance
// ============================================================================

export async function getPtoBalance(
  userId?: string,
  year?: number
): Promise<ApiResponse<PtoBalance>> {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (year) params.set('year', year.toString());

  const action = params.toString() ? `getPtoBalance&${params.toString()}` : 'getPtoBalance';
  return apiClient.get<PtoBalance>(action);
}

// ============================================================================
// Holidays
// ============================================================================

export async function getHolidays(): Promise<ApiResponse<Holiday[]>> {
  return apiClient.get<Holiday[]>('getHolidays');
}

export async function createHoliday(data: {
  date: string;
  name: string;
}): Promise<ApiResponse<Holiday>> {
  return apiClient.post<Holiday>('createHoliday', data);
}

export async function deleteHoliday(holidayId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient.post<{ deleted: boolean }>('deleteHoliday', { holidayId });
}

// ============================================================================
// Blackout Dates
// ============================================================================

export async function getBlackoutDates(): Promise<ApiResponse<BlackoutDate[]>> {
  return apiClient.get<BlackoutDate[]>('getBlackoutDates');
}

export async function createBlackoutDate(data: {
  date: string;
  name: string;
}): Promise<ApiResponse<BlackoutDate>> {
  return apiClient.post<BlackoutDate>('createBlackoutDate', data);
}

export async function deleteBlackoutDate(
  blackoutId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient.post<{ deleted: boolean }>('deleteBlackoutDate', { blackoutId });
}

// ============================================================================
// System Config
// ============================================================================

export async function getSystemConfig(): Promise<ApiResponse<SystemConfig>> {
  return apiClient.get<SystemConfig>('getSystemConfig');
}

export async function updateSystemConfig(
  config: Partial<SystemConfig>
): Promise<ApiResponse<SystemConfig>> {
  return apiClient.post<SystemConfig>('updateSystemConfig', config);
}
