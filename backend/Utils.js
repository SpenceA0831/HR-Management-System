/**
 * Utility functions for HR Management System (Google Apps Script backend)
 * Includes ID generation, sheet access, row converters, and date utilities
 */

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix (e.g., 'user', 'pto', 'eval')
 * @returns {string} Generated ID
 */
function generateId(prefix = '') {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Get a sheet by name
 * @param {string} sheetName - Name of the sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object
 */
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId());
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  return sheet;
}

/**
 * Get all data from a sheet as objects
 * @param {string} sheetName - Name of the sheet
 * @param {Object} columnMap - Column mapping object
 * @param {Function} converter - Row to object converter function
 * @returns {Array} Array of objects
 */
function getSheetData(sheetName, columnMap, converter) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return []; // Only headers or empty
  }

  const results = [];
  for (let i = 1; i < data.length; i++) {
    results.push(converter(columnMap, data[i]));
  }

  return results;
}

/**
 * Find a row index by ID
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet
 * @param {number} idColumn - Column index for ID (usually 0)
 * @param {string} id - ID to search for
 * @returns {number} Row index (1-based) or -1 if not found
 */
function findRowById(sheet, idColumn, id) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][idColumn] === id) {
      return i + 1; // Convert to 1-based index
    }
  }

  return -1;
}

/**
 * Append a new row to a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} rowData - Array of values to append
 */
function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  sheet.appendRow(rowData);
}

/**
 * Update a row in a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowIndex - Row index (1-based)
 * @param {Array} rowData - Array of values to update
 */
function updateRow(sheetName, rowIndex, rowData) {
  const sheet = getSheet(sheetName);
  const range = sheet.getRange(rowIndex, 1, 1, rowData.length);
  range.setValues([rowData]);
}

/**
 * Delete a row from a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowIndex - Row index (1-based)
 */
function deleteRow(sheetName, rowIndex) {
  const sheet = getSheet(sheetName);
  sheet.deleteRow(rowIndex);
}

// ============================================================================
// ROW CONVERTERS - Convert sheet rows to objects
// ============================================================================

/**
 * Convert a row array to User object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} User object
 */
function rowToUser(colMap, row) {
  return {
    id: row[colMap.id] || '',
    name: row[colMap.name] || '',
    email: row[colMap.email] || '',
    userRole: row[colMap.userRole] || '',
    teamId: row[colMap.teamId] || '',
    managerId: row[colMap.managerId] || null,
    employmentType: row[colMap.employmentType] || '',
    hireDate: row[colMap.hireDate] || null,
    roleType: row[colMap.roleType] || '',
    avatar: row[colMap.avatar] || null,
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null
  };
}

/**
 * Convert a row array to PtoRequest object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} PtoRequest object
 */
function rowToPtoRequest(colMap, row) {
  let history = [];
  try {
    if (row[colMap.history]) {
      history = JSON.parse(row[colMap.history]);
    }
  } catch (e) {
    Logger.log('Error parsing history JSON: ' + e.message);
  }

  return {
    id: row[colMap.id] || '',
    userId: row[colMap.userId] || '',
    userName: row[colMap.userName] || '',
    type: row[colMap.type] || '',
    startDate: row[colMap.startDate] || null,
    endDate: row[colMap.endDate] || null,
    isHalfDayStart: row[colMap.isHalfDayStart] === true || row[colMap.isHalfDayStart] === 'TRUE',
    isHalfDayEnd: row[colMap.isHalfDayEnd] === true || row[colMap.isHalfDayEnd] === 'TRUE',
    totalDays: row[colMap.totalDays] || 0,
    reason: row[colMap.reason] || '',
    attachment: row[colMap.attachment] || null,
    status: row[colMap.status] || '',
    managerComment: row[colMap.managerComment] || '',
    employeeComment: row[colMap.employeeComment] || '',
    approverId: row[colMap.approverId] || '',
    approverName: row[colMap.approverName] || '',
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null,
    history: history
  };
}

/**
 * Convert a row array to PtoBalance object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} PtoBalance object
 */
function rowToPtoBalance(colMap, row) {
  return {
    userId: row[colMap.userId] || '',
    year: row[colMap.year] || 0,
    availableHours: row[colMap.availableHours] || 0,
    usedHours: row[colMap.usedHours] || 0,
    pendingHours: row[colMap.pendingHours] || 0
  };
}

/**
 * Convert a row array to Holiday object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} Holiday object
 */
function rowToHoliday(colMap, row) {
  const holiday = {
    id: row[colMap.id] || '',
    date: row[colMap.date] || null,
    name: row[colMap.name] || ''
  };

  // Include endDate if present (for multi-day holidays)
  if (row[colMap.endDate]) {
    holiday.endDate = row[colMap.endDate];
  }

  return holiday;
}

