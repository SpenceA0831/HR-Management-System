/**
 * PTO Request Service
 * Handles PTO request CRUD operations, approvals, and cancellations
 */

/**
 * Get PTO requests with optional filters
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {userId (optional), status (optional), startDate (optional), endDate (optional)}
 * @returns {Object} Success or error response
 */
function handleGetPtoRequests(currentUser, payload) {
  try {
    const allRequests = getSheetData(SHEET_NAMES.PTO_REQUESTS, COLUMN_MAPS.PTO_REQUESTS, rowToPtoRequest);

    // Filter by authorization
    let filteredRequests = allRequests.filter(req => canAccessPtoRequest(currentUser, req));

    // Apply optional filters
    if (payload.userId) {
      filteredRequests = filteredRequests.filter(req => req.userId === payload.userId);
    }

    if (payload.status) {
      filteredRequests = filteredRequests.filter(req => req.status === payload.status);
    }

    if (payload.startDate) {
      filteredRequests = filteredRequests.filter(req => req.startDate >= payload.startDate);
    }

    if (payload.endDate) {
      filteredRequests = filteredRequests.filter(req => req.endDate <= payload.endDate);
    }

    return successResponse(filteredRequests);
  } catch (error) {
    Logger.log('Error in handleGetPtoRequests: ' + error.message);
    return errorResponse('Failed to retrieve PTO requests', 'GET_REQUESTS_ERROR');
  }
}

/**
 * Get a single PTO request by ID
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {requestId}
 * @returns {Object} Success or error response
 */
function handleGetPtoRequest(currentUser, payload) {
  const { requestId } = payload;

  if (!requestId) {
    return errorResponse('Missing requestId parameter', 'MISSING_PARAMETER');
  }

  try {
    const allRequests = getSheetData(SHEET_NAMES.PTO_REQUESTS, COLUMN_MAPS.PTO_REQUESTS, rowToPtoRequest);
    const request = allRequests.find(req => req.id === requestId);

    if (!request) {
      return errorResponse('PTO request not found', 'NOT_FOUND');
    }

    if (!canAccessPtoRequest(currentUser, request)) {
      return errorResponse('Unauthorized: Cannot access this request', 'UNAUTHORIZED');
    }

    return successResponse(request);
  } catch (error) {
    Logger.log('Error in handleGetPtoRequest: ' + error.message);
    return errorResponse('Failed to retrieve PTO request', 'GET_REQUEST_ERROR');
  }
}

/**
 * Create a new PTO request
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request data
 * @returns {Object} Success or error response
 */
function handleCreatePtoRequest(currentUser, payload) {
  const { type, startDate, endDate, isHalfDayStart, isHalfDayEnd, reason, attachment, status } = payload;

  if (!type || !startDate || !endDate) {
    return errorResponse('Missing required fields: type, startDate, endDate', 'MISSING_PARAMETERS');
  }

  try {
    // Get holidays for calculation
    const holidays = getSheetData(SHEET_NAMES.HOLIDAYS, COLUMN_MAPS.HOLIDAYS, rowToHoliday);

    // Calculate total days
    const totalDays = calculateTotalDays(
      startDate,
      endDate,
      isHalfDayStart || false,
      isHalfDayEnd || false,
      holidays
    );

    // Check for blackout date conflicts
    const blackoutDates = getSheetData(SHEET_NAMES.BLACKOUT_DATES, COLUMN_MAPS.BLACKOUT_DATES, rowToBlackoutDate);
    const blackoutConflict = hasBlackoutConflict(startDate, endDate, blackoutDates);

    if (blackoutConflict.conflict) {
      return errorResponse(
        `PTO request conflicts with blackout date: ${blackoutConflict.name} on ${blackoutConflict.date}`,
        'BLACKOUT_CONFLICT'
      );
    }

    // Get approver (user's manager)
    const approver = currentUser.managerId ? getUserById(currentUser.managerId) : null;

    if (!approver) {
      return errorResponse('No manager assigned. Please contact your administrator.', 'NO_APPROVER');
    }

    // Create request
    const id = generateId('pto');
    const now = getCurrentTimestamp();

    // Use the provided status or default to DRAFT
    const requestStatus = status || PTO_STATUSES.DRAFT;

    const history = [
      {
        timestamp: now.toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: requestStatus === PTO_STATUSES.SUBMITTED ? 'Submitted' : 'Created',
        note: requestStatus === PTO_STATUSES.SUBMITTED ? 'Request submitted for approval' : 'Request created as draft'
      }
    ];

    const colMap = COLUMN_MAPS.PTO_REQUESTS;
    const rowData = Array(Object.keys(colMap).length).fill('');

    rowData[colMap.id] = id;
    rowData[colMap.userId] = currentUser.id;
    rowData[colMap.userName] = currentUser.name;
    rowData[colMap.type] = type;
    rowData[colMap.startDate] = startDate;
    rowData[colMap.endDate] = endDate;
    rowData[colMap.isHalfDayStart] = isHalfDayStart || false;
    rowData[colMap.isHalfDayEnd] = isHalfDayEnd || false;
    rowData[colMap.totalDays] = totalDays;
    rowData[colMap.reason] = reason || '';
    rowData[colMap.attachment] = attachment || '';
    rowData[colMap.status] = requestStatus;
    rowData[colMap.managerComment] = '';
    rowData[colMap.employeeComment] = '';
    rowData[colMap.approverId] = approver.id;
    rowData[colMap.approverName] = approver.name;
    rowData[colMap.createdAt] = now;
    rowData[colMap.updatedAt] = now;
    rowData[colMap.history] = JSON.stringify(history);

    appendRow(SHEET_NAMES.PTO_REQUESTS, rowData);

    const request = rowToPtoRequest(colMap, rowData);
    return successResponse(request);
  } catch (error) {
    Logger.log('Error in handleCreatePtoRequest: ' + error.message);
    return errorResponse('Failed to create PTO request: ' + error.message, 'CREATE_REQUEST_ERROR');
  }
}

