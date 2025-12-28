/**
 * Configuration file for HR Management System (Google Apps Script backend)
 * Contains sheet names, column mappings, and constants for both PTO and Evaluations modules
 */

// Get Spreadsheet ID from Script Properties
// Set via: File > Project settings > Script properties > Add property: SPREADSHEET_ID
function getSpreadsheetId() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID not configured in Script Properties');
  }

  return spreadsheetId;
}

// Sheet names
const SHEET_NAMES = {
  // Shared
  USERS: 'Users',

  // PTO Module
  PTO_REQUESTS: 'PtoRequests',
  PTO_BALANCES: 'PtoBalances',
  HOLIDAYS: 'Holidays',
  BLACKOUT_DATES: 'BlackoutDates',
  SYSTEM_CONFIG: 'SystemConfig',

  // Evaluation Module
  EVALUATIONS: 'Evaluations',
  EVALUATION_CYCLES: 'EvaluationCycles',
  RATINGS: 'Ratings',
  GOALS: 'Goals',
  PEER_REVIEW_REQUESTS: 'PeerReviewRequests',
  COMPETENCIES: 'Competencies'
};

// Column mappings for each sheet (0-indexed)
const COLUMN_MAPS = {
  USERS: {
    id: 0,
    name: 1,
    email: 2,
    userRole: 3,          // STAFF | MANAGER | ADMIN
    teamId: 4,
    managerId: 5,
    employmentType: 6,    // Full Time | Part Time
    hireDate: 7,          // yyyy-MM-dd
    roleType: 8,          // For evaluations
    avatar: 9,
    createdAt: 10,
    updatedAt: 11
  },

  PTO_REQUESTS: {
    id: 0,
    userId: 1,
    userName: 2,
    type: 3,              // Vacation | Sick | Other
    startDate: 4,
    endDate: 5,
    isHalfDayStart: 6,
    isHalfDayEnd: 7,
    totalHours: 8,
    reason: 9,
    attachment: 10,
    status: 11,
    managerComment: 12,
    employeeComment: 13,
    approverId: 14,
    approverName: 15,
    createdAt: 16,
    updatedAt: 17,
    history: 18           // JSON string of AuditTrail[]
  },

  PTO_BALANCES: {
    userId: 0,
    year: 1,
    availableHours: 2,
    usedHours: 3,
    pendingHours: 4
  },

  HOLIDAYS: {
    id: 0,
    date: 1,              // yyyy-MM-dd
    name: 2
  },

  BLACKOUT_DATES: {
    id: 0,
    date: 1,              // yyyy-MM-dd
    name: 2,
    createdBy: 3,
    createdAt: 4
  },

  SYSTEM_CONFIG: {
    defaultFullTimeHours: 0,
    defaultPartTimeHours: 1,
    prorateByHireDate: 2,
    fullTeamCalendarVisible: 3,
    shortNoticeThresholdDays: 4
  },

  EVALUATIONS: {
    id: 0,
    employeeId: 1,
    cycleId: 2,
    type: 3,
    status: 4,
    overallSummary: 5,
    createdAt: 6,
    updatedAt: 7
  },

  EVALUATION_CYCLES: {
    id: 0,
    name: 1,
    year: 2,
    type: 3,
    deadline: 4,
    selfDeadline: 5,
    peerDeadline: 6,
    managerDeadline: 7,
    status: 8
  },

  RATINGS: {
    id: 0,
    evaluationId: 1,
    ratingType: 2,
    competencyId: 3,
    score: 4,
    comments: 5,
    reviewerId: 6,
    createdAt: 7,
    updatedAt: 8
  },

  GOALS: {
    id: 0,
    evaluationId: 1,
    description: 2,
    status: 3,
    achievements: 4,
    challenges: 5,
    createdAt: 6,
    updatedAt: 7
  },

  PEER_REVIEW_REQUESTS: {
    id: 0,
    evaluationId: 1,
    reviewerId: 2,
    targetUserId: 3,
    targetUserName: 4,
    status: 5,
    createdAt: 6,
    updatedAt: 7
  },

  COMPETENCIES: {
    id: 0,
    name: 1,
    description: 2,
    category: 3,
    roleType: 4,
    isCustom: 5,
    createdAt: 6
  }
};

// ============================================================================
// ENUMS matching frontend TypeScript types
// ============================================================================

// Shared
const USER_ROLES = {
  STAFF: 'STAFF',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN'
};

const ROLE_TYPES = {
  ORGANIZER: 'ORGANIZER',
  OPS_MANAGER: 'OPS_MANAGER',
  COMMS_MANAGER: 'COMMS_MANAGER',
  DEVELOPMENT: 'DEVELOPMENT',
  DEPUTY_DIRECTOR: 'DEPUTY_DIRECTOR',
  EXECUTIVE_DIRECTOR: 'EXECUTIVE_DIRECTOR'
};

const EMPLOYMENT_TYPES = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time'
};

// PTO Module
const PTO_TYPES = {
  VACATION: 'Vacation',
  SICK: 'Sick',
  OTHER: 'Other'
};

const PTO_STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DENIED: 'Denied',
  CHANGES_REQUESTED: 'ChangesRequested',
  CANCELLED: 'Cancelled'
};

// Evaluation Module
const EVALUATION_TYPES = {
  QUARTERLY_SELF: 'QUARTERLY_SELF',
  MID_YEAR_REVIEW: 'MID_YEAR_REVIEW',
  PEER_REVIEW: 'PEER_REVIEW',
  ANNUAL_REVIEW: 'ANNUAL_REVIEW'
};

const EVALUATION_STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PEER_REVIEW: 'Peer-Review',
  MANAGER_REVIEW: 'Manager-Review',
  APPROVED: 'Approved',
  COMPLETE: 'Complete'
};

const RATING_TYPES = {
  SELF: 'SELF',
  PEER: 'PEER',
  MANAGER: 'MANAGER'
};

const GOAL_STATUSES = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DEFERRED: 'Deferred'
};

const PEER_REQUEST_STATUSES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETE: 'Complete'
};

const CYCLE_STATUSES = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  COMPLETE: 'Complete'
};

// Workflow status sequences for evaluations
const WORKFLOW_STATUS_SEQUENCES = {
  'QUARTERLY_SELF': ['Draft', 'Submitted', 'Complete'],
  'MID_YEAR_REVIEW': ['Draft', 'Submitted', 'Manager-Review', 'Approved', 'Complete'],
  'PEER_REVIEW': ['Draft', 'Complete'],
  'ANNUAL_REVIEW': ['Draft', 'Submitted', 'Peer-Review', 'Manager-Review', 'Complete']
};

// Export for other scripts (Apps Script doesn't use module.exports, but keeping for reference)
if (typeof module !== 'undefined') {
  module.exports = {
    SHEET_NAMES,
    COLUMN_MAPS,
    USER_ROLES,
    ROLE_TYPES,
    EMPLOYMENT_TYPES,
    PTO_TYPES,
    PTO_STATUSES,
    EVALUATION_TYPES,
    EVALUATION_STATUSES,
    RATING_TYPES,
    GOAL_STATUSES,
    PEER_REQUEST_STATUSES,
    CYCLE_STATUSES,
    WORKFLOW_STATUS_SEQUENCES,
    getSpreadsheetId
  };
}
