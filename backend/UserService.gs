/**
 * User Service
 * Handles user-related operations
 */

/**
 * Get current authenticated user
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success response with user data
 */
function handleGetCurrentUser(currentUser) {
  return successResponse(currentUser);
}

/**
 * Get all users (Admin only)
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetUsers(currentUser) {
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  try {
    const users = getSheetData(SHEET_NAMES.USERS, COLUMN_MAPS.USERS, rowToUser);
    return successResponse(users);
  } catch (error) {
    Logger.log('Error in handleGetUsers: ' + error.message);
    return errorResponse('Failed to retrieve users', 'GET_USERS_ERROR');
  }
}

/**
 * Get manager's direct reports
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetDirectReports(currentUser) {
  if (!isManager(currentUser)) {
    return errorResponse('Unauthorized: Manager access required', 'UNAUTHORIZED');
  }

  try {
    const directReportIds = getDirectReportIds(currentUser.id);
    const allUsers = getSheetData(SHEET_NAMES.USERS, COLUMN_MAPS.USERS, rowToUser);

    const directReports = allUsers.filter(user => directReportIds.includes(user.id));

    return successResponse(directReports);
  } catch (error) {
    Logger.log('Error in handleGetDirectReports: ' + error.message);
    return errorResponse('Failed to retrieve direct reports', 'GET_REPORTS_ERROR');
  }
}
