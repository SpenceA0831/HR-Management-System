/**
 * PayrollGenerator.gs
 * Utility functions for generating and managing annual payroll runs
 */

/**
 * Generate all 26 bi-weekly payroll runs for a given year
 *
 * @param {number} year - The year to generate runs for (e.g., 2025)
 * @param {string} firstRunDate - First payroll run date in YYYY-MM-DD format (e.g., "2025-01-03")
 * @param {string} adminEmail - Email of admin creating the runs
 * @returns {number} Number of runs created
 */
function generateAnnualPayrollRuns(year, firstRunDate, adminEmail) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYROLL_HISTORY);

  if (!sheet) {
    throw new Error('Payroll_History sheet not found');
  }

  const colMap = COLUMN_MAPS.PAYROLL_HISTORY;
  const startDate = new Date(firstRunDate);
  let runsCreated = 0;

  // Generate 26 bi-weekly runs
  for (let i = 0; i < 26; i++) {
    // Calculate dates for this run
    const runDate = new Date(startDate);
    runDate.setDate(startDate.getDate() + (i * 14)); // Add 14 days per run

    // Check date is typically 2 business days after run date
    const checkDate = new Date(runDate);
    checkDate.setDate(runDate.getDate() + 2);

    // Pay period: 14 days ending on day before run date
    const payPeriodEnd = new Date(runDate);
    payPeriodEnd.setDate(runDate.getDate() - 1);

    const payPeriodStart = new Date(payPeriodEnd);
    payPeriodStart.setDate(payPeriodEnd.getDate() - 13); // 14-day period

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const runId = Utilities.getUuid();
    const timestamp = new Date().toISOString();

    // Create row with Pending status and placeholder financial data
    const row = [];
    row[colMap.id] = runId;
    row[colMap.runDate] = formatDate(runDate);
    row[colMap.checkDate] = formatDate(checkDate);
    row[colMap.payPeriodStart] = formatDate(payPeriodStart);
    row[colMap.payPeriodEnd] = formatDate(payPeriodEnd);
    row[colMap.totalGross] = 0; // Placeholder
    row[colMap.totalNet] = 0; // Placeholder
    row[colMap.totalTaxes] = 0; // Placeholder
    row[colMap.totalDeductions] = 0; // Placeholder
    row[colMap.status] = 'Pending';
    row[colMap.processedBy] = adminEmail;
    row[colMap.notes] = `Auto-generated for ${year}`;
    row[colMap.source] = 'Manual';
    row[colMap.createdAt] = timestamp;
    row[colMap.updatedAt] = timestamp;

    sheet.appendRow(row);
    runsCreated++;
  }

  return runsCreated;
}

/**
 * Get the next pending payroll run
 * Returns the earliest pending run that hasn't been filled yet
 *
 * @returns {Object|null} The next pending payroll run or null
 */
function getNextPendingRun() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYROLL_HISTORY);

  if (!sheet) {
    return null;
  }

  const data = sheet.getDataRange().getValues();
  const colMap = COLUMN_MAPS.PAYROLL_HISTORY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    if (row[colMap.status] === 'Pending') {
      const runDate = new Date(row[colMap.runDate]);

      // Return the first pending run (they should be in chronological order)
      return rowToPayrollHistory(colMap, row);
    }
  }

  return null;
}

/**
 * Get all pending payroll runs
 *
 * @returns {Array} Array of pending payroll runs
 */
function getPendingRuns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYROLL_HISTORY);

  if (!sheet) {
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const colMap = COLUMN_MAPS.PAYROLL_HISTORY;
  const pendingRuns = [];

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    if (row[colMap.status] === 'Pending') {
      pendingRuns.push(rowToPayrollHistory(colMap, row));
    }
  }

  return pendingRuns;
}

/**
 * Update a pending payroll run with actual data
 *
 * @param {string} runId - The ID of the run to update
 * @param {Object} data - Payroll data to fill in
 * @returns {Object} The updated payroll run
 */