/**
 * Update a PTO request (Draft or ChangesRequested status only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {requestId, updates}
 * @returns {Object} Success or error response
 */
function handleUpdatePtoRequest(currentUser, payload) {
  const { requestId, updates } = payload;

  if (!requestId) {
    return errorResponse('Missing requestId parameter', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.PTO_REQUESTS);
    const colMap = COLUMN_MAPS.PTO_REQUESTS;
    const rowIndex = findRowById(sheet, colMap.id, requestId);

    if (rowIndex === -1) {
      return errorResponse('PTO request not found', 'NOT_FOUND');
    }

    const data = sheet.getDataRange().getValues();
    const rowData = data[rowIndex - 1];
    const request = rowToPtoRequest(colMap, rowData);

    if (!canModifyPtoRequest(currentUser, request, 'EDIT')) {
      return errorResponse('Unauthorized: Cannot edit this request', 'UNAUTHORIZED');
    }

    // Update allowed fields
    if (updates.type) rowData[colMap.type] = updates.type;
    if (updates.startDate) rowData[colMap.startDate] = updates.startDate;
    if (updates.endDate) rowData[colMap.endDate] = updates.endDate;
    if (updates.isHalfDayStart !== undefined) rowData[colMap.isHalfDayStart] = updates.isHalfDayStart;
    if (updates.isHalfDayEnd !== undefined) rowData[colMap.isHalfDayEnd] = updates.isHalfDayEnd;
    if (updates.reason !== undefined) rowData[colMap.reason] = updates.reason;
    if (updates.attachment !== undefined) rowData[colMap.attachment] = updates.attachment;
    if (updates.employeeComment !== undefined) rowData[colMap.employeeComment] = updates.employeeComment;
    if (updates.status) rowData[colMap.status] = updates.status;

    // Recalculate total hours if dates changed
    if (updates.startDate || updates.endDate || updates.isHalfDayStart !== undefined || updates.isHalfDayEnd !== undefined) {
      const holidays = getSheetData(SHEET_NAMES.HOLIDAYS, COLUMN_MAPS.HOLIDAYS, rowToHoliday);
      rowData[colMap.totalDays] = calculateTotalDays(
        rowData[colMap.startDate],
        rowData[colMap.endDate],
        rowData[colMap.isHalfDayStart],
        rowData[colMap.isHalfDayEnd],
        holidays
      );
    }

    // Update timestamp and history
    rowData[colMap.updatedAt] = getCurrentTimestamp();
    const history = JSON.parse(rowData[colMap.history] || '[]');
    rowData[colMap.history] = addAuditEntry(history, currentUser.id, currentUser.name, 'Updated', 'Request updated');

    updateRow(SHEET_NAMES.PTO_REQUESTS, rowIndex, rowData);

    const updatedRequest = rowToPtoRequest(colMap, rowData);
    return successResponse(updatedRequest);
  } catch (error) {
    Logger.log('Error in handleUpdatePtoRequest: ' + error.message);
    return errorResponse('Failed to update PTO request', 'UPDATE_REQUEST_ERROR');
  }
}

/**
 * Approve a PTO request (Manager/Approver only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {requestId, comment (optional)}
 * @returns {Object} Success or error response
 */
