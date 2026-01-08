/**
 * Payroll Service
 * Handles payroll history operations (ADMIN only)
 * Manages bi-weekly payroll runs and approved reimbursement processing
 */

/**
 * Get all payroll history records
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Optional filters
 * @returns {Object} Success or error response
 */
function handleGetPayrollHistory(currentUser, payload) {
  // ADMIN only
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Only admins can view payroll history', 'UNAUTHORIZED');
  }

  try {
    const allPayrollRuns = getSheetData(
      SHEET_NAMES.PAYROLL_HISTORY,
      COLUMN_MAPS.PAYROLL_HISTORY,
      rowToPayrollHistory
    );

    // Optional filters
    let filtered = allPayrollRuns;

    if (payload.year) {
      filtered = filtered.filter(run => {
        const runYear = new Date(run.runDate).getFullYear();
        return runYear === parseInt(payload.year);
      });
    }

    if (payload.status) {
      filtered = filtered.filter(run => run.status === payload.status);
    }

    // Sort by runDate descending (most recent first)
    filtered.sort((a, b) => new Date(b.runDate) - new Date(a.runDate));

    return successResponse(filtered);
  } catch (error) {
    Logger.log('Error in handleGetPayrollHistory: ' + error.message);
    return errorResponse('Failed to retrieve payroll history', 'GET_PAYROLL_ERROR');
  }
}

/**
 * Get a single payroll run by ID
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {payrollId}
 * @returns {Object} Success or error response
 */
function handleGetPayrollRun(currentUser, payload) {
  // ADMIN only
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Only admins can view payroll details', 'UNAUTHORIZED');
  }

  const { payrollId } = payload;

  if (!payrollId) {
    return errorResponse('Missing payrollId parameter', 'MISSING_PARAMETER');
  }

  try {
    const allRuns = getSheetData(
      SHEET_NAMES.PAYROLL_HISTORY,
      COLUMN_MAPS.PAYROLL_HISTORY,
      rowToPayrollHistory
    );

    const payrollRun = allRuns.find(run => run.id === payrollId);

    if (!payrollRun) {
      return errorResponse('Payroll run not found', 'NOT_FOUND');
    }

    return successResponse(payrollRun);
  } catch (error) {
    Logger.log('Error in handleGetPayrollRun: ' + error.message);
    return errorResponse('Failed to retrieve payroll run', 'GET_PAYROLL_RUN_ERROR');
  }
}

/**
 * Log a new payroll run (from PDF import or manual entry)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Payroll run data
 * @returns {Object} Success or error response
 */
function handleLogPayroll(currentUser, payload) {
  // ADMIN only
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Only admins can log payroll', 'UNAUTHORIZED');
  }

  const {
    runDate,
    checkDate,
    payPeriodStart,
    payPeriodEnd,
    totalGross,
    totalNet,
    totalTaxes,
    totalDeductions,
    notes,
    source
  } = payload;

  // Validate required fields
  if (!runDate || !checkDate || !payPeriodStart || !payPeriodEnd || totalGross === undefined || totalNet === undefined) {
    return errorResponse('Missing required fields', 'MISSING_PARAMETERS');
  }

  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(SHEET_NAMES.PAYROLL_HISTORY);

    const now = new Date().toISOString();
    const payrollId = generateId('payroll');

    const rowData = [
      payrollId,
      runDate,
      checkDate,
      payPeriodStart,
      payPeriodEnd,
      totalGross || 0,
      totalNet || 0,
      totalTaxes || 0,
      totalDeductions || 0,
      PAYROLL_STATUSES.DRAFT,        // Initial status
      currentUser.email,               // processedBy
      notes || '',
      source || PAYROLL_SOURCE.MANUAL,
      now,                             // createdAt
      now                              // updatedAt
    ];

    sheet.appendRow(rowData);

    const newPayrollRun = {
      id: payrollId,
      runDate: runDate,
      checkDate: checkDate,
      payPeriodStart: payPeriodStart,
      payPeriodEnd: payPeriodEnd,
      totalGross: totalGross || 0,
      totalNet: totalNet || 0,
      totalTaxes: totalTaxes || 0,
      totalDeductions: totalDeductions || 0,
      status: PAYROLL_STATUSES.DRAFT,
      processedBy: currentUser.email,
      notes: notes || '',
      source: source || PAYROLL_SOURCE.MANUAL,
      createdAt: now,
      updatedAt: now
    };

    return successResponse(newPayrollRun);
  } catch (error) {
    Logger.log('Error in handleLogPayroll: ' + error.message);
    return errorResponse('Failed to log payroll', 'LOG_PAYROLL_ERROR');
  }
}

