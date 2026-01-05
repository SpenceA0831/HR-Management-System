import type {
  SystemConfig,
  Holiday,
  BlackoutDate,
  PtoRequest,
  PtoBalance,
  User
} from '../../types';

// Mock System Configuration
export const mockSystemConfig: SystemConfig = {
  defaultFullTimeHours: 160,
  defaultPartTimeHours: 80,
  prorateByHireDate: true,
  fullTeamCalendarVisible: true,
  shortNoticeThresholdDays: 14,
  sharedCalendarId: 'mock-calendar-id',
};

// Mock Holidays
export const mockHolidays: Holiday[] = [
  {
    id: '1',
    date: '2025-01-01',
    name: "New Year's Day",
  },
  {
    id: '2',
    date: '2025-07-04',
    name: 'Independence Day',
  },
  {
    id: '3',
    date: '2025-12-24',
    endDate: '2025-12-26',
    name: 'Christmas Holiday',
  },
  {
    id: '4',
    date: '2025-11-27',
    endDate: '2025-11-28',
    name: 'Thanksgiving Holiday',
  },
  {
    id: '5',
    date: '2025-09-01',
    name: 'Labor Day',
  },
];

// Mock Blackout Dates
export const mockBlackoutDates: BlackoutDate[] = [
  {
    id: '1',
    date: '2025-12-15',
    endDate: '2025-12-31',
    name: 'Year-End Close',
  },
  {
    id: '2',
    date: '2025-06-28',
    endDate: '2025-06-30',
    name: 'Q2 Financial Close',
  },
  {
    id: '3',
    date: '2025-03-15',
    name: 'Annual Company Meeting',
  },
];

// Mock PTO Balance
export const mockPtoBalance: PtoBalance = {
  userId: 'demo-user-id',
  year: 2025,
  totalHours: 120,
  availableHours: 120, // Deprecated, use totalHours
  usedHours: 24,
  pendingHours: 16,
};

// Mock PTO Requests
export const mockPtoRequests: PtoRequest[] = [
  {
    id: '1',
    userId: 'demo-user-id',
    userName: 'Demo User',
    type: 'Vacation',
    startDate: '2025-02-10',
    endDate: '2025-02-14',
    totalHours: 40,
    isHalfDayStart: false,
    isHalfDayEnd: false,
    reason: 'Family vacation',
    status: 'Approved',
    approverId: 'manager-id',
    approverName: 'Manager',
    createdAt: '2025-01-15',
    updatedAt: '2025-01-16',
    history: [
      {
        action: 'created',
        timestamp: '2025-01-15T10:00:00Z',
        actorId: 'demo-user-id',
        actorName: 'Demo User',
        note: 'Request created',
      },
      {
        action: 'submitted',
        timestamp: '2025-01-15T10:05:00Z',
        actorId: 'demo-user-id',
        actorName: 'Demo User',
        note: 'Request submitted for approval',
      },
      {
        action: 'approved',
        timestamp: '2025-01-16T09:00:00Z',
        actorId: 'manager-id',
        actorName: 'Manager',
        note: 'Request approved',
      },
    ],
  },
  {
    id: '2',
    userId: 'demo-user-id',
    userName: 'Demo User',
    type: 'Sick',
    startDate: '2025-01-20',
    endDate: '2025-01-20',
    totalHours: 8,
    isHalfDayStart: false,
    isHalfDayEnd: false,
    reason: 'Doctor appointment',
    status: 'Submitted',
    approverId: 'manager-id',
    approverName: 'Manager',
    createdAt: '2025-01-19',
    updatedAt: '2025-01-19',
    history: [
      {
        action: 'created',
        timestamp: '2025-01-19T08:00:00Z',
        actorId: 'demo-user-id',
        actorName: 'Demo User',
        note: 'Request created',
      },
      {
        action: 'submitted',
        timestamp: '2025-01-19T08:05:00Z',
        actorId: 'demo-user-id',
        actorName: 'Demo User',
        note: 'Request submitted for approval',
      },
    ],
  },
];

// Mock current user
export const mockDemoUser: User = {
  id: 'demo-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  userRole: 'STAFF',
  teamId: 'team-1',
  managerId: 'manager-id',
  employmentType: 'Full Time',
  hireDate: '2024-01-15',
  roleType: 'DEVELOPMENT',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Helper to generate unique IDs
let idCounter = 100;
export function generateId(): string {
  return `mock-${Date.now()}-${idCounter++}`;
}