function handleApprovePtoRequest(currentUser, payload) {
  const { requestId, comment } = payload;

  if (!requestId) {
    return errorResponse('Missing requestId parameter', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.PTO_REQUESTS);
    const colMap = COLUMN_MAPS.PTO_REQUESTS;
    const rowIndex = findRowById(sheet, colMap.id, requestId);

    if (rowIndex === -1) {
      return errorResponse('PTO request not found', 'NOT_FOUND');
    }

    const data = sheet.getDataRange().getValues();
    const rowData = data[rowIndex - 1];
    const request = rowToPtoRequest(colMap, rowData);

    if (!canModifyPtoRequest(currentUser, request, 'APPROVE')) {
      return errorResponse('Unauthorized: Cannot approve this request', 'UNAUTHORIZED');
    }

    // Update status to Approved
    rowData[colMap.status] = PTO_STATUSES.APPROVED;
    rowData[colMap.managerComment] = comment || 'Approved';
    rowData[colMap.updatedAt] = getCurrentTimestamp();

    const history = JSON.parse(rowData[colMap.history] || '[]');
    rowData[colMap.history] = addAuditEntry(
      history,
      currentUser.id,
      currentUser.name,
      'Approved',
      comment || 'Request approved'
    );

    updateRow(SHEET_NAMES.PTO_REQUESTS, rowIndex, rowData);

    // Sync balance to sheet after approval
    try {
      const requestYear = new Date(request.startDate).getFullYear();
      syncBalanceToSheet(request.userId, requestYear);
    } catch (balanceError) {
      Logger.log('Failed to sync balance after approval: ' + balanceError.message);
      // Continue - don't fail the approval if balance sync fails
    }

    // Add to Google Calendar
    try {
      addPtoToCalendar(request);
    } catch (calendarError) {
      Logger.log('Failed to add PTO to calendar: ' + calendarError.message);
      // Continue - don't fail the approval if calendar fails
    }

    const updatedRequest = rowToPtoRequest(colMap, rowData);
    return successResponse(updatedRequest);
  } catch (error) {
    Logger.log('Error in handleApprovePtoRequest: ' + error.message);
    return errorResponse('Failed to approve PTO request', 'APPROVE_REQUEST_ERROR');
  }
}

/**
 * Deny a PTO request (Manager/Approver only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {requestId, comment}
 * @returns {Object} Success or error response
 */
function handleDenyPtoRequest(currentUser, payload) {
  const { requestId, comment } = payload;

  if (!requestId) {
    return errorResponse('Missing requestId parameter', 'MISSING_PARAMETER');
  }

  if (!comment) {
    return errorResponse('Comment required when denying a request', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.PTO_REQUESTS);
    const colMap = COLUMN_MAPS.PTO_REQUESTS;
    const rowIndex = findRowById(sheet, colMap.id, requestId);

    if (rowIndex === -1) {
      return errorResponse('PTO request not found', 'NOT_FOUND');
    }

    const data = sheet.getDataRange().getValues();
    const rowData = data[rowIndex - 1];
    const request = rowToPtoRequest(colMap, rowData);

    if (!canModifyPtoRequest(currentUser, request, 'DENY')) {
      return errorResponse('Unauthorized: Cannot deny this request', 'UNAUTHORIZED');
    }

    // Update status to Denied
    rowData[colMap.status] = PTO_STATUSES.DENIED;
    rowData[colMap.managerComment] = comment;
    rowData[colMap.updatedAt] = getCurrentTimestamp();

    const history = JSON.parse(rowData[colMap.history] || '[]');
    rowData[colMap.history] = addAuditEntry(history, currentUser.id, currentUser.name, 'Denied', comment);

    updateRow(SHEET_NAMES.PTO_REQUESTS, rowIndex, rowData);

    // Sync balance to sheet after denial (to update pending hours)
    try {
      const requestYear = new Date(request.startDate).getFullYear();
      syncBalanceToSheet(request.userId, requestYear);
    } catch (balanceError) {
      Logger.log('Failed to sync balance after denial: ' + balanceError.message);
      // Continue - don't fail the denial if balance sync fails
    }

    const updatedRequest = rowToPtoRequest(colMap, rowData);
    return successResponse(updatedRequest);
  } catch (error) {
    Logger.log('Error in handleDenyPtoRequest: ' + error.message);
    return errorResponse('Failed to deny PTO request', 'DENY_REQUEST_ERROR');
  }
}

/**
 * Cancel a PTO request (Employee only)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - {requestId}
 * @returns {Object} Success or error response
 */
