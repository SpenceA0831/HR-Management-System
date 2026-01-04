/**
 * Holiday and Blackout Date Service
 * Manages company holidays and blackout dates for PTO requests
 */

/**
 * Get all holidays (public endpoint - no auth required)
 * @returns {Object} Success or error response
 */
function handleGetHolidaysPublic() {
  try {
    const holidays = getSheetData(SHEET_NAMES.HOLIDAYS, COLUMN_MAPS.HOLIDAYS, rowToHoliday);
    return successResponse(holidays);
  } catch (error) {
    Logger.log('Error in handleGetHolidaysPublic: ' + error.message);
    return errorResponse('Failed to retrieve holidays', 'GET_HOLIDAYS_ERROR');
  }
}

/**
 * Get all holidays (authenticated endpoint - kept for backward compatibility)
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetHolidays(currentUser) {
  return handleGetHolidaysPublic();
}

/**
 * Create a new holiday (Admin only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Holiday data
 * @returns {Object} Success or error response
 */
function handleCreateHoliday(currentUser, payload) {
  if (!canManageHolidaysAndBlackouts(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  const { date, endDate, name } = payload;

  if (!date || !name) {
    return errorResponse('Missing required fields: date, name', 'MISSING_PARAMETERS');
  }

  try {
    const id = generateId('holiday');
    const colMap = COLUMN_MAPS.HOLIDAYS;

    const rowData = Array(Object.keys(colMap).length).fill('');
    rowData[colMap.id] = id;
    rowData[colMap.date] = date;
    rowData[colMap.endDate] = endDate || '';  // Optional end date for multi-day holidays
    rowData[colMap.name] = name;

    appendRow(SHEET_NAMES.HOLIDAYS, rowData);

    const holiday = { id, date, endDate: endDate || undefined, name };
    return successResponse(holiday);
  } catch (error) {
    Logger.log('Error in handleCreateHoliday: ' + error.message);
    return errorResponse('Failed to create holiday', 'CREATE_HOLIDAY_ERROR');
  }
}

/**
 * Delete a holiday (Admin only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {holidayId}
 * @returns {Object} Success or error response
 */
function handleDeleteHoliday(currentUser, payload) {
  if (!canManageHolidaysAndBlackouts(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  const { holidayId } = payload;

  if (!holidayId) {
    return errorResponse('Missing holidayId parameter', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.HOLIDAYS);
    const rowIndex = findRowById(sheet, COLUMN_MAPS.HOLIDAYS.id, holidayId);

    if (rowIndex === -1) {
      return errorResponse('Holiday not found', 'NOT_FOUND');
    }

    deleteRow(SHEET_NAMES.HOLIDAYS, rowIndex);

    return successResponse({ deleted: true, holidayId });
  } catch (error) {
    Logger.log('Error in handleDeleteHoliday: ' + error.message);
    return errorResponse('Failed to delete holiday', 'DELETE_HOLIDAY_ERROR');
  }
}

/**
 * Get all blackout dates (public endpoint - no auth required)
 * @returns {Object} Success or error response
 */
function handleGetBlackoutDatesPublic() {
  try {
    const blackoutDates = getSheetData(SHEET_NAMES.BLACKOUT_DATES, COLUMN_MAPS.BLACKOUT_DATES, rowToBlackoutDate);
    return successResponse(blackoutDates);
  } catch (error) {
    Logger.log('Error in handleGetBlackoutDatesPublic: ' + error.message);
    return errorResponse('Failed to retrieve blackout dates', 'GET_BLACKOUT_ERROR');
  }
}

/**
 * Get all blackout dates (authenticated endpoint - kept for backward compatibility)
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetBlackoutDates(currentUser) {
  return handleGetBlackoutDatesPublic();
}

/**
 * Create a blackout date (Admin only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {date, name}
 * @returns {Object} Success or error response
 */
function handleCreateBlackoutDate(currentUser, payload) {
  if (!canManageHolidaysAndBlackouts(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  const { date, endDate, name } = payload;

  if (!date || !name) {
    return errorResponse('Missing required fields: date, name', 'MISSING_PARAMETERS');
  }

  try {
    const id = generateId('blackout');
    const colMap = COLUMN_MAPS.BLACKOUT_DATES;

    const rowData = Array(Object.keys(colMap).length).fill('');
    rowData[colMap.id] = id;
    rowData[colMap.date] = date;
    rowData[colMap.endDate] = endDate || '';  // Optional end date for multi-day blackout periods
    rowData[colMap.name] = name;
    rowData[colMap.createdBy] = currentUser.id;
    rowData[colMap.createdAt] = getCurrentTimestamp();

    appendRow(SHEET_NAMES.BLACKOUT_DATES, rowData);

    const blackoutDate = {
      id,
      date,
      endDate: endDate || undefined,
      name,
      createdBy: currentUser.id,
      createdAt: rowData[colMap.createdAt]
    };

    return successResponse(blackoutDate);
  } catch (error) {
    Logger.log('Error in handleCreateBlackoutDate: ' + error.message);
    return errorResponse('Failed to create blackout date', 'CREATE_BLACKOUT_ERROR');
  }
}

/**
 * Delete a blackout date (Admin only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {blackoutId}
 * @returns {Object} Success or error response
 */
function handleDeleteBlackoutDate(currentUser, payload) {
  if (!canManageHolidaysAndBlackouts(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  const { blackoutId } = payload;

  if (!blackoutId) {
    return errorResponse('Missing blackoutId parameter', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.BLACKOUT_DATES);
    const rowIndex = findRowById(sheet, COLUMN_MAPS.BLACKOUT_DATES.id, blackoutId);

    if (rowIndex === -1) {
      return errorResponse('Blackout date not found', 'NOT_FOUND');
    }

    deleteRow(SHEET_NAMES.BLACKOUT_DATES, rowIndex);

    return successResponse({ deleted: true, blackoutId });
  } catch (error) {
    Logger.log('Error in handleDeleteBlackoutDate: ' + error.message);
    return errorResponse('Failed to delete blackout date', 'DELETE_BLACKOUT_ERROR');
  }
}