/**
 * Update payroll status (Draft -> Approved -> Processed)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {payrollId, status}
 * @returns {Object} Success or error response
 */
function handleUpdatePayrollStatus(currentUser, payload) {
  // ADMIN only
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Only admins can update payroll status', 'UNAUTHORIZED');
  }

  const { payrollId, status } = payload;

  if (!payrollId || !status) {
    return errorResponse('Missing required fields: payrollId, status', 'MISSING_PARAMETERS');
  }

  // Validate status
  const validStatuses = Object.values(PAYROLL_STATUSES);
  if (!validStatuses.includes(status)) {
    return errorResponse('Invalid status value', 'INVALID_STATUS');
  }

  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(SHEET_NAMES.PAYROLL_HISTORY);
    const colMap = COLUMN_MAPS.PAYROLL_HISTORY;

    const rowIndex = findRowById(sheet, colMap.id, payrollId);

    if (rowIndex === -1) {
      return errorResponse('Payroll run not found', 'NOT_FOUND');
    }

    const now = new Date().toISOString();

    // Update status and updatedAt
    sheet.getRange(rowIndex, colMap.status + 1).setValue(status);
    sheet.getRange(rowIndex, colMap.updatedAt + 1).setValue(now);

    // Get updated payroll run
    const allRuns = getSheetData(
      SHEET_NAMES.PAYROLL_HISTORY,
      COLUMN_MAPS.PAYROLL_HISTORY,
      rowToPayrollHistory
    );
    const updatedRun = allRuns.find(run => run.id === payrollId);

    return successResponse(updatedRun);
  } catch (error) {
    Logger.log('Error in handleUpdatePayrollStatus: ' + error.message);
    return errorResponse('Failed to update payroll status', 'UPDATE_STATUS_ERROR');
  }
}

/**
 * Process reimbursements as part of payroll run
 * Marks approved reimbursements as "Reimbursed" and sets dateReimbursed
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {reimbursementIds: string[], dateReimbursed: string}
 * @returns {Object} Success or error response
 */
function handleProcessReimbursements(currentUser, payload) {
  // ADMIN only
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Only admins can process reimbursements', 'UNAUTHORIZED');
  }

  const { reimbursementIds, dateReimbursed } = payload;

  if (!reimbursementIds || !Array.isArray(reimbursementIds) || reimbursementIds.length === 0) {
    return errorResponse('Missing or invalid reimbursementIds', 'MISSING_PARAMETERS');
  }

  if (!dateReimbursed) {
    return errorResponse('Missing dateReimbursed', 'MISSING_PARAMETERS');
  }

  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(SHEET_NAMES.REIMBURSEMENTS);
    const colMap = COLUMN_MAPS.REIMBURSEMENTS;
    const now = new Date().toISOString();

    const processedIds = [];
    const errors = [];

    reimbursementIds.forEach(reimbursementId => {
      const rowIndex = findRowById(sheet, colMap.id, reimbursementId);

      if (rowIndex === -1) {
        errors.push(`Reimbursement ${reimbursementId} not found`);
        return;
      }

      // Get current status
      const currentStatus = sheet.getRange(rowIndex, colMap.status + 1).getValue();

      // Only process if status is "Approved"
      if (currentStatus !== REIMBURSEMENT_STATUSES.APPROVED) {
        errors.push(`Reimbursement ${reimbursementId} is not in Approved status (current: ${currentStatus})`);
        return;
      }

      // Update to Reimbursed status
      sheet.getRange(rowIndex, colMap.status + 1).setValue(REIMBURSEMENT_STATUSES.REIMBURSED);
      sheet.getRange(rowIndex, colMap.dateReimbursed + 1).setValue(dateReimbursed);
      sheet.getRange(rowIndex, colMap.updatedAt + 1).setValue(now);

      processedIds.push(reimbursementId);
    });

    return successResponse({
      processedCount: processedIds.length,
      processedIds: processedIds,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    Logger.log('Error in handleProcessReimbursements: ' + error.message);
    return errorResponse('Failed to process reimbursements', 'PROCESS_REIMBURSEMENTS_ERROR');
  }
}
