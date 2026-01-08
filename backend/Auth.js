/**
 * Authentication and Authorization functions
 * Handles Google Workspace authentication and row-level security for both PTO and Evaluations
 */

/**
 * Get the currently authenticated user's email
 * Supports demo mode via demoEmail parameter
 * @param {Object} e - Event object with parameters (optional)
 * @returns {string} User email or null
 */
function getCurrentUserEmail(e) {
  // Demo mode: Check for demoEmail parameter first
  if (e && e.parameter && e.parameter.demoEmail) {
    return e.parameter.demoEmail;
  }

  // POST request: Check postData for demoEmail
  if (e && e.postData && e.postData.contents) {
    try {
      const payload = JSON.parse(e.postData.contents);
      if (payload.demoEmail) {
        return payload.demoEmail;
      }
    } catch (parseError) {
      // Continue to Google session if parsing fails
    }
  }

  // Production mode: Use Google session
  try {
    const userEmail = Session.getActiveUser().getEmail();
    return userEmail || null;
  } catch (error) {
    Logger.log('Error getting active user: ' + error.message);
    return null;
  }
}

/**
 * Get user by their Google account email
 * @param {string} email - User's email address
 * @returns {Object|null} User object or null if not found
 */
function getUserByEmail(email) {
  if (!email) {
    return null;
  }

  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return null; // No users
  }

  const colMap = COLUMN_MAPS.USERS;

  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][colMap.email];
    if (rowEmail && rowEmail.toLowerCase() === email.toLowerCase()) {
      return rowToUser(colMap, data[i]);
    }
  }

  return null;
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object|null} User object or null if not found
 */
function getUserById(userId) {
  if (!userId) {
    return null;
  }

  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return null;
  }

  const colMap = COLUMN_MAPS.USERS;

  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap.id] === userId) {
      return rowToUser(colMap, data[i]);
    }
  }

  return null;
}

/**
 * Get all user IDs who are direct reports of a manager
 * @param {string} managerId - Manager's user ID
 * @returns {Array<string>} Array of user IDs
 */
function getDirectReportIds(managerId) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return [];
  }

  const colMap = COLUMN_MAPS.USERS;
  const reportIds = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap.managerId] === managerId) {
      reportIds.push(data[i][colMap.id]);
    }
  }

  return reportIds;
}

/**
 * Check if a user is an admin
 * @param {Object} user - User object
 * @returns {boolean} True if user is admin
 */
function isAdmin(user) {
  return user && user.userRole === USER_ROLES.ADMIN;
}

/**
 * Check if a user is a manager
 * @param {Object} user - User object
 * @returns {boolean} True if user is manager or admin
 */
function isManager(user) {
  return user && (user.userRole === USER_ROLES.MANAGER || user.userRole === USER_ROLES.ADMIN);
}

// ============================================================================
// PTO REQUEST AUTHORIZATION
// ============================================================================

/**
 * Check if user can access a specific PTO request
 * - Users can access their own requests
 * - Managers can access their direct reports' requests
 * - Approvers can access requests they're assigned to
 * - Admins can access all requests
 *
 * @param {Object} currentUser - The authenticated user
 * @param {Object} ptoRequest - The PTO request object
 * @returns {boolean} True if user has access
 */