function updatePendingRun(runId, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYROLL_HISTORY);

  if (!sheet) {
    throw new Error('Payroll_History sheet not found');
  }

  const rows = sheet.getDataRange().getValues();
  const colMap = COLUMN_MAPS.PAYROLL_HISTORY;

  // Find the run
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colMap.id] === runId) {
      const row = rows[i];

      // Verify it's actually pending
      if (row[colMap.status] !== 'Pending') {
        throw new Error('Can only update pending payroll runs');
      }

      // Update financial data
      if (data.totalGross !== undefined) {
        sheet.getRange(i + 1, colMap.totalGross + 1).setValue(data.totalGross);
      }
      if (data.totalNet !== undefined) {
        sheet.getRange(i + 1, colMap.totalNet + 1).setValue(data.totalNet);
      }
      if (data.totalTaxes !== undefined) {
        sheet.getRange(i + 1, colMap.totalTaxes + 1).setValue(data.totalTaxes);
      }
      if (data.totalDeductions !== undefined) {
        sheet.getRange(i + 1, colMap.totalDeductions + 1).setValue(data.totalDeductions);
      }

      // Update status to Draft (data entered but not yet approved)
      sheet.getRange(i + 1, colMap.status + 1).setValue('Draft');

      // Update source if provided
      if (data.source) {
        sheet.getRange(i + 1, colMap.source + 1).setValue(data.source);
      }

      // Update notes if provided
      if (data.notes) {
        sheet.getRange(i + 1, colMap.notes + 1).setValue(data.notes);
      }

      // Update timestamp
      sheet.getRange(i + 1, colMap.updatedAt + 1).setValue(new Date().toISOString());

      // Get updated row
      const updatedRow = sheet.getRange(i + 1, 1, 1, Object.keys(colMap).length).getValues()[0];
      return rowToPayrollHistory(colMap, updatedRow);
    }
  }

  throw new Error('Payroll run not found');
}

/**
 * Handler for generating annual runs (called from frontend)
 * ADMIN ONLY
 */
function handleGenerateAnnualRuns(currentUser, payload) {
  if (currentUser.userRole !== 'ADMIN') {
    return errorResponse('Unauthorized: Admin access required', 'FORBIDDEN');
  }

  const { year, firstRunDate } = payload;

  if (!year || !firstRunDate) {
    return errorResponse('Missing required fields: year, firstRunDate');
  }

  try {
    const count = generateAnnualPayrollRuns(year, firstRunDate, currentUser.email);
    return successResponse({
      message: `Successfully generated ${count} payroll runs for ${year}`,
      count: count
    });
  } catch (error) {
    Logger.log('Error generating annual runs: ' + error.toString());
    return errorResponse('Failed to generate annual runs: ' + error.toString());
  }
}

/**
 * Handler for getting pending runs
 */
function handleGetPendingRuns(currentUser, payload) {
  if (currentUser.userRole !== 'ADMIN') {
    return errorResponse('Unauthorized: Admin access required', 'FORBIDDEN');
  }

  try {
    const runs = getPendingRuns();
    return successResponse(runs);
  } catch (error) {
    Logger.log('Error getting pending runs: ' + error.toString());
    return errorResponse('Failed to get pending runs: ' + error.toString());
  }
}

/**
 * Handler for updating a pending run
 */
function handleUpdatePendingRun(currentUser, payload) {
  if (currentUser.userRole !== 'ADMIN') {
    return errorResponse('Unauthorized: Admin access required', 'FORBIDDEN');
  }

  const { runId, ...data } = payload;

  if (!runId) {
    return errorResponse('Missing required field: runId');
  }

  try {
    const updated = updatePendingRun(runId, data);
    return successResponse(updated);
  } catch (error) {
    Logger.log('Error updating pending run: ' + error.toString());
    return errorResponse('Failed to update pending run: ' + error.toString());
  }
}
