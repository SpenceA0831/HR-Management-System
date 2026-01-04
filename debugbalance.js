/**
 * Diagnostic Script: Debug PTO Balance Calculation for 2026
 *
 * This script investigates why calculatePtoBalance() returns 0 used and 0 pending hours
 * when there are clearly 2 requests for user_001 in 2026.
 *
 * To run: Open Apps Script editor, select debugBalanceCalculation2026, and click Run
 */

/**
 * Main diagnostic function
 * Run this to see detailed diagnostics in View > Logs and summary in popup
 */
function debugBalanceCalculation2026() {
  const userId = 'user_001';
  const year = 2026;

  Logger.log('===============================================');
  Logger.log('PTO BALANCE CALCULATION DEBUG - USER: ' + userId + ', YEAR: ' + year);
  Logger.log('===============================================\n');

  // Step 1: Show PTO_STATUSES constants
  Logger.log('--- STEP 1: PTO Status Constants ---');
  Logger.log('PTO_STATUSES.APPROVED = "' + PTO_STATUSES.APPROVED + '"');
  Logger.log('PTO_STATUSES.SUBMITTED = "' + PTO_STATUSES.SUBMITTED + '"');
  Logger.log('PTO_STATUSES.DRAFT = "' + PTO_STATUSES.DRAFT + '"');
  Logger.log('PTO_STATUSES.DENIED = "' + PTO_STATUSES.DENIED + '"');
  Logger.log('PTO_STATUSES.CHANGES_REQUESTED = "' + PTO_STATUSES.CHANGES_REQUESTED + '"');
  Logger.log('PTO_STATUSES.CANCELLED = "' + PTO_STATUSES.CANCELLED + '"\n');

  // Step 2: Get all PTO requests from sheet
  Logger.log('--- STEP 2: Fetching PTO Requests from Sheet ---');
  let allRequests;
  try {
    allRequests = getSheetData(SHEET_NAMES.PTO_REQUESTS, COLUMN_MAPS.PTO_REQUESTS, rowToPtoRequest);
    Logger.log('Total requests in sheet: ' + allRequests.length + '\n');
  } catch (error) {
    Logger.log('ERROR fetching requests: ' + error.message);
    Browser.msgBox('Error', 'Failed to fetch PTO requests: ' + error.message, Browser.Buttons.OK);
    return;
  }

  // Step 3: Filter for user_001 requests
  Logger.log('--- STEP 3: Filtering for user_001 ---');
  const userRequests = allRequests.filter(req => req.userId === userId);
  Logger.log('Requests for user_001: ' + userRequests.length + '\n');

  if (userRequests.length === 0) {
    Logger.log('WARNING: No requests found for user_001');
    Browser.msgBox('Warning', 'No PTO requests found for user_001', Browser.Buttons.OK);
    return;
  }

  // Step 4: Analyze each request in detail
  Logger.log('--- STEP 4: Analyzing Each Request ---');

  let manualUsedHours = 0;
  let manualPendingHours = 0;
  let matches2026Count = 0;
  let approvedCount = 0;
  let submittedCount = 0;

  for (let i = 0; i < userRequests.length; i++) {
    const req = userRequests[i];

    Logger.log('Request #' + (i + 1) + ':');
    Logger.log('  Request ID: ' + req.id);
    Logger.log('  Start Date (raw): ' + req.startDate);
    Logger.log('  Start Date (type): ' + typeof req.startDate);

    // Parse year from startDate
    let requestYear = null;
    let dateParseError = null;
    try {
      const startDateObj = new Date(req.startDate);
      requestYear = startDateObj.getFullYear();
      Logger.log('  Parsed Year: ' + requestYear);
      Logger.log('  Date Object: ' + startDateObj.toISOString());
    } catch (error) {
      dateParseError = error.message;
      Logger.log('  ERROR parsing date: ' + error.message);
    }

    Logger.log('  Status (raw): "' + req.status + '"');
    Logger.log('  Status (type): ' + typeof req.status);
    Logger.log('  Total Hours: ' + req.totalHours);

    // Check if year matches 2026
    const matchesYear = (requestYear === year);
    Logger.log('  Matches year 2026? ' + matchesYear);
    if (matchesYear) {
      matches2026Count++;
    }

    // Check if status matches APPROVED
    const isApproved = (req.status === PTO_STATUSES.APPROVED);
    Logger.log('  Status === PTO_STATUSES.APPROVED? ' + isApproved);
    Logger.log('    ("' + req.status + '" === "' + PTO_STATUSES.APPROVED + '")');
    if (isApproved) {
      approvedCount++;
    }

    // Check if status matches SUBMITTED
    const isSubmitted = (req.status === PTO_STATUSES.SUBMITTED);
    Logger.log('  Status === PTO_STATUSES.SUBMITTED? ' + isSubmitted);
    Logger.log('    ("' + req.status + '" === "' + PTO_STATUSES.SUBMITTED + '")');
    if (isSubmitted) {
      submittedCount++;
    }

    // Manual calculation logic (matching calculatePtoBalance)
    if (matchesYear && !dateParseError) {
      if (req.status === PTO_STATUSES.APPROVED) {
        manualUsedHours += req.totalHours;
        Logger.log('  >>> ADDED TO USED HOURS: +' + req.totalHours);
      } else if (req.status === PTO_STATUSES.SUBMITTED) {
        manualPendingHours += req.totalHours;
        Logger.log('  >>> ADDED TO PENDING HOURS: +' + req.totalHours);
      } else {
        Logger.log('  >>> NOT COUNTED (status does not match APPROVED or SUBMITTED)');
      }
    } else {
      if (dateParseError) {
        Logger.log('  >>> NOT COUNTED (date parse error)');
      } else {
        Logger.log('  >>> NOT COUNTED (year does not match 2026)');
      }
    }

    Logger.log('');
  }

  // Step 5: Show manual calculation results
  Logger.log('--- STEP 5: Manual Calculation Summary ---');
  Logger.log('Requests matching year 2026: ' + matches2026Count);
  Logger.log('Requests with APPROVED status: ' + approvedCount);
  Logger.log('Requests with SUBMITTED status: ' + submittedCount);
  Logger.log('Manually calculated usedHours: ' + manualUsedHours);
  Logger.log('Manually calculated pendingHours: ' + manualPendingHours + '\n');

  // Step 6: Call actual calculatePtoBalance function
  Logger.log('--- STEP 6: Calling calculatePtoBalance() ---');
  let actualBalance;
  try {
    actualBalance = calculatePtoBalance(userId, year);
    Logger.log('Result from calculatePtoBalance():');
    Logger.log('  userId: ' + actualBalance.userId);
    Logger.log('  year: ' + actualBalance.year);
    Logger.log('  totalHours: ' + actualBalance.totalHours);
    Logger.log('  usedHours: ' + actualBalance.usedHours);
    Logger.log('  pendingHours: ' + actualBalance.pendingHours);
    Logger.log('  availableHours: ' + actualBalance.availableHours + '\n');
  } catch (error) {
    Logger.log('ERROR calling calculatePtoBalance: ' + error.message);
    Browser.msgBox('Error', 'Failed to call calculatePtoBalance: ' + error.message, Browser.Buttons.OK);
    return;
  }

  // Step 7: Compare manual vs actual
  Logger.log('--- STEP 7: Comparison ---');

  const usedMatch = (manualUsedHours === actualBalance.usedHours);
  const pendingMatch = (manualPendingHours === actualBalance.pendingHours);

  Logger.log('Manual usedHours: ' + manualUsedHours);
  Logger.log('Actual usedHours: ' + actualBalance.usedHours);
  Logger.log('MATCH? ' + usedMatch);
  if (!usedMatch) {
    Logger.log('  ⚠️ MISMATCH DETECTED! Difference: ' + (actualBalance.usedHours - manualUsedHours));
  }
  Logger.log('');

  Logger.log('Manual pendingHours: ' + manualPendingHours);
  Logger.log('Actual pendingHours: ' + actualBalance.pendingHours);
  Logger.log('MATCH? ' + pendingMatch);
  if (!pendingMatch) {
    Logger.log('  ⚠️ MISMATCH DETECTED! Difference: ' + (actualBalance.pendingHours - manualPendingHours));
  }
  Logger.log('');

  // Step 8: Additional diagnostic checks
  Logger.log('--- STEP 8: Additional Diagnostics ---');

  // Check for whitespace or special characters in status values
  Logger.log('Checking for whitespace/special characters in status values:');
  for (let i = 0; i < userRequests.length; i++) {
    const req = userRequests[i];
    const status = req.status;
    const trimmedStatus = status.trim();

    if (status !== trimmedStatus) {
      Logger.log('  ⚠️ Request ' + req.id + ' has whitespace! "' + status + '" (length: ' + status.length + ')');
    }

    // Check for hidden characters
    if (status.length !== trimmedStatus.length) {
      Logger.log('  ⚠️ Request ' + req.id + ' has hidden characters!');
      Logger.log('    Original length: ' + status.length);
      Logger.log('    Trimmed length: ' + trimmedStatus.length);
    }

    // Character code analysis
    if (status === PTO_STATUSES.APPROVED || status === PTO_STATUSES.SUBMITTED) {
      Logger.log('  Request ' + req.id + ' status appears correct: "' + status + '"');
    } else {
      Logger.log('  Request ' + req.id + ' status character codes:');
      let charCodes = '';
      for (let j = 0; j < status.length; j++) {
        charCodes += status.charCodeAt(j) + ' ';
      }
      Logger.log('    ' + charCodes);
    }
  }
  Logger.log('');

  // Check date serialization from Google Sheets
  Logger.log('Checking date serialization:');
  const sheet = getSheet(SHEET_NAMES.PTO_REQUESTS);
  const data = sheet.getDataRange().getValues();
  const colMap = COLUMN_MAPS.PTO_REQUESTS;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUserId = row[colMap.userId];

    if (rowUserId === userId) {
      const requestId = row[colMap.id];
      const rawStartDate = row[colMap.startDate];

      Logger.log('  Request ' + requestId + ':');
      Logger.log('    Raw startDate from sheet: ' + rawStartDate);
      Logger.log('    Type: ' + typeof rawStartDate);
      Logger.log('    Is Date object? ' + (rawStartDate instanceof Date));

      if (rawStartDate instanceof Date) {
        Logger.log('    Date.getFullYear(): ' + rawStartDate.getFullYear());
      }
    }
  }

  Logger.log('\n===============================================');
  Logger.log('END OF DIAGNOSTIC');
  Logger.log('===============================================');

  // Create summary message box
  let summary = 'PTO Balance Diagnostic Summary\n\n';
  summary += 'User: ' + userId + '\n';
  summary += 'Year: ' + year + '\n\n';
  summary += 'Requests found: ' + userRequests.length + '\n';
  summary += 'Matching 2026: ' + matches2026Count + '\n';
  summary += 'Approved: ' + approvedCount + '\n';
  summary += 'Submitted: ' + submittedCount + '\n\n';
  summary += 'Manual Calculation:\n';
  summary += '  Used: ' + manualUsedHours + ' hrs\n';
  summary += '  Pending: ' + manualPendingHours + ' hrs\n\n';
  summary += 'calculatePtoBalance() Result:\n';
  summary += '  Used: ' + actualBalance.usedHours + ' hrs\n';
  summary += '  Pending: ' + actualBalance.pendingHours + ' hrs\n\n';

  if (usedMatch && pendingMatch) {
    summary += 'Status: ✓ Values match!\n\n';
    summary += 'The calculation appears correct. Check:\n';
    summary += '1. Are the requests in the correct status?\n';
    summary += '2. Are the dates actually in 2026?\n';
  } else {
    summary += 'Status: ✗ MISMATCH DETECTED\n\n';
    summary += 'Check the detailed logs (View > Logs) for analysis.\n';
  }

  summary += '\nSee Apps Script Logs (View > Logs) for full details.';

  Browser.msgBox('Diagnostic Complete', summary, Browser.Buttons.OK);
}

