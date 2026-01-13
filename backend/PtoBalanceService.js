/**
 * PTO Balance Service
 * Calculates and manages PTO balances for users (in days)
 */

/**
 * Get PTO balance for a user
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {userId (optional), year (optional)}
 * @returns {Object} Success or error response
 */
function handleGetPtoBalance(currentUser, payload) {
  const userId = payload.userId || currentUser.id;
  // Default to 2026 for testing with current data
  // TODO: Revert to new Date().getFullYear() after testing
  const year = parseInt(payload.year) || 2026;

  // Authorization: Can view own balance, managers can view direct reports, admins can view all
  const canView = currentUser.id === userId ||
    isAdmin(currentUser) ||
    (isManager(currentUser) && getDirectReportIds(currentUser.id).includes(userId));

  if (!canView) {
    return errorResponse('Unauthorized: Cannot access this user\'s balance', 'UNAUTHORIZED');
  }

  try {
    const balance = calculatePtoBalance(userId, year);
    return successResponse(balance);
  } catch (error) {
    Logger.log('Error in handleGetPtoBalance: ' + error.message);
    return errorResponse('Failed to retrieve PTO balance', 'GET_BALANCE_ERROR');
  }
}

/**
 * Calculate PTO balance for a user and year
 * @param {string} userId - User ID
 * @param {number} year - Year
 * @returns {Object} Balance object {userId, year, availableDays, usedDays, pendingDays}
 */
function calculatePtoBalance(userId, year) {
  // Get user
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Get system config
  const configResponse = handleGetSystemConfig(user);
  const config = configResponse.data;

  // Determine available days based on employment type
  let baseDays = user.employmentType === EMPLOYMENT_TYPES.FULL_TIME
    ? config.defaultFullTimeDays
    : config.defaultPartTimeDays;

  // Prorate for hire date if applicable
  if (config.prorateByHireDate && user.hireDate) {
    const hireDate = new Date(user.hireDate);
    const hireYear = hireDate.getFullYear();

    if (hireYear === year) {
      // Prorate based on months worked in first year
      const monthsWorked = 12 - hireDate.getMonth();
      baseDays = Math.round((baseDays / 12) * monthsWorked);
    }
  }

  // Get all PTO requests for this user and year
  const allRequests = getSheetData(SHEET_NAMES.PTO_REQUESTS, COLUMN_MAPS.PTO_REQUESTS, rowToPtoRequest);
  const userRequests = allRequests.filter(req => req.userId === userId);

  let usedDays = 0;
  let pendingDays = 0;

  for (const request of userRequests) {
    const requestYear = new Date(request.startDate).getFullYear();
    if (requestYear === year) {
      if (request.status === PTO_STATUSES.APPROVED) {
        usedDays += request.totalDays;
      } else if (request.status === PTO_STATUSES.SUBMITTED) {
        pendingDays += request.totalDays;
      }
    }
  }

  return {
    userId,
    year,
    totalDays: baseDays,
    availableDays: baseDays, // Deprecated: keeping for backwards compatibility
    usedDays,
    pendingDays
  };
}

/**
 * Sync calculated balance to the PtoBalances sheet
 * @param {string} userId - User ID
 * @param {number} year - Year
 * @returns {Object} The synced balance
 */
function syncBalanceToSheet(userId, year) {
  const balance = calculatePtoBalance(userId, year);
  const sheet = SpreadsheetApp.openById(getSpreadsheetId()).getSheetByName(SHEET_NAMES.PTO_BALANCES);

  if (!sheet) {
    throw new Error('PtoBalances sheet not found');
  }

  const colMap = COLUMN_MAPS.PTO_BALANCES;
  const data = sheet.getDataRange().getValues();

  // Find existing balance record
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap.userId] === userId && data[i][colMap.year] === year) {
      rowIndex = i + 1; // 1-indexed for sheet
      break;
    }
  }

  const rowData = new Array(Object.keys(colMap).length);
  rowData[colMap.userId] = balance.userId;
  rowData[colMap.year] = balance.year;
  rowData[colMap.availableHours] = balance.totalDays;  // Write totalDays to availableHours column
  rowData[colMap.usedHours] = balance.usedDays;
  rowData[colMap.pendingHours] = balance.pendingDays;

  if (rowIndex > 0) {
    // Update existing record
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Append new record
    sheet.appendRow(rowData);
  }

  return balance;
}

/**
 * Initialize balances for all users for a given year
 * @param {number} year - Year to initialize (defaults to current year)
 * @returns {Object} Success response with count of initialized balances
 */
function initializeAllBalances(year) {
  year = year || new Date().getFullYear();

  // Get all users
  const users = getSheetData(SHEET_NAMES.USERS, COLUMN_MAPS.USERS, rowToUser);

  let count = 0;
  for (const user of users) {
    try {
      syncBalanceToSheet(user.id, year);
      count++;
    } catch (error) {
      Logger.log('Failed to initialize balance for user ' + user.id + ': ' + error.message);
    }
  }

  return successResponse({
    message: 'Initialized balances for ' + count + ' users',
    count: count,
    year: year
  });
}

/**
 * Handler to manually initialize all balances (admin only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {year (optional)}
 * @returns {Object} Success or error response
 */
function handleInitializeBalances(currentUser, payload) {
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  try {
    const year = payload.year || new Date().getFullYear();
    return initializeAllBalances(year);
  } catch (error) {
    Logger.log('Error in handleInitializeBalances: ' + error.message);
    return errorResponse('Failed to initialize balances', 'INIT_BALANCES_ERROR');
  }
}
