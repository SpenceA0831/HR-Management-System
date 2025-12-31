import type {
  EvaluationType,
  EvaluationStatus,
  RatingType,
  RoleType,
  Competency,
} from '../types';

// ============================================================================
// EVALUATION WORKFLOW CONFIGURATION
// ============================================================================

/**
 * Defines which assessment components are required for each evaluation type
 * SELF = Self-assessment by employee
 * PEER = Peer review by colleagues
 * MANAGER = Manager review
 */
export const EVALUATION_WORKFLOW_COMPONENTS: Record<EvaluationType, RatingType[]> = {
  QUARTERLY_SELF: ['SELF'],
  MID_YEAR_REVIEW: ['SELF', 'MANAGER'],
  PEER_REVIEW: ['PEER'],
  ANNUAL_REVIEW: ['SELF', 'PEER', 'MANAGER'],
};

/**
 * Defines the workflow status sequence for each evaluation type
 * This determines the progression of statuses as the evaluation moves through its lifecycle
 */
export const WORKFLOW_STATUS_SEQUENCES: Record<EvaluationType, EvaluationStatus[]> = {
  QUARTERLY_SELF: ['Draft', 'Submitted', 'Complete'],
  MID_YEAR_REVIEW: ['Draft', 'Submitted', 'Manager-Review', 'Approved', 'Complete'],
  PEER_REVIEW: ['Draft', 'Complete'],
  ANNUAL_REVIEW: ['Draft', 'Submitted', 'Peer-Review', 'Manager-Review', 'Complete'],
};

// ============================================================================
// RATING LABELS
// ============================================================================

/**
 * Standardized rating labels and descriptions for 1-5 scale
 * Used across all evaluation types to ensure consistent interpretation
 */
export const RATING_LABELS: Record<number, { label: string; description: string }> = {
  1: {
    label: 'Beginning',
    description: 'Still developing this capability; needs significant support',
  },
  2: {
    label: 'Developing',
    description: 'Shows emerging capability; requires regular coaching',
  },
  3: {
    label: 'Proficient',
    description: 'Consistently demonstrates capability; meets expectations',
  },
  4: {
    label: 'Strong',
    description: 'Exceeds expectations; serves as resource for others',
  },
  5: {
    label: 'Exemplary',
    description: 'Models excellence; could mentor others organization-wide',
  },
};

// ============================================================================
// ORGANIZATIONAL COMPETENCIES
// ============================================================================

/**
 * Organization-wide competencies that apply to all staff members
 * These are universal skills and values expected across the organization
 */
export const ORG_WIDE_COMPETENCIES: Omit<Competency, 'id' | 'isCustom' | 'createdAt'>[] = [
  {
    name: 'Communication',
    description:
      'Shares information clearly and timely; practices active listening; keeps colleagues informed.',
    category: 'Org-Wide',
  },
  {
    name: 'Teamwork & Collaboration',
    description:
      'Works effectively across roles; contributes positively to team culture; follows through on commitments.',
    category: 'Org-Wide',
  },
  {
    name: 'Mission & Values Alignment',
    description:
      'Demonstrates commitment to educational equity and parent empowerment; advances DEI principles.',
    category: 'Org-Wide',
  },
];

// ============================================================================
// ROLE-SPECIFIC COMPETENCIES
// ============================================================================

/**
 * Role-specific competencies mapped to each role type
 * These are specialized skills required for specific positions
 */
export const ROLE_SPECIFIC_COMPETENCIES: Record<
  RoleType,
  Omit<Competency, 'id' | 'isCustom' | 'createdAt'>[]
> = {
  STAFF: [
    {
      name: 'Task Execution',
      description: 'Completes assigned tasks accurately and on time.',
      category: 'Role-Specific',
      roleType: 'STAFF',
    },
    {
      name: 'Initiative',
      description: 'Proactively identifies and addresses needs within scope of role.',
      category: 'Role-Specific',
      roleType: 'STAFF',
    },
    {
      name: 'Professional Development',
      description: 'Actively seeks learning opportunities and applies new skills.',
      category: 'Role-Specific',
      roleType: 'STAFF',
    },
  ],
  MANAGER: [
    {
      name: 'Team Leadership',
      description: 'Provides clear direction and support to direct reports.',
      category: 'Role-Specific',
      roleType: 'MANAGER',
    },
    {
      name: 'Performance Management',
      description: 'Conducts regular reviews and provides actionable feedback.',
      category: 'Role-Specific',
      roleType: 'MANAGER',
    },
    {
      name: 'Resource Allocation',
      description: 'Effectively manages team workload and project priorities.',
      category: 'Role-Specific',
      roleType: 'MANAGER',
    },
  ],
  ADMIN: [
    {
      name: 'Strategic Oversight',
      description: 'Ensures organizational systems support long-term goals.',
      category: 'Role-Specific',
      roleType: 'ADMIN',
    },
    {
      name: 'Policy Development',
      description: 'Creates and maintains effective organizational policies.',
      category: 'Role-Specific',
      roleType: 'ADMIN',
    },
    {
      name: 'Cross-Functional Coordination',
      description: 'Facilitates collaboration across departments and initiatives.',
      category: 'Role-Specific',
      roleType: 'ADMIN',
    },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all competencies for a specific role (org-wide + role-specific)
 */
export function getCompetenciesForRole(
  roleType: RoleType
): Omit<Competency, 'id' | 'isCustom' | 'createdAt'>[] {
  return [...ORG_WIDE_COMPETENCIES, ...(ROLE_SPECIFIC_COMPETENCIES[roleType] || [])];
}

/**
 * Get the color for a specific rating value (for UI chips/badges)
 */
export function getRatingColor(score: number): 'error' | 'warning' | 'default' | 'info' | 'success' {
  if (score <= 1) return 'error';
  if (score <= 2) return 'warning';
  if (score <= 3) return 'default';
  if (score <= 4) return 'info';
  return 'success';
}

/**
 * Get the status display label for evaluation status
 */
export function getStatusLabel(status: EvaluationStatus): string {
  const labelMap: Record<EvaluationStatus, string> = {
    Draft: 'Drafting',
    Submitted: 'Submitted for Review',
    'Peer-Review': 'Peer Review in Progress',
    'Manager-Review': 'Manager Review in Progress',
    Approved: 'Approved',
    Complete: 'Complete',
  };
  return labelMap[status] || status;
}

/**
 * Get the color for status chips
 */
export function getStatusColor(
  status: EvaluationStatus
): 'default' | 'warning' | 'info' | 'success' {
  switch (status) {
    case 'Draft':
      return 'warning';
    case 'Submitted':
    case 'Peer-Review':
    case 'Manager-Review':
      return 'info';
    case 'Approved':
    case 'Complete':
      return 'success';
    default:
      return 'default';
  }
}
