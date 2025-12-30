/**
 * Test Backend PTO Calculation
 * This mimics exactly what the backend does when calculating PTO balance
 * Run this in the SAME Apps Script project as your backend code
 */

function testBackendPtoCalculation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Test for user_001 (John Doe)
  const userId = 'user_001';
  const year = 2025;

  try {
    // Get user (this uses the backend's getUserById function)
    const user = getUserById(userId);

    if (!user) {
      Browser.msgBox('Error', 'User not found: ' + userId, Browser.Buttons.OK);
      return;
    }

    // Get system config (this uses the backend's handleGetSystemConfig function)
    const configResponse = handleGetSystemConfig(user);
    const config = configResponse.data;

    // Check employment type match
    const EMPLOYMENT_TYPES = {
      FULL_TIME: 'Full Time',
      PART_TIME: 'Part Time'
    };

    const isFullTime = user.employmentType === EMPLOYMENT_TYPES.FULL_TIME;

    // Calculate base hours
    let baseHours = isFullTime ? config.defaultFullTimeHours : config.defaultPartTimeHours;

    // Check proration
    let proratedHours = baseHours;
    let prorationApplied = false;

    if (config.prorateByHireDate && user.hireDate) {
      const hireDate = new Date(user.hireDate);
      const hireYear = hireDate.getFullYear();

      if (hireYear === year) {
        const monthsWorked = 12 - hireDate.getMonth();
        proratedHours = Math.round((baseHours / 12) * monthsWorked);
        prorationApplied = true;
      }
    }

    // Build report
    let report = 'BACKEND PTO CALCULATION TEST\n';
    report += '='.repeat(60) + '\n\n';
    report += 'USER DATA:\n';
    report += '  User ID: ' + user.id + '\n';
    report += '  Name: ' + user.name + '\n';
    report += '  Email: ' + user.email + '\n';
    report += '  Employment Type (raw): "' + user.employmentType + '"\n';
    report += '  Hire Date: ' + user.hireDate + '\n\n';

    report += 'CONSTANTS:\n';
    report += '  EMPLOYMENT_TYPES.FULL_TIME: "' + EMPLOYMENT_TYPES.FULL_TIME + '"\n';
    report += '  EMPLOYMENT_TYPES.PART_TIME: "' + EMPLOYMENT_TYPES.PART_TIME + '"\n\n';

    report += 'COMPARISON:\n';
    report += '  user.employmentType === FULL_TIME? ' + isFullTime + '\n';
    report += '  Comparison: "' + user.employmentType + '" === "' + EMPLOYMENT_TYPES.FULL_TIME + '"\n\n';

    report += 'SYSTEM CONFIG:\n';
    report += '  Full Time Hours: ' + config.defaultFullTimeHours + '\n';
    report += '  Part Time Hours: ' + config.defaultPartTimeHours + '\n';
    report += '  Prorate By Hire Date: ' + config.prorateByHireDate + '\n\n';

    report += 'CALCULATION:\n';
    report += '  Base Hours (before proration): ' + baseHours + '\n';
    report += '  Year Being Calculated: ' + year + '\n';
    report += '  Hire Year: ' + (user.hireDate ? new Date(user.hireDate).getFullYear() : 'N/A') + '\n';
    report += '  Proration Applied? ' + prorationApplied + '\n';
    report += '  FINAL HOURS: ' + proratedHours + '\n\n';

    report += '='.repeat(60) + '\n';
    report += 'DIAGNOSIS:\n';

    if (proratedHours === 60 && baseHours === 120) {
      report += '❌ PROBLEM: Getting 60 instead of 120\n';
      report += '   Base hours is correct (120) but result is 60\n';
      report += '   This means proration reduced it by 50%\n';
      report += '   User was hired mid-year in ' + year + '\n';
    } else if (baseHours === 60) {
      report += '❌ PROBLEM: Base hours is 60 instead of 120\n';
      report += '   Employment type comparison FAILED\n';
      report += '   user.employmentType: "' + user.employmentType + '"\n';
      report += '   Expected: "' + EMPLOYMENT_TYPES.FULL_TIME + '"\n';
      report += '   Match: ' + isFullTime + '\n';
      report += '\n';
      report += '   SOLUTION: Check Users sheet column G\n';
      report += '   Must be exactly "Full Time" (case-sensitive)\n';
    } else if (proratedHours === 120) {
      report += '✅ CORRECT: Should be showing 120 hours\n';
      report += '   If frontend shows 60, there\'s a frontend issue\n';
    }

    Logger.log(report);
    Browser.msgBox('Test Complete',
      'Check execution log (View → Logs) for detailed results.\n\n' +
      'Key findings:\n' +
      '  Base Hours: ' + baseHours + '\n' +
      '  Final Hours: ' + proratedHours + '\n' +
      '  Is Full Time: ' + isFullTime,
      Browser.Buttons.OK
    );

  } catch (error) {
    Browser.msgBox('Error',
      'Test failed: ' + error.message + '\n\n' +
      'Make sure this script is in the SAME Apps Script project as your backend code.',
      Browser.Buttons.OK
    );
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
  }
}

/**
 * Quick fix: Force all users to exactly "Full Time"
 */
function forceExactFullTimeText() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Browser.msgBox('Users sheet not found!');
    return;
  }

  const lastRow = sheet.getLastRow();

  // Set employment type to exactly "Full Time" with no extra spaces
  for (let i = 2; i <= lastRow; i++) {
    sheet.getRange(i, 7).setValue('Full Time');
  }

  Browser.msgBox('Success!',
    'All users set to exactly "Full Time"\n\n' +
    'Refresh frontend and check balance again.',
    Browser.Buttons.OK
  );
}