/**
 * Convert a row array to BlackoutDate object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} BlackoutDate object
 */
function rowToBlackoutDate(colMap, row) {
  const blackout = {
    id: row[colMap.id] || '',
    date: row[colMap.date] || null,
    name: row[colMap.name] || '',
    createdBy: row[colMap.createdBy] || '',
    createdAt: row[colMap.createdAt] || null
  };

  // Include endDate if present (for multi-day blackout periods)
  if (row[colMap.endDate]) {
    blackout.endDate = row[colMap.endDate];
  }

  return blackout;
}

/**
 * Convert a row array to Evaluation object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} Evaluation object
 */
function rowToEvaluation(colMap, row) {
  return {
    id: row[colMap.id] || '',
    employeeId: row[colMap.employeeId] || '',
    cycleId: row[colMap.cycleId] || '',
    type: row[colMap.type] || '',
    status: row[colMap.status] || '',
    overallSummary: row[colMap.overallSummary] || null,
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null
  };
}

/**
 * Convert a row array to Rating object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} Rating object
 */
function rowToRating(colMap, row) {
  return {
    id: row[colMap.id] || '',
    evaluationId: row[colMap.evaluationId] || '',
    ratingType: row[colMap.ratingType] || '',
    competencyId: row[colMap.competencyId] || '',
    score: row[colMap.score] || 0,
    comments: row[colMap.comments] || '',
    reviewerId: row[colMap.reviewerId] || null,
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null
  };
}

/**
 * Convert a row array to Goal object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} Goal object
 */
function rowToGoal(colMap, row) {
  return {
    id: row[colMap.id] || '',
    evaluationId: row[colMap.evaluationId] || '',
    description: row[colMap.description] || '',
    status: row[colMap.status] || '',
    achievements: row[colMap.achievements] || '',
    challenges: row[colMap.challenges] || '',
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null
  };
}

/**
 * Convert a row array to EvaluationCycle object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} EvaluationCycle object
 */
function rowToCycle(colMap, row) {
  return {
    id: row[colMap.id] || '',
    name: row[colMap.name] || '',
    year: row[colMap.year] || 0,
    type: row[colMap.type] || '',
    deadline: row[colMap.deadline] || null,
    selfDeadline: row[colMap.selfDeadline] || null,
    peerDeadline: row[colMap.peerDeadline] || null,
    managerDeadline: row[colMap.managerDeadline] || null,
    status: row[colMap.status] || ''
  };
}

/**
 * Convert a row array to PeerReviewRequest object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} PeerReviewRequest object
 */
function rowToPeerRequest(colMap, row) {
  return {
    id: row[colMap.id] || '',
    evaluationId: row[colMap.evaluationId] || '',
    reviewerId: row[colMap.reviewerId] || '',
    targetUserId: row[colMap.targetUserId] || '',
    targetUserName: row[colMap.targetUserName] || '',
    status: row[colMap.status] || '',
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null
  };
}

/**
 * Convert a row array to Competency object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} Competency object
 */
function rowToCompetency(colMap, row) {
  return {
    id: row[colMap.id] || '',
    name: row[colMap.name] || '',
    description: row[colMap.description] || '',
    category: row[colMap.category] || '',
    roleType: row[colMap.roleType] || null,
    isCustom: row[colMap.isCustom] === true || row[colMap.isCustom] === 'TRUE',
    createdAt: row[colMap.createdAt] || null
  };
}

/**
 * Convert a row array to PayrollHistory object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} PayrollHistory object
 */
function rowToPayrollHistory(colMap, row) {
  return {
    id: row[colMap.id] || '',
    runDate: row[colMap.runDate] || null,
    checkDate: row[colMap.checkDate] || null,
    payPeriodStart: row[colMap.payPeriodStart] || null,
    payPeriodEnd: row[colMap.payPeriodEnd] || null,
    totalGross: parseFloat(row[colMap.totalGross]) || 0,
    totalNet: parseFloat(row[colMap.totalNet]) || 0,
    totalTaxes: parseFloat(row[colMap.totalTaxes]) || 0,
    totalDeductions: parseFloat(row[colMap.totalDeductions]) || 0,
    status: row[colMap.status] || '',
    processedBy: row[colMap.processedBy] || '',
    notes: row[colMap.notes] || '',
    source: row[colMap.source] || '',
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null
  };
}

/**
 * Convert a row array to Reimbursement object
 * @param {Object} colMap - Column mapping
 * @param {Array} row - Row data
 * @returns {Object} Reimbursement object
 */
