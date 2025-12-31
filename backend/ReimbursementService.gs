/**
 * Reimbursement Service
 * Handles expense reimbursement requests, approvals, and denials
 * Supports Section 127 (Educational Assistance), Section 129 (Dependent Care), and general expenses
 */

/**
 * Get reimbursements with role-based filtering
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Optional filters {status, reimbursementType, userId}
 * @returns {Object} Success or error response
 */
function handleGetReimbursements(currentUser, payload) {
  try {
    const allReimbursements = getSheetData(
      SHEET_NAMES.REIMBURSEMENTS,
      COLUMN_MAPS.REIMBURSEMENTS,
      rowToReimbursement
    );

    // Apply role-based filtering
    let filtered = allReimbursements.filter(reimb => {
      // Staff can only see their own
      if (currentUser.userRole === USER_ROLES.STAFF) {
        return reimb.staffEmail === currentUser.email;
      }
      // Managers and Admins see all
      return true;
    });

    // Apply optional filters
    if (payload.status) {
      filtered = filtered.filter(reimb => reimb.status === payload.status);
    }

    if (payload.reimbursementType) {
      filtered = filtered.filter(reimb => reimb.reimbursementType === payload.reimbursementType);
    }

    if (payload.userId) {
      const user = getUserById(payload.userId);
      if (user) {
        filtered = filtered.filter(reimb => reimb.staffEmail === user.email);
      }
    }

    // Sort by submittedAt descending (most recent first)
    filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return successResponse(filtered);
  } catch (error) {
    Logger.log('Error in handleGetReimbursements: ' + error.message);
    return errorResponse('Failed to retrieve reimbursements', 'GET_REIMBURSEMENTS_ERROR');
  }
}

/**
 * Get a single reimbursement by ID
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {reimbursementId}
 * @returns {Object} Success or error response
 */
function handleGetReimbursement(currentUser, payload) {
  const { reimbursementId } = payload;

  if (!reimbursementId) {
    return errorResponse('Missing reimbursementId parameter', 'MISSING_PARAMETER');
  }

  try {
    const allReimbursements = getSheetData(
      SHEET_NAMES.REIMBURSEMENTS,
      COLUMN_MAPS.REIMBURSEMENTS,
      rowToReimbursement
    );

    const reimbursement = allReimbursements.find(reimb => reimb.id === reimbursementId);

    if (!reimbursement) {
      return errorResponse('Reimbursement not found', 'NOT_FOUND');
    }

    // Check authorization
    if (!canAccessReimbursement(currentUser, reimbursement)) {
      return errorResponse('Unauthorized: Cannot access this reimbursement', 'UNAUTHORIZED');
    }

    return successResponse(reimbursement);
  } catch (error) {
    Logger.log('Error in handleGetReimbursement: ' + error.message);
    return errorResponse('Failed to retrieve reimbursement', 'GET_REIMBURSEMENT_ERROR');
  }
}

/**
 * Create a new reimbursement request
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Reimbursement data
 * @returns {Object} Success or error response
 */
function handleCreateReimbursement(currentUser, payload) {
  const {
    expenseDate,
    description,
    amount,
    reimbursementType,
    methodOfReimbursement,
    notes
  } = payload;

  // Validate required fields
  if (!expenseDate || !description || amount === undefined || !reimbursementType) {
    return errorResponse('Missing required fields: expenseDate, description, amount, reimbursementType', 'MISSING_PARAMETERS');
  }

  // Validate amount is positive
  if (amount <= 0) {
    return errorResponse('Amount must be greater than zero', 'INVALID_AMOUNT');
  }

  // Validate reimbursementType
  const validTypes = Object.values(REIMBURSEMENT_TYPES);
  if (!validTypes.includes(reimbursementType)) {
    return errorResponse('Invalid reimbursementType', 'INVALID_TYPE');
  }

  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(SHEET_NAMES.REIMBURSEMENTS);

    const now = new Date().toISOString();
    const reimbursementId = generateId('reimb');

    const rowData = [
      reimbursementId,
      currentUser.name,
      currentUser.email,
      expenseDate,
      description,
      amount,
      reimbursementType,
      methodOfReimbursement || REIMBURSEMENT_METHODS.PAYROLL,  // Default to payroll
      REIMBURSEMENT_STATUSES.PENDING,                           // Initial status
      now,                                                       // submittedAt
      '',                                                        // dateReimbursed (empty until processed)
      '',                                                        // reviewerId (empty until reviewed)
      '',                                                        // reviewerName (empty until reviewed)
      notes || '',
      now,                                                       // createdAt
      now                                                        // updatedAt
    ];

    sheet.appendRow(rowData);

    const newReimbursement = {
      id: reimbursementId,
      staffName: currentUser.name,
      staffEmail: currentUser.email,
      expenseDate: expenseDate,
      description: description,
      amount: amount,
      reimbursementType: reimbursementType,
      methodOfReimbursement: methodOfReimbursement || REIMBURSEMENT_METHODS.PAYROLL,
      status: REIMBURSEMENT_STATUSES.PENDING,
      submittedAt: now,
      dateReimbursed: null,
      reviewerId: null,
      reviewerName: null,
      notes: notes || '',
      createdAt: now,
      updatedAt: now
    };

    return successResponse(newReimbursement);
  } catch (error) {
    Logger.log('Error in handleCreateReimbursement: ' + error.message);
    return errorResponse('Failed to create reimbursement', 'CREATE_REIMBURSEMENT_ERROR');
  }
}

/**
 * Approve a reimbursement request
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {reimbursementId, comment}
 * @returns {Object} Success or error response
 */