function handleCancelPtoRequest(currentUser, payload) {
  const { requestId } = payload;

  if (!requestId) {
    return errorResponse('Missing requestId parameter', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.PTO_REQUESTS);
    const colMap = COLUMN_MAPS.PTO_REQUESTS;
    const rowIndex = findRowById(sheet, colMap.id, requestId);

    if (rowIndex === -1) {
      return errorResponse('PTO request not found', 'NOT_FOUND');
    }

    const data = sheet.getDataRange().getValues();
    const rowData = data[rowIndex - 1];
    const request = rowToPtoRequest(colMap, rowData);

    if (!canModifyPtoRequest(currentUser, request, 'CANCEL')) {
      return errorResponse('Unauthorized: Cannot cancel this request', 'UNAUTHORIZED');
    }

    // Update status to Cancelled
    rowData[colMap.status] = PTO_STATUSES.CANCELLED;
    rowData[colMap.updatedAt] = getCurrentTimestamp();

    const history = JSON.parse(rowData[colMap.history] || '[]');
    rowData[colMap.history] = addAuditEntry(
      history,
      currentUser.id,
      currentUser.name,
      'Cancelled',
      'Request cancelled by employee'
    );

    updateRow(SHEET_NAMES.PTO_REQUESTS, rowIndex, rowData);

    const updatedRequest = rowToPtoRequest(colMap, rowData);
    return successResponse(updatedRequest);
  } catch (error) {
    Logger.log('Error in handleCancelPtoRequest: ' + error.message);
    return errorResponse('Failed to cancel PTO request', 'CANCEL_REQUEST_ERROR');
  }
}

/**
 * Add approved PTO request to Google Calendar
 * @param {Object} request - The PTO request object
 */
/**
 * Add approved PTO request to Google Calendar
 * @param {Object} request - The PTO request object
 */
function addPtoToCalendar(request) {
  try {
    // Get calendar ID from system config
    const configResponse = handleGetSystemConfig(null);
    if (!configResponse.success || !configResponse.data) {
      throw new Error('Failed to retrieve system configuration for calendar ID');
    }

    const calendarId = configResponse.data.sharedCalendarId;

    if (!calendarId) {
      Logger.log('No shared calendar ID configured. Skipping calendar event creation.');
      return;
    }

    const calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {
      throw new Error('Calendar not found or no access with ID: ' + calendarId);
    }

    // Parse dates
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    // Create event title
    const eventTitle = request.userName + ' - Out of Office';

    // Create description with PTO details
    const description = 'PTO Type: ' + request.type + '\n' +
      'Total Days: ' + request.totalDays + '\n' +
      (request.reason ? 'Reason: ' + request.reason : '');

    // Handle half-day events
    if (request.isHalfDayStart && request.isHalfDayEnd &&
      startDate.toDateString() === endDate.toDateString()) {
      // Single half day - create 4-hour event
      const eventStart = new Date(startDate);
      eventStart.setHours(9, 0, 0, 0);
      const eventEnd = new Date(startDate);
      eventEnd.setHours(13, 0, 0, 0);

      calendar.createEvent(eventTitle, eventStart, eventEnd, {
        description: description,
        location: 'Out of Office'
      });
    } else if (request.isHalfDayStart || request.isHalfDayEnd) {
      // Partial days - create events for each day
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const isFirstDay = currentDate.toDateString() === startDate.toDateString();
        const isLastDay = currentDate.toDateString() === endDate.toDateString();

        if ((isFirstDay && request.isHalfDayStart) || (isLastDay && request.isHalfDayEnd)) {
          // Half day event
          const eventStart = new Date(currentDate);
          eventStart.setHours(9, 0, 0, 0);
          const eventEnd = new Date(currentDate);
          eventEnd.setHours(13, 0, 0, 0);

          calendar.createEvent(eventTitle, eventStart, eventEnd, {
            description: description,
            location: 'Out of Office'
          });
        } else {
          // Full day event
          calendar.createAllDayEvent(eventTitle, currentDate, {
            description: description,
            location: 'Out of Office'
          });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Full days - create all-day event
      // Add 1 day to end date for all-day events (Google Calendar exclusive end date)
      const calendarEndDate = new Date(endDate);
      calendarEndDate.setDate(calendarEndDate.getDate() + 1);

      calendar.createAllDayEvent(eventTitle, startDate, calendarEndDate, {
        description: description,
        location: 'Out of Office'
      });
    }

    Logger.log('Successfully added PTO to calendar for ' + request.userName);
  } catch (error) {
    Logger.log('Error adding PTO to calendar: ' + error.message);
    throw error;
  }
}
