/**
 * System Configuration Service
 * Manages PTO system settings
 */

/**
 * Get system configuration
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetSystemConfig(currentUser) {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_CONFIG);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      // Return default config if none exists
      return successResponse({
        defaultFullTimeHours: 120,
        defaultPartTimeHours: 60,
        prorateByHireDate: true,
        fullTeamCalendarVisible: true,
        shortNoticeThresholdDays: 7,
        sharedCalendarId: 'c_bbe5eba035ea3848deef6d1e6949f8b8dca77f3f14e8e6b9bdd727953c107631@group.calendar.google.com'
      });
    }

    const colMap = COLUMN_MAPS.SYSTEM_CONFIG;
    const row = data[1]; // Second row (first row is headers)

    const config = {
      defaultFullTimeHours: row[colMap.defaultFullTimeHours] || 120,
      defaultPartTimeHours: row[colMap.defaultPartTimeHours] || 60,
      prorateByHireDate: row[colMap.prorateByHireDate] === true || row[colMap.prorateByHireDate] === 'TRUE',
      fullTeamCalendarVisible: row[colMap.fullTeamCalendarVisible] === true || row[colMap.fullTeamCalendarVisible] === 'TRUE',
      shortNoticeThresholdDays: row[colMap.shortNoticeThresholdDays] || 7,
      sharedCalendarId: row[colMap.sharedCalendarId] || 'c_bbe5eba035ea3848deef6d1e6949f8b8dca77f3f14e8e6b9bdd727953c107631@group.calendar.google.com'
    };

    return successResponse(config);
  } catch (error) {
    Logger.log('Error in handleGetSystemConfig: ' + error.message);
    return errorResponse('Failed to retrieve system configuration', 'GET_CONFIG_ERROR');
  }
}

/**
 * Update system configuration (Admin only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Configuration updates
 * @returns {Object} Success or error response
 */
function handleUpdateSystemConfig(currentUser, payload) {
  if (!canManageSystemConfig(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_CONFIG);
    const colMap = COLUMN_MAPS.SYSTEM_CONFIG;

    // Get current config or create default
    let rowData = Array(Object.keys(colMap).length).fill('');
    const data = sheet.getDataRange().getValues();

    if (data.length >= 2) {
      rowData = data[1]; // Existing config row
    }

    // Update values from payload
    if (payload.defaultFullTimeHours !== undefined) {
      rowData[colMap.defaultFullTimeHours] = payload.defaultFullTimeHours;
    }
    if (payload.defaultPartTimeHours !== undefined) {
      rowData[colMap.defaultPartTimeHours] = payload.defaultPartTimeHours;
    }
    if (payload.prorateByHireDate !== undefined) {
      rowData[colMap.prorateByHireDate] = payload.prorateByHireDate;
    }
    if (payload.fullTeamCalendarVisible !== undefined) {
      rowData[colMap.fullTeamCalendarVisible] = payload.fullTeamCalendarVisible;
    }
    if (payload.shortNoticeThresholdDays !== undefined) {
      rowData[colMap.shortNoticeThresholdDays] = payload.shortNoticeThresholdDays;
    }
    if (payload.sharedCalendarId !== undefined) {
      rowData[colMap.sharedCalendarId] = payload.sharedCalendarId;
    }

    // Update or create row
    if (data.length >= 2) {
      updateRow(SHEET_NAMES.SYSTEM_CONFIG, 2, rowData); // Row 2 (1-based)
    } else {
      appendRow(SHEET_NAMES.SYSTEM_CONFIG, rowData);
    }

    const config = {
      defaultFullTimeHours: rowData[colMap.defaultFullTimeHours],
      defaultPartTimeHours: rowData[colMap.defaultPartTimeHours],
      prorateByHireDate: rowData[colMap.prorateByHireDate],
      fullTeamCalendarVisible: rowData[colMap.fullTeamCalendarVisible],
      shortNoticeThresholdDays: rowData[colMap.shortNoticeThresholdDays],
      sharedCalendarId: rowData[colMap.sharedCalendarId]
    };

    return successResponse(config);
  } catch (error) {
    Logger.log('Error in handleUpdateSystemConfig: ' + error.message);
    return errorResponse('Failed to update system configuration', 'UPDATE_CONFIG_ERROR');
  }
}