function handleApproveReimbursement(currentUser, payload) {
  // Only managers and admins can approve
  if (!isManager(currentUser) && !isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Only managers and admins can approve reimbursements', 'UNAUTHORIZED');
  }

  const { reimbursementId, comment } = payload;

  if (!reimbursementId) {
    return errorResponse('Missing reimbursementId', 'MISSING_PARAMETER');
  }

  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(SHEET_NAMES.REIMBURSEMENTS);
    const colMap = COLUMN_MAPS.REIMBURSEMENTS;

    const rowIndex = findRowById(sheet, colMap.id, reimbursementId);

    if (rowIndex === -1) {
      return errorResponse('Reimbursement not found', 'NOT_FOUND');
    }

    // Check current status - can only approve if Pending
    const currentStatus = sheet.getRange(rowIndex, colMap.status + 1).getValue();

    if (currentStatus !== REIMBURSEMENT_STATUSES.PENDING) {
      return errorResponse(`Cannot approve reimbursement with status: ${currentStatus}`, 'INVALID_STATUS');
    }

    const now = new Date().toISOString();

    // Update reimbursement
    sheet.getRange(rowIndex, colMap.status + 1).setValue(REIMBURSEMENT_STATUSES.APPROVED);
    sheet.getRange(rowIndex, colMap.reviewerId + 1).setValue(currentUser.id);
    sheet.getRange(rowIndex, colMap.reviewerName + 1).setValue(currentUser.name);
    sheet.getRange(rowIndex, colMap.updatedAt + 1).setValue(now);

    // Add comment to notes if provided
    if (comment) {
      const currentNotes = sheet.getRange(rowIndex, colMap.notes + 1).getValue();
      const updatedNotes = currentNotes
        ? `${currentNotes}\n\nApproval comment (${now}): ${comment}`
        : `Approval comment (${now}): ${comment}`;
      sheet.getRange(rowIndex, colMap.notes + 1).setValue(updatedNotes);
    }

    // Get updated reimbursement
    const allReimbursements = getSheetData(
      SHEET_NAMES.REIMBURSEMENTS,
      COLUMN_MAPS.REIMBURSEMENTS,
      rowToReimbursement
    );
    const updatedReimbursement = allReimbursements.find(reimb => reimb.id === reimbursementId);

    return successResponse(updatedReimbursement);
  } catch (error) {
    Logger.log('Error in handleApproveReimbursement: ' + error.message);
    return errorResponse('Failed to approve reimbursement', 'APPROVE_REIMBURSEMENT_ERROR');
  }
}

/**
 * Deny a reimbursement request
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {reimbursementId, comment (required)}
 * @returns {Object} Success or error response
 */
function handleDenyReimbursement(currentUser, payload) {
  // Only managers and admins can deny
  if (!isManager(currentUser) && !isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Only managers and admins can deny reimbursements', 'UNAUTHORIZED');
  }

  const { reimbursementId, comment } = payload;

  if (!reimbursementId) {
    return errorResponse('Missing reimbursementId', 'MISSING_PARAMETER');
  }

  if (!comment) {
    return errorResponse('Comment is required when denying a reimbursement', 'MISSING_COMMENT');
  }

  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(SHEET_NAMES.REIMBURSEMENTS);
    const colMap = COLUMN_MAPS.REIMBURSEMENTS;

    const rowIndex = findRowById(sheet, colMap.id, reimbursementId);

    if (rowIndex === -1) {
      return errorResponse('Reimbursement not found', 'NOT_FOUND');
    }

    // Check current status - can only deny if Pending
    const currentStatus = sheet.getRange(rowIndex, colMap.status + 1).getValue();

    if (currentStatus !== REIMBURSEMENT_STATUSES.PENDING) {
      return errorResponse(`Cannot deny reimbursement with status: ${currentStatus}`, 'INVALID_STATUS');
    }

    const now = new Date().toISOString();

    // Update reimbursement
    sheet.getRange(rowIndex, colMap.status + 1).setValue(REIMBURSEMENT_STATUSES.DENIED);
    sheet.getRange(rowIndex, colMap.reviewerId + 1).setValue(currentUser.id);
    sheet.getRange(rowIndex, colMap.reviewerName + 1).setValue(currentUser.name);
    sheet.getRange(rowIndex, colMap.updatedAt + 1).setValue(now);

    // Add denial comment to notes
    const currentNotes = sheet.getRange(rowIndex, colMap.notes + 1).getValue();
    const updatedNotes = currentNotes
      ? `${currentNotes}\n\nDenial reason (${now}): ${comment}`
      : `Denial reason (${now}): ${comment}`;
    sheet.getRange(rowIndex, colMap.notes + 1).setValue(updatedNotes);

    // Get updated reimbursement
    const allReimbursements = getSheetData(
      SHEET_NAMES.REIMBURSEMENTS,
      COLUMN_MAPS.REIMBURSEMENTS,
      rowToReimbursement
    );
    const updatedReimbursement = allReimbursements.find(reimb => reimb.id === reimbursementId);

    return successResponse(updatedReimbursement);
  } catch (error) {
    Logger.log('Error in handleDenyReimbursement: ' + error.message);
    return errorResponse('Failed to deny reimbursement', 'DENY_REIMBURSEMENT_ERROR');
  }
}

/**
 * Check if user can access a reimbursement
 * @param {Object} user - The current user
 * @param {Object} reimbursement - The reimbursement record
 * @returns {boolean} True if user can access
 */
function canAccessReimbursement(user, reimbursement) {
  // Admins and managers can access all
  if (isAdmin(user) || isManager(user)) {
    return true;
  }

  // Staff can only access their own
  return reimbursement.staffEmail === user.email;
}