function rowToReimbursement(colMap, row) {
  return {
    id: row[colMap.id] || '',
    staffName: row[colMap.staffName] || '',
    staffEmail: row[colMap.staffEmail] || '',
    expenseDate: row[colMap.expenseDate] || null,
    description: row[colMap.description] || '',
    amount: parseFloat(row[colMap.amount]) || 0,
    reimbursementType: row[colMap.reimbursementType] || '',
    methodOfReimbursement: row[colMap.methodOfReimbursement] || '',
    status: row[colMap.status] || '',
    submittedAt: row[colMap.submittedAt] || null,
    dateReimbursed: row[colMap.dateReimbursed] || null,
    reviewerId: row[colMap.reviewerId] || null,
    reviewerName: row[colMap.reviewerName] || null,
    notes: row[colMap.notes] || '',
    createdAt: row[colMap.createdAt] || null,
    updatedAt: row[colMap.updatedAt] || null
  };
}

// ============================================================================
// DATE UTILITIES FOR PTO CALCULATIONS
// ============================================================================

/**
 * Format ISO date string for Sheets
 * @param {string} isoDate - ISO date string
 * @returns {Date} Date object
 */
function parseDate(isoDate) {
  return isoDate ? new Date(isoDate) : null;
}

/**
 * Format date for API response
 * @param {Date} date - Date object
 * @returns {string} ISO date string
 */
function formatDate(date) {
  return date ? date.toISOString() : null;
}

/**
 * Get current timestamp
 * @returns {Date} Current date
 */
function getCurrentTimestamp() {
  return new Date();
}

/**
 * Check if a date is a weekend
 * @param {Date} date - Date to check
 * @returns {boolean} True if weekend
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a holiday
 * @param {Date} date - Date to check
 * @param {Array} holidays - Array of holiday objects
 * @returns {boolean} True if holiday
 */
function isHoliday(date, holidays) {
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  for (const holiday of holidays) {
    if (holiday.date === dateStr) {
      return true;
    }
  }

  return false;
}

/**
 * Parse date string as local date (not UTC)
 * Fixes timezone bug where "2026-01-19" was parsed as UTC and shifted to previous day in EST
 * @param {string} dateStr - Date string in yyyy-MM-dd format
 * @returns {Date} Date object in local timezone
 */
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculate total working days for a PTO request
 * @param {string} startDate - Start date (yyyy-MM-dd)
 * @param {string} endDate - End date (yyyy-MM-dd)
 * @param {boolean} isHalfDayStart - Half day on start
 * @param {boolean} isHalfDayEnd - Half day on end
 * @param {Array} holidays - Array of holidays
 * @returns {number} Total days (0.5 for half days)
 */
function calculateTotalDays(startDate, endDate, isHalfDayStart, isHalfDayEnd, holidays) {
  let totalDays = 0;
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  let currentDate = new Date(start);

  while (currentDate <= end) {
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
      let dayValue = 1; // Standard full day

      const currentDateStr = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const startDateStr = Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const endDateStr = Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd');

      if (currentDateStr === startDateStr && isHalfDayStart) {
        dayValue = 0.5;
      } else if (currentDateStr === endDateStr && isHalfDayEnd) {
        dayValue = 0.5;
      }

      totalDays += dayValue;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalDays;
}

/**
 * Check if PTO request conflicts with blackout dates
 * @param {string} startDate - Start date (yyyy-MM-dd)
 * @param {string} endDate - End date (yyyy-MM-dd)
 * @param {Array} blackoutDates - Array of blackout date objects
 * @returns {Object} {conflict: boolean, date: string, name: string}
 */
function hasBlackoutConflict(startDate, endDate, blackoutDates) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (const blackout of blackoutDates) {
    const blackoutDate = new Date(blackout.date);
    if (blackoutDate >= start && blackoutDate <= end) {
      return { conflict: true, date: blackout.date, name: blackout.name };
    }
  }

  return { conflict: false };
}

/**
 * Add entry to audit trail history
 * @param {Array} history - Existing history array
 * @param {string} actorId - User ID performing action
 * @param {string} actorName - User name
 * @param {string} action - Action description
 * @param {string} note - Optional note
 * @returns {string} JSON string of updated history
 */
function addAuditEntry(history, actorId, actorName, action, note) {
  const entry = {
    timestamp: new Date().toISOString(),
    actorId: actorId,
    actorName: actorName,
    action: action,
    note: note || ''
  };

  history.push(entry);
  return JSON.stringify(history);
}

// ============================================================================
// RESPONSE FORMATTERS
// ============================================================================

/**
 * Create a success response
 * @param {*} data - Response data
 * @returns {Object} Success response
 */
function successResponse(data) {
  return {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} Error response
 */
function errorResponse(message, code = 'ERROR') {
  return {
    success: false,
    error: message,
    code: code,
    timestamp: new Date().toISOString()
  };
}
