// ============================================================================
// SHARED TYPES
// ============================================================================

export type UserRole = 'STAFF' | 'MANAGER' | 'ADMIN';

export type RoleType =
  | 'ORGANIZER'
  | 'OPS_MANAGER'
  | 'COMMS_MANAGER'
  | 'DEVELOPMENT'
  | 'DEPUTY_DIRECTOR'
  | 'EXECUTIVE_DIRECTOR';

export type EmploymentType = 'Full Time' | 'Part Time';

export interface User {
  id: string;
  name: string;
  email: string;

  // Unified permissions
  userRole: UserRole;

  // Org structure
  teamId: string;
  managerId?: string;

  // PTO specific
  employmentType: EmploymentType;
  hireDate: string; // yyyy-MM-dd

  // Evaluation specific
  roleType: RoleType;

  // UI
  avatar?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PTO MODULE TYPES
// ============================================================================

export type PtoType = 'Vacation' | 'Sick' | 'Other';

export type PtoStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Denied'
  | 'ChangesRequested'
  | 'Cancelled';

export interface AuditTrail {
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  note?: string;
}

export interface PtoRequest {
  id: string;
  userId: string;
  userName: string;
  type: PtoType;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  isHalfDayStart: boolean;
  isHalfDayEnd: boolean;
  totalHours: number;
  reason?: string;
  attachment?: string;
  status: PtoStatus;
  managerComment?: string;
  employeeComment?: string;
  approverId: string;
  approverName: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  history: AuditTrail[];
}

export interface PtoBalance {
  userId: string;
  year: number;
  totalHours: number; // Total yearly allocation
  availableHours: number; // Calculated: totalHours - usedHours - pendingHours (deprecated, use totalHours)
  usedHours: number;
  pendingHours: number;
}

export interface Holiday {
  id: string;
  date: string; // yyyy-MM-dd (start date)
  endDate?: string; // yyyy-MM-dd (optional end date for multi-day holidays)
  name: string;
}

export interface BlackoutDate {
  id: string;
  date: string; // yyyy-MM-dd (start date)
  endDate?: string; // yyyy-MM-dd (optional end date for multi-day blackout periods)
  name: string;
  createdBy?: string;
  createdAt?: string; // ISO 8601
}

export interface SystemConfig {
  defaultFullTimeHours: number;
  defaultPartTimeHours: number;
  prorateByHireDate: boolean;
  fullTeamCalendarVisible: boolean;
  shortNoticeThresholdDays: number;
  sharedCalendarId: string;
}

// ============================================================================
// PAYROLL MODULE TYPES
// ============================================================================

export type PayrollStatus = 'Pending' | 'Draft' | 'Approved' | 'Processed';

export type PayrollSource = 'PDF_Import' | 'Manual';

export interface PayrollRun {
  id: string;
  runDate: string; // yyyy-MM-dd
  checkDate: string; // yyyy-MM-dd
  payPeriodStart: string; // yyyy-MM-dd
  payPeriodEnd: string; // yyyy-MM-dd
  totalGross: number;
  totalNet: number;
  totalTaxes: number;
  totalDeductions: number;
  status: PayrollStatus;
  processedBy: string; // email
  notes?: string;
  source: PayrollSource;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type ReimbursementStatus = 'Pending' | 'Approved' | 'Reimbursed' | 'Denied';

export type ReimbursementType =
  | 'Section 129 Plan - Dependent Care'
  | 'Section 127 Plan - Educational Assistance'
  | 'Expense Reimbursement';

export type ReimbursementMethod =
  | 'Payroll Expense Reimbursement'
  | 'Check'
  | 'Direct Deposit';

export interface Reimbursement {
  id: string;
  staffName: string;
  staffEmail: string;
  expenseDate: string; // yyyy-MM-dd - When expense was incurred
  description: string;
  amount: number;
  reimbursementType: ReimbursementType;
  methodOfReimbursement: ReimbursementMethod;
  status: ReimbursementStatus;
  submittedAt: string; // ISO 8601
  dateReimbursed?: string; // yyyy-MM-dd - When actually reimbursed via payroll
  reviewerId?: string;
  reviewerName?: string;
  notes?: string; // Includes attachment references
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================================================
// EVALUATION MODULE TYPES
// ============================================================================

export type EvaluationType =
  | 'QUARTERLY_SELF'
  | 'MID_YEAR_REVIEW'
  | 'PEER_REVIEW'
  | 'ANNUAL_REVIEW';

export type EvaluationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Peer-Review'
  | 'Manager-Review'
  | 'Approved'
  | 'Complete';

export type RatingType = 'SELF' | 'PEER' | 'MANAGER';

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export type CompetencyCategory = 'Org-Wide' | 'Role-Specific';

export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Deferred';

export type PeerReviewStatus = 'Pending' | 'In Progress' | 'Complete';

export type CycleStatus = 'Upcoming' | 'Active' | 'Complete';

export interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  type: EvaluationType;
  deadline: string; // yyyy-MM-dd
  selfDeadline?: string;
  peerDeadline?: string;
  managerDeadline?: string;
  status: CycleStatus;
}

export interface Evaluation {
  id: string;
  employeeId: string;
  cycleId: string;
  type: EvaluationType;
  status: EvaluationStatus;
  selfRatings: Rating[];
  peerRatings: Rating[];
  managerRatings: Rating[];
  goals: Goal[];
  overallSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: string;
  evaluationId: string;
  ratingType: RatingType;
  competencyId: string;
  score: RatingValue;
  comments?: string;
  reviewerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  evaluationId: string;
  description: string;
  status: GoalStatus;
  achievements?: string;
  challenges?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  category: CompetencyCategory;
  roleType?: RoleType; // Only for role-specific competencies
  isCustom: boolean;
  createdAt: string;
}

export interface PeerReviewRequest {
  id: string;
  evaluationId: string;
  reviewerId: string;
  targetUserId: string;
  targetUserName: string;
  status: PeerReviewStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
}

// ============================================================================
// APP STATE TYPES
// ============================================================================

export type AppModule = 'pto' | 'evaluations' | 'payroll' | 'admin';

export type ThemeMode = 'light' | 'dark';
