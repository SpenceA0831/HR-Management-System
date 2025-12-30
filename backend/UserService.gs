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
 * Get demo users for login page (public endpoint - no auth required)
 * Returns only safe fields needed for demo login
 * @returns {Object} Success response with user data
 */
function handleGetDemoUsers() {
  try {
    const users = getSheetData(SHEET_NAMES.USERS, COLUMN_MAPS.USERS, rowToUser);

    // Only return fields needed for demo login
    const demoUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userRole: user.userRole,
      teamId: user.teamId,
      employmentType: user.employmentType,
      hireDate: user.hireDate,
      roleType: user.roleType,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return successResponse(demoUsers);
  } catch (error) {
    Logger.log('Error in handleGetDemoUsers: ' + error.message);
    return errorResponse('Failed to retrieve demo users', 'GET_DEMO_USERS_ERROR');
  }
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
