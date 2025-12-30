/**
 * Test Pending Hours Calculation
 * Verifies that Submitted requests are counted correctly
 */

function testPendingHoursCalculation() {
  const userId = 'user_001';
  const year = 2025;

  // Get all requests for this user
  const allRequests = getSheetData(SHEET_NAMES.PTO_REQUESTS, COLUMN_MAPS.PTO_REQUESTS, rowToPtoRequest);
  const userRequests = allRequests.filter(req => req.userId === userId);

  let report = 'PENDING HOURS CALCULATION TEST\n';
  report += '='.repeat(60) + '\n\n';
  report += 'User: ' + userId + '\n';
  report += 'Year: ' + year + '\n\n';

  let pendingHours = 0;
  let usedHours = 0;

  report += 'ALL REQUESTS:\n';
  for (const request of userRequests) {
    const requestYear = new Date(request.startDate).getFullYear();

    report += '\nRequest: ' + request.id + '\n';
    report += '  Status: "' + request.status + '"\n';
    report += '  Total Hours: ' + request.totalHours + '\n';
    report += '  Start Date: ' + request.startDate + '\n';
    report += '  Year: ' + requestYear + '\n';

    if (requestYear === year) {
      report += '  ✓ In target year (' + year + ')\n';

      if (request.status === PTO_STATUSES.APPROVED) {
        usedHours += request.totalHours;
        report += '  → Counted as USED\n';
      } else if (request.status === PTO_STATUSES.SUBMITTED) {
        pendingHours += request.totalHours;
        report += '  → Counted as PENDING\n';
      } else {
        report += '  → NOT COUNTED (status: ' + request.status + ')\n';
      }
    } else {
      report += '  ✗ Different year (request: ' + requestYear + ', target: ' + year + ')\n';
    }
  }

  report += '\n' + '='.repeat(60) + '\n';
  report += 'CALCULATION RESULTS:\n';
  report += '  Used Hours: ' + usedHours + '\n';
  report += '  Pending Hours: ' + pendingHours + '\n';

  report += '\n' + '='.repeat(60) + '\n';
  report += 'STATUS CONSTANTS:\n';
  report += '  PTO_STATUSES.SUBMITTED = "' + PTO_STATUSES.SUBMITTED + '"\n';
  report += '  PTO_STATUSES.APPROVED = "' + PTO_STATUSES.APPROVED + '"\n';

  Logger.log(report);

  Browser.msgBox(
    'Pending Hours Test',
    'User: ' + userId + '\n\n' +
    'Pending Hours: ' + pendingHours + '\n' +
    'Used Hours: ' + usedHours + '\n\n' +
    'Check execution log for full details',
    Browser.Buttons.OK
  );
}

/**
 * Check what's in the PtoRequests sheet for a specific user
 */
function inspectPtoRequests() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PtoRequests');

  if (!sheet) {
    Browser.msgBox('PtoRequests sheet not found!');
    return;
  }

  const data = sheet.getDataRange().getValues();

  let report = 'PtoRequests Sheet Inspection:\n\n';

  for (let i = 1; i < Math.min(data.length, 6); i++) {
    const row = data[i];
    report += 'Row ' + (i + 1) + ':\n';
    report += '  ID: ' + row[0] + '\n';
    report += '  User ID: ' + row[1] + '\n';
    report += '  Status (col L): "' + row[11] + '"\n';
    report += '  Total Hours (col I): ' + row[8] + '\n';
    report += '  Start Date (col E): ' + row[4] + '\n\n';
  }

  Logger.log(report);
  Browser.msgBox('Sheet Inspection', 'Check execution log for details', Browser.Buttons.OK);
}