/**
 * Helper function: Get raw sheet row for a specific request ID
 * Useful for debugging date/status storage issues
 */
function debugGetRawRequestRow(requestId) {
  const sheet = getSheet(SHEET_NAMES.PTO_REQUESTS);
  const data = sheet.getDataRange().getValues();
  const colMap = COLUMN_MAPS.PTO_REQUESTS;

  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap.id] === requestId) {
      Logger.log('Raw row data for request ' + requestId + ':');
      for (let j = 0; j < data[i].length; j++) {
        const colName = Object.keys(colMap).find(key => colMap[key] === j);
        Logger.log('  ' + colName + ' [' + j + ']: ' + data[i][j] + ' (type: ' + typeof data[i][j] + ')');
      }
      return data[i];
    }
  }

  Logger.log('Request ' + requestId + ' not found in sheet');
  return null;
}

/**
 * Quick test: Compare string equality with detailed character analysis
 */
function debugStringComparison(str1, str2) {
  Logger.log('String Comparison:');
  Logger.log('  String 1: "' + str1 + '" (length: ' + str1.length + ')');
  Logger.log('  String 2: "' + str2 + '" (length: ' + str2.length + ')');
  Logger.log('  Equal? ' + (str1 === str2));

  if (str1 !== str2) {
    Logger.log('  Character-by-character analysis:');
    const maxLen = Math.max(str1.length, str2.length);
    for (let i = 0; i < maxLen; i++) {
      const char1 = i < str1.length ? str1[i] : '(none)';
      const char2 = i < str2.length ? str2[i] : '(none)';
      const code1 = i < str1.length ? str1.charCodeAt(i) : -1;
      const code2 = i < str2.length ? str2.charCodeAt(i) : -1;

      if (char1 !== char2) {
        Logger.log('    Position ' + i + ': "' + char1 + '" (' + code1 + ') vs "' + char2 + '" (' + code2 + ') ✗');
      }
    }
  }
}
