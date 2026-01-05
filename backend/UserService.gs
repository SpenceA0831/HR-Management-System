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
 * Get user by email address (public endpoint for OAuth)
 * @param {Object} payload - Request payload containing email
 * @returns {Object} Success or error response
 */
function handleGetUserByEmail(payload) {
  try {
    const email = payload.email;

    if (!email) {
      return errorResponse('Email is required', 'EMAIL_REQUIRED');
    }

    const users = getSheetData(SHEET_NAMES.USERS, COLUMN_MAPS.USERS, rowToUser);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return errorResponse('User not found in system. Please contact your administrator.', 'USER_NOT_FOUND');
    }

    return successResponse(user);
  } catch (error) {
    Logger.log('Error in handleGetUserByEmail: ' + error.toString());
    return errorResponse('Failed to retrieve user', 'GET_USER_ERROR');
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

/**
 * Create a new user (Admin only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - User data
 * @returns {Object} Success or error response
 */
function handleCreateUser(currentUser, payload) {
  if (!isAdmin(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  try {
    const { name, email, userRole, teamId, managerId, employmentType, hireDate, roleType } = payload;

    // Validate required fields
    if (!name || !email || !userRole) {
      return errorResponse('Missing required fields: name, email, or userRole', 'INVALID_DATA');
    }

    // Check if user already exists
    const allUsers = getSheetData(SHEET_NAMES.USERS, COLUMN_MAPS.USERS, rowToUser);
    const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return errorResponse('User with this email already exists', 'DUPLICATE_USER');
    }

    const newUser = {
      id: generateId('user'),
      name,
      email,
      userRole,
      teamId: teamId || '',
      managerId: managerId || '',
      employmentType: employmentType || '',
      hireDate: hireDate || '',
      roleType: roleType || '',
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Construct row based on COLUMN_MAPS.USERS
    // Mappings: id:0, name:1, email:2, userRole:3, teamId:4, managerId:5, 
    // employmentType:6, hireDate:7, roleType:8, avatar:9, createdAt:10, updatedAt:11
    const row = [];
    const map = COLUMN_MAPS.USERS;
    
    row[map.id] = newUser.id;
    row[map.name] = newUser.name;
    row[map.email] = newUser.email;
    row[map.userRole] = newUser.userRole;
    row[map.teamId] = newUser.teamId;
    row[map.managerId] = newUser.managerId;
    row[map.employmentType] = newUser.employmentType;
    row[map.hireDate] = newUser.hireDate;
    row[map.roleType] = newUser.roleType;
    row[map.avatar] = newUser.avatar;
    row[map.createdAt] = newUser.createdAt;
    row[map.updatedAt] = newUser.updatedAt;

    appendRow(SHEET_NAMES.USERS, row);

    return successResponse(newUser);
  } catch (error) {
    Logger.log('Error in handleCreateUser: ' + error.message);
    return errorResponse('Failed to create user', 'CREATE_USER_ERROR');
  }
}
