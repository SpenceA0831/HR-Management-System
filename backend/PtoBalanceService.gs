/**
 * PTO Balance Service
 * Calculates and manages PTO balances for users
 */

/**
 * Get PTO balance for a user
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {userId (optional), year (optional)}
 * @returns {Object} Success or error response
 */
function handleGetPtoBalance(currentUser, payload) {
  const userId = payload.userId || currentUser.id;
  const year = payload.year || new Date().getFullYear();

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
 * @returns {Object} Balance object {userId, year, availableHours, usedHours, pendingHours}
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

  // Determine available hours based on employment type
  let baseHours = user.employmentType === EMPLOYMENT_TYPES.FULL_TIME
    ? config.defaultFullTimeHours
    : config.defaultPartTimeHours;

  // Prorate for hire date if applicable
  if (config.prorateByHireDate && user.hireDate) {
    const hireDate = new Date(user.hireDate);
    const hireYear = hireDate.getFullYear();

    if (hireYear === year) {
      // Prorate based on months worked in first year
      const monthsWorked = 12 - hireDate.getMonth();
      baseHours = Math.round((baseHours / 12) * monthsWorked);
    }
  }

  // Get all PTO requests for this user and year
  const allRequests = getSheetData(SHEET_NAMES.PTO_REQUESTS, COLUMN_MAPS.PTO_REQUESTS, rowToPtoRequest);
  const userRequests = allRequests.filter(req => req.userId === userId);

  let usedHours = 0;
  let pendingHours = 0;

  for (const request of userRequests) {
    const requestYear = new Date(request.startDate).getFullYear();
    if (requestYear === year) {
      if (request.status === PTO_STATUSES.APPROVED) {
        usedHours += request.totalHours;
      } else if (request.status === PTO_STATUSES.PENDING || request.status === PTO_STATUSES.SUBMITTED) {
        pendingHours += request.totalHours;
      }
    }
  }

  return {
    userId,
    year,
    availableHours: baseHours,
    usedHours,
    pendingHours
  };
}