function canAccessPtoRequest(currentUser, ptoRequest) {
  if (!currentUser || !ptoRequest) {
    return false;
  }

  // Users can access their own
  if (ptoRequest.userId === currentUser.id) {
    return true;
  }

  // Admins can access all
  if (isAdmin(currentUser)) {
    return true;
  }

  // Approvers can access assigned requests
  if (ptoRequest.approverId === currentUser.id) {
    return true;
  }

  // Managers can access direct reports' requests
  if (isManager(currentUser)) {
    const directReportIds = getDirectReportIds(currentUser.id);
    if (directReportIds.includes(ptoRequest.userId)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can modify a PTO request
 * @param {Object} currentUser - The authenticated user
 * @param {Object} ptoRequest - The PTO request object
 * @param {string} action - Action type: 'EDIT', 'CANCEL', 'APPROVE', 'DENY'
 * @returns {boolean} True if user can modify
 */
function canModifyPtoRequest(currentUser, ptoRequest, action) {
  if (!currentUser || !ptoRequest) {
    return false;
  }

  switch (action) {
    case 'EDIT':
      // Only owner can edit, and only in Draft or ChangesRequested status
      return ptoRequest.userId === currentUser.id &&
             (ptoRequest.status === PTO_STATUSES.DRAFT ||
              ptoRequest.status === PTO_STATUSES.CHANGES_REQUESTED);

    case 'CANCEL':
      // Owner can cancel from Draft or Submitted status
      return ptoRequest.userId === currentUser.id &&
             (ptoRequest.status === PTO_STATUSES.DRAFT ||
              ptoRequest.status === PTO_STATUSES.SUBMITTED);

    case 'APPROVE':
    case 'DENY':
      // Must be in Submitted status
      if (ptoRequest.status !== PTO_STATUSES.SUBMITTED) {
        return false;
      }

      // Approver or admin can approve/deny
      return ptoRequest.approverId === currentUser.id || isAdmin(currentUser);

    default:
      return false;
  }
}

/**
 * Check if user can manage system configuration
 * @param {Object} currentUser - The authenticated user
 * @returns {boolean} True if user can manage config
 */
function canManageSystemConfig(currentUser) {
  return isAdmin(currentUser);
}

/**
 * Check if user can manage holidays and blackout dates
 * @param {Object} currentUser - The authenticated user
 * @returns {boolean} True if user can manage
 */
function canManageHolidaysAndBlackouts(currentUser) {
  return isAdmin(currentUser);
}

// ============================================================================
// EVALUATION AUTHORIZATION (from Staff-Evaluation-System)
// ============================================================================

/**
 * Check if user can access a specific evaluation
 * - Users can always access their own evaluations
 * - Managers can access their direct reports' evaluations
 * - Admins can access all evaluations
 *
 * @param {Object} currentUser - The authenticated user
 * @param {Object} evaluation - The evaluation object
 * @returns {boolean} True if user has access
 */
function canAccessEvaluation(currentUser, evaluation) {
  if (!currentUser || !evaluation) {
    return false;
  }

  // Users can access their own
  if (evaluation.employeeId === currentUser.id) {
    return true;
  }

  // Admins can access all
  if (isAdmin(currentUser)) {
    return true;
  }

  // Managers can access direct reports
  if (isManager(currentUser)) {
    const directReportIds = getDirectReportIds(currentUser.id);
    if (directReportIds.includes(evaluation.employeeId)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can modify an evaluation
 * Different rules apply based on what type of modification
 *
 * @param {Object} currentUser - The authenticated user
 * @param {Object} evaluation - The evaluation object
 * @param {string} modificationType - Type of modification: 'SELF_RATING', 'MANAGER_RATING', 'PEER_RATING', 'STATUS', 'GOALS'
 * @returns {boolean} True if user can modify
 */
function canModifyEvaluation(currentUser, evaluation, modificationType) {
  if (!currentUser || !evaluation) {
    return false;
  }

  switch (modificationType) {
    case 'SELF_RATING':
      // Only the employee can modify self ratings, and only in Draft status
      return evaluation.employeeId === currentUser.id &&
             evaluation.status === EVALUATION_STATUSES.DRAFT;

    case 'MANAGER_RATING':
      // Only the manager can modify manager ratings, in Manager-Review status
      const targetUser = getUserById(evaluation.employeeId);
      return targetUser &&
             targetUser.managerId === currentUser.id &&
             evaluation.status === EVALUATION_STATUSES.MANAGER_REVIEW;

    case 'PEER_RATING':
      // Handled separately in peer review requests
      return true;

    case 'GOALS':
      // Employee can modify goals during Draft and Submitted status
      return evaluation.employeeId === currentUser.id &&
             (evaluation.status === EVALUATION_STATUSES.DRAFT ||
              evaluation.status === EVALUATION_STATUSES.SUBMITTED);

    case 'STATUS':
      // Different rules for status transitions
      return canTransitionStatus(currentUser, evaluation);

    default:
      return false;
  }
}

/**
 * Check if user can transition evaluation status
 * @param {Object} currentUser - The authenticated user
 * @param {Object} evaluation - The evaluation object
 * @returns {boolean} True if user can transition
 */
function canTransitionStatus(currentUser, evaluation) {
  if (!currentUser || !evaluation) {
    return false;
  }

  const currentStatus = evaluation.status;
  const evaluationType = evaluation.type;

  // Get valid status sequence for this evaluation type
  const statusSequence = WORKFLOW_STATUS_SEQUENCES[evaluationType];
  if (!statusSequence) {
    return false;
  }

  const currentIndex = statusSequence.indexOf(currentStatus);
  if (currentIndex === -1) {
    return false; // Invalid current status
  }

  // Can't transition from final status
  if (currentIndex === statusSequence.length - 1) {
    return false;
  }

  const nextStatus = statusSequence[currentIndex + 1];

  // Employee can submit from Draft to Submitted
  if (currentStatus === EVALUATION_STATUSES.DRAFT &&
      nextStatus === EVALUATION_STATUSES.SUBMITTED &&
      evaluation.employeeId === currentUser.id) {
    return true;
  }

  // Manager can approve self-assessment
  if (currentStatus === EVALUATION_STATUSES.SUBMITTED &&
      nextStatus === EVALUATION_STATUSES.APPROVED &&
      isManager(currentUser)) {
    const targetUser = getUserById(evaluation.employeeId);
    return targetUser && targetUser.managerId === currentUser.id;
  }

  // Manager can complete manager review
  if (currentStatus === EVALUATION_STATUSES.MANAGER_REVIEW &&
      isManager(currentUser)) {
    const targetUser = getUserById(evaluation.employeeId);
    return targetUser && targetUser.managerId === currentUser.id;
  }

  // Admin can do anything
  if (isAdmin(currentUser)) {
    return true;
  }

  return false;
}

/**
 * Check if user can pull back (revert status) an evaluation
 * @param {Object} currentUser - The authenticated user
 * @param {Object} evaluation - The evaluation object
 * @returns {boolean} True if user can pull back
 */
function canPullBackEvaluation(currentUser, evaluation) {
  if (!currentUser || !evaluation) {
    return false;
  }

  // Only managers can pull back
  if (!isManager(currentUser)) {
    return false;
  }

  const targetUser = getUserById(evaluation.employeeId);
  if (!targetUser || targetUser.managerId !== currentUser.id) {
    return false;
  }

  // Can pull back from Submitted or Approved status back to Draft
  return evaluation.status === EVALUATION_STATUSES.SUBMITTED ||
         evaluation.status === EVALUATION_STATUSES.APPROVED;
}

/**
 * Check if user can create a new evaluation
 * @param {Object} currentUser - The authenticated user
 * @param {string} forUserId - User ID the evaluation is for
 * @returns {boolean} True if user can create
 */
function canCreateEvaluation(currentUser, forUserId) {
  if (!currentUser || !forUserId) {
    return false;
  }

  // Users can create evaluations for themselves
  if (currentUser.id === forUserId) {
    return true;
  }

  // Managers can create for direct reports
  if (isManager(currentUser)) {
    const directReportIds = getDirectReportIds(currentUser.id);
    if (directReportIds.includes(forUserId)) {
      return true;
    }
  }

  // Admins can create for anyone
  if (isAdmin(currentUser)) {
    return true;
  }

  return false;
}

/**
 * Check if user can manage custom competencies
 * @param {Object} currentUser - The authenticated user
 * @returns {boolean} True if user can manage competencies
 */
function canManageCompetencies(currentUser) {
  return isAdmin(currentUser);
}

/**
 * Get the next status in the workflow
 * @param {string} currentStatus - Current evaluation status
 * @param {string} evaluationType - Evaluation type
 * @returns {string|null} Next status or null if at end
 */
function getNextStatus(currentStatus, evaluationType) {
  const sequence = WORKFLOW_STATUS_SEQUENCES[evaluationType];
  if (!sequence) {
    return null;
  }

  const currentIndex = sequence.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === sequence.length - 1) {
    return null;
  }

  return sequence[currentIndex + 1];
}

/**
 * Get the previous status in the workflow (for pull back)
 * @param {string} currentStatus - Current evaluation status
 * @param {string} evaluationType - Evaluation type
 * @returns {string|null} Previous status or null if at beginning
 */
function getPreviousStatus(currentStatus, evaluationType) {
  const sequence = WORKFLOW_STATUS_SEQUENCES[evaluationType];
  if (!sequence) {
    return null;
  }

  const currentIndex = sequence.indexOf(currentStatus);
  if (currentIndex <= 0) {
    return null;
  }

  return sequence[currentIndex - 1];
}
