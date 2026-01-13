import { apiClient } from './apiClient';
import type {
  PtoRequest,
  PtoBalance,
  Holiday,
  BlackoutDate,
  SystemConfig,
  ApiResponse
} from '../../types';
// Mock data imports disabled - using real backend
// import {
//   mockSystemConfig,
//   mockHolidays,
//   mockBlackoutDates,
//   mockPtoBalance,
//   mockPtoRequests,
//   generateId,
// } from './mockData';

/**
 * PTO API Service
 * Handles all PTO-related API calls to Google Apps Script backend
 */

// Constants disabled to avoid unused variable errors
// const API_BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
// const USE_MOCK_DATA = false; // Disabled - using real backend

// Mock data storage disabled
// let mockHolidayData = [...mockHolidays];
// let mockBlackoutData = [...mockBlackoutDates];
// let mockConfigData = { ...mockSystemConfig };

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
  status?: string;
}): Promise<ApiResponse<PtoRequest>> {
  /*
  if (USE_MOCK_DATA) {
    const { mockDemoUser } = await import('./mockData');
    const now = new Date().toISOString();
    const newRequest: PtoRequest = {
      id: generateId(),
      userId: mockDemoUser.id,
      userName: mockDemoUser.name,
      type: data.type as any,
      startDate: data.startDate,
      endDate: data.endDate,
      isHalfDayStart: data.isHalfDayStart,
      isHalfDayEnd: data.isHalfDayEnd,
      totalDays: 0, // Will be calculated by backend normally
      reason: data.reason,
      status: (data.status as any) || 'Draft', // Use the provided status or default to Draft
      approverId: '',
      approverName: '',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          action: data.status === 'Submitted' ? 'submitted' : 'created',
          timestamp: now,
          actorId: mockDemoUser.id,
          actorName: mockDemoUser.name,
          note: `Request ${data.status === 'Submitted' ? 'submitted for approval' : 'created as draft'}`,
        },
      ],
    };

    // Add to mock data (in a real app, this would persist)
    mockPtoRequests.push(newRequest);

    return Promise.resolve({
      success: true,
      data: newRequest,
    });
  }
  */
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
  /*
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      success: true,
      data: mockPtoBalance,
    });
  }
  */

  // Default to 2026 for testing with current data
  // TODO: Revert to dynamic year detection after testing
  if (!year) {
    year = 2026;
  }

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
  /*
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      success: true,
      data: mockHolidayData,
    });
  }
  */
  return apiClient.get<Holiday[]>('getHolidays');
}

export async function createHoliday(data: {
  date: string;
  endDate?: string;
  name: string;
}): Promise<ApiResponse<Holiday>> {
  /*
  if (USE_MOCK_DATA) {
    const newHoliday: Holiday = {
      id: generateId(),
      date: data.date,
      endDate: data.endDate,
      name: data.name,
    };
    mockHolidayData.push(newHoliday);
    return Promise.resolve({
      success: true,
      data: newHoliday,
    });
  }
  */
  return apiClient.post<Holiday>('createHoliday', data);
}

export async function deleteHoliday(holidayId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  /*
  if (USE_MOCK_DATA) {
    mockHolidayData = mockHolidayData.filter((h) => h.id !== holidayId);
    return Promise.resolve({
      success: true,
      data: { deleted: true },
    });
  }
  */
  return apiClient.post<{ deleted: boolean }>('deleteHoliday', { holidayId });
}

// ============================================================================
// Blackout Dates
// ============================================================================

export async function getBlackoutDates(): Promise<ApiResponse<BlackoutDate[]>> {
  /*
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      success: true,
      data: mockBlackoutData,
    });
  }
  */
  return apiClient.get<BlackoutDate[]>('getBlackoutDates');
}

export async function createBlackoutDate(data: {
  date: string;
  endDate?: string;
  name: string;
}): Promise<ApiResponse<BlackoutDate>> {
  /*
  if (USE_MOCK_DATA) {
    const newBlackout: BlackoutDate = {
      id: generateId(),
      date: data.date,
      endDate: data.endDate,
      name: data.name,
    };
    mockBlackoutData.push(newBlackout);
    return Promise.resolve({
      success: true,
      data: newBlackout,
    });
  }
  */
  return apiClient.post<BlackoutDate>('createBlackoutDate', data);
}

export async function deleteBlackoutDate(
  blackoutId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  /*
  if (USE_MOCK_DATA) {
    mockBlackoutData = mockBlackoutData.filter((b) => b.id !== blackoutId);
    return Promise.resolve({
      success: true,
      data: { deleted: true },
    });
  }
  */
  return apiClient.post<{ deleted: boolean }>('deleteBlackoutDate', { blackoutId });
}

// ============================================================================
// System Config
// ============================================================================

export async function getSystemConfig(): Promise<ApiResponse<SystemConfig>> {
  /*
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      success: true,
      data: mockConfigData,
    });
  }
  */
  return apiClient.get<SystemConfig>('getSystemConfig');
}

export async function updateSystemConfig(
  config: Partial<SystemConfig>
): Promise<ApiResponse<SystemConfig>> {
  /*
  if (USE_MOCK_DATA) {
    mockConfigData = { ...mockConfigData, ...config };
    return Promise.resolve({
      success: true,
      data: mockConfigData,
    });
  }
  */
  return apiClient.post<SystemConfig>('updateSystemConfig', config);
}
