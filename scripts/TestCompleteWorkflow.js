/**
 * Comprehensive PTO Workflow Test Script
 * Tests the complete lifecycle of a PTO request with 2026 data:
 * 1. Create draft request
 * 2. Submit request (verify pending hours)
 * 3. Approve request (verify used hours, pending decreases)
 * 4. Balance calculations at each step
 *
 * Run this from the Google Apps Script editor after deploying all backend changes
 */

function testCompleteWorkflow() {
  Logger.log('='.repeat(80));
  Logger.log('COMPLETE PTO WORKFLOW TEST - 2026 REQUESTS');
  Logger.log('='.repeat(80));

  const SPREADSHEET_ID = '1xbPk8by_HBdbtDy0ox4BHpcFm76MiIl3n44B7EgSYoA';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const requestsSheet = ss.getSheetByName('PTO_Requests');
  const balancesSheet = ss.getSheetByName('PTO_Balances');

  // Test user: john.doe@company.com (user_001)
  const testUser = {
    id: 'user_001',
    email: 'john.doe@company.com',
    name: 'John Doe',
    userRole: 'STAFF',
    employmentType: 'Full Time'
  };

  Logger.log('\nTest User: ' + testUser.name + ' (' + testUser.email + ')');
  Logger.log('Employment Type: ' + testUser.employmentType);
  Logger.log('Expected Annual PTO: 120 hours');

  // Get initial balance
  Logger.log('\n' + '='.repeat(80));
  Logger.log('STEP 1: Get Initial Balance (2026)');
  Logger.log('='.repeat(80));

  const initialBalance = getBalance(testUser.id, 2026, requestsSheet, balancesSheet);
  Logger.log('Initial Balance:');
  Logger.log('  Total Hours: ' + initialBalance.totalHours);
  Logger.log('  Used Hours: ' + initialBalance.usedHours);
  Logger.log('  Pending Hours: ' + initialBalance.pendingHours);
  Logger.log('  Available Hours: ' + initialBalance.availableHours);

  // Create a draft request
  Logger.log('\n' + '='.repeat(80));
  Logger.log('STEP 2: Create Draft Request');
  Logger.log('='.repeat(80));

  const draftRequest = {
    id: 'test_draft_' + new Date().getTime(),
    userId: testUser.id,
    startDate: new Date('2026-02-09'),
    endDate: new Date('2026-02-10'),
    totalHours: 16,
    type: 'Vacation',
    status: 'Draft',
    reason: 'Test draft request',
    isHalfDayStart: false,
    isHalfDayEnd: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add draft request to sheet
  addRequestToSheet(requestsSheet, draftRequest);
  Logger.log('Draft request created:');
  Logger.log('  Request ID: ' + draftRequest.id);
  Logger.log('  Dates: Feb 9-10, 2026');
  Logger.log('  Hours: ' + draftRequest.totalHours);
  Logger.log('  Status: ' + draftRequest.status);

  // Get balance after draft (should be unchanged)
  const balanceAfterDraft = getBalance(testUser.id, 2026, requestsSheet, balancesSheet);
  Logger.log('\nBalance After Draft:');
  Logger.log('  Pending Hours: ' + balanceAfterDraft.pendingHours + ' (should equal ' + initialBalance.pendingHours + ')');
  Logger.log('  Used Hours: ' + balanceAfterDraft.usedHours + ' (should equal ' + initialBalance.usedHours + ')');
  Logger.log('  ✓ Draft requests should NOT affect balance: ' + (balanceAfterDraft.pendingHours === initialBalance.pendingHours ? 'PASS' : 'FAIL'));

  // Submit the request
  Logger.log('\n' + '='.repeat(80));
  Logger.log('STEP 3: Submit Request (Draft → Submitted)');
  Logger.log('='.repeat(80));

  updateRequestStatus(requestsSheet, draftRequest.id, 'Submitted');
  Logger.log('Request submitted (status changed to Submitted)');

  // Get balance after submit
  const balanceAfterSubmit = getBalance(testUser.id, 2026, requestsSheet, balancesSheet);
  Logger.log('\nBalance After Submit:');
  Logger.log('  Pending Hours: ' + balanceAfterSubmit.pendingHours);
  Logger.log('  Expected Pending: ' + (initialBalance.pendingHours + draftRequest.totalHours));
  Logger.log('  Used Hours: ' + balanceAfterSubmit.usedHours + ' (should equal ' + initialBalance.usedHours + ')');
  Logger.log('  Available Hours: ' + balanceAfterSubmit.availableHours);
  Logger.log('  ✓ Pending should increase by ' + draftRequest.totalHours + ': ' +
    (balanceAfterSubmit.pendingHours === initialBalance.pendingHours + draftRequest.totalHours ? 'PASS' : 'FAIL'));

  // Approve the request
  Logger.log('\n' + '='.repeat(80));
  Logger.log('STEP 4: Approve Request (Submitted → Approved)');
  Logger.log('='.repeat(80));

  updateRequestStatus(requestsSheet, draftRequest.id, 'Approved');
  Logger.log('Request approved (status changed to Approved)');

  // Get final balance
  const finalBalance = getBalance(testUser.id, 2026, requestsSheet, balancesSheet);
  Logger.log('\nFinal Balance After Approval:');
  Logger.log('  Pending Hours: ' + finalBalance.pendingHours + ' (should return to ' + initialBalance.pendingHours + ')');
  Logger.log('  Used Hours: ' + finalBalance.usedHours);
  Logger.log('  Expected Used: ' + (initialBalance.usedHours + draftRequest.totalHours));
  Logger.log('  Available Hours: ' + finalBalance.availableHours);
  Logger.log('  ✓ Pending returns to initial: ' + (finalBalance.pendingHours === initialBalance.pendingHours ? 'PASS' : 'FAIL'));
  Logger.log('  ✓ Used increases by ' + draftRequest.totalHours + ': ' +
    (finalBalance.usedHours === initialBalance.usedHours + draftRequest.totalHours ? 'PASS' : 'FAIL'));

  // Summary
  Logger.log('\n' + '='.repeat(80));
  Logger.log('TEST SUMMARY');
  Logger.log('='.repeat(80));
  Logger.log('Year: 2026');
  Logger.log('Initial State:');
  Logger.log('  Total: ' + initialBalance.totalHours + ' | Used: ' + initialBalance.usedHours + ' | Pending: ' + initialBalance.pendingHours + ' | Available: ' + initialBalance.availableHours);
  Logger.log('After Draft (no change expected):');
  Logger.log('  Total: ' + balanceAfterDraft.totalHours + ' | Used: ' + balanceAfterDraft.usedHours + ' | Pending: ' + balanceAfterDraft.pendingHours + ' | Available: ' + balanceAfterDraft.availableHours);
  Logger.log('After Submit (+' + draftRequest.totalHours + ' pending):');
  Logger.log('  Total: ' + balanceAfterSubmit.totalHours + ' | Used: ' + balanceAfterSubmit.usedHours + ' | Pending: ' + balanceAfterSubmit.pendingHours + ' | Available: ' + balanceAfterSubmit.availableHours);
  Logger.log('After Approval (+' + draftRequest.totalHours + ' used, pending reset):');
  Logger.log('  Total: ' + finalBalance.totalHours + ' | Used: ' + finalBalance.usedHours + ' | Pending: ' + finalBalance.pendingHours + ' | Available: ' + finalBalance.availableHours);

  Logger.log('\n' + '='.repeat(80));
  Logger.log('CLEANUP: Test request ID = ' + draftRequest.id);
  Logger.log('You can delete this request from the PTO_Requests sheet if desired.');
  Logger.log('='.repeat(80));
}

/**
 * Helper: Get PTO balance for a user and year
 */
function getBalance(userId, year, requestsSheet, balancesSheet) {
  // Get total hours from PTO_Balances sheet
  const balancesData = balancesSheet.getDataRange().getValues();
  let totalHours = 0;

  for (let i = 1; i < balancesData.length; i++) {
    const row = balancesData[i];
    if (row[0] === userId && row[1] === year) {
      totalHours = row[2]; // Column C: totalHours
      break;
    }
  }

  // Calculate used and pending from requests
  const requestsData = requestsSheet.getDataRange().getValues();
  let usedHours = 0;
  let pendingHours = 0;

  for (let i = 1; i < requestsData.length; i++) {
    const row = requestsData[i];
    const reqUserId = row[1];
    const startDate = new Date(row[2]);
    const status = row[6];
    const hours = row[5];

    if (reqUserId === userId && startDate.getFullYear() === year) {
      if (status === 'Approved') {
        usedHours += hours;
      } else if (status === 'Submitted') {
        pendingHours += hours;
      }
    }
  }

  return {
    totalHours: totalHours,
    usedHours: usedHours,
    pendingHours: pendingHours,
    availableHours: totalHours - usedHours - pendingHours
  };
}

/**
 * Helper: Add request to sheet
 */
function addRequestToSheet(sheet, request) {
  sheet.appendRow([
    request.id,
    request.userId,
    request.startDate,
    request.endDate,
    request.type,
    request.totalHours,
    request.status,
    request.reason,
    '', // managerNotes
    request.isHalfDayStart,
    request.isHalfDayEnd,
    '', // isShortNotice
    '', // history
    request.createdAt,
    request.updatedAt
  ]);
}

/**
 * Helper: Update request status
 */
function updateRequestStatus(sheet, requestId, newStatus) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === requestId) {
      sheet.getRange(i + 1, 7).setValue(newStatus); // Column G: status
      sheet.getRange(i + 1, 15).setValue(new Date().toISOString()); // Column O: updatedAt
      break;
    }
  }
}
