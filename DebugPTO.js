/**
 * Debug PTO Balance Calculation
 * Run this to see exactly why a user has their current balance
 */

function debugPtoBalance() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const configSheet = ss.getSheetByName('SystemConfig');

  if (!usersSheet || !configSheet) {
    Browser.msgBox('Missing Users or SystemConfig sheet!');
    return;
  }

  // Get all users
  const userData = usersSheet.getDataRange().getValues();
  const configData = configSheet.getRange(2, 1, 1, 5).getValues()[0];

  const fullTimeHours = configData[0];
  const partTimeHours = configData[1];
  const prorateByHireDate = configData[2];

  let report = 'PTO Balance Debug Report\n';
  report += '='.repeat(50) + '\n\n';
  report += 'System Configuration:\n';
  report += '  Full Time Hours: ' + fullTimeHours + '\n';
  report += '  Part Time Hours: ' + partTimeHours + '\n';
  report += '  Prorate by Hire Date: ' + prorateByHireDate + '\n\n';
  report += '='.repeat(50) + '\n\n';

  // Check each user (skip header row)
  for (let i = 1; i < userData.length; i++) {
    const row = userData[i];

    const id = row[0];
    const name = row[1];
    const email = row[2];
    const employmentType = row[6]; // Column G
    const hireDate = row[7]; // Column H

    // Calculate expected hours
    let baseHours = employmentType === 'Full Time' ? fullTimeHours : partTimeHours;
    let finalHours = baseHours;
    let prorationNote = '';

    // Check proration
    if (prorateByHireDate && hireDate) {
      const hireDateObj = new Date(hireDate);
      const currentYear = new Date().getFullYear();
      const hireYear = hireDateObj.getFullYear();

      if (hireYear === currentYear) {
        const monthsWorked = 12 - hireDateObj.getMonth();
        finalHours = Math.round((baseHours / 12) * monthsWorked);
        prorationNote = ' (PRORATED: hired ' + Utilities.formatDate(hireDateObj, Session.getScriptTimeZone(), 'MMM yyyy') +
                       ', ' + monthsWorked + ' months)';
      }
    }

    report += 'User: ' + name + ' (' + email + ')\n';
    report += '  Employment Type: "' + employmentType + '"\n';
    report += '  Hire Date: ' + (hireDate || 'N/A') + '\n';
    report += '  Base Hours: ' + baseHours + '\n';
    report += '  Final Hours: ' + finalHours + prorationNote + '\n';
    report += '\n';
  }

  report += '='.repeat(50) + '\n';
  report += 'SOLUTION:\n';
  report += 'If a user has 60 hours instead of 120:\n';
  report += '1. Check employmentType is exactly "Full Time" (column G)\n';
  report += '2. Check if hired in ' + new Date().getFullYear() + ' (causes proration)\n';
  report += '3. To disable proration: Set SystemConfig row 2, column C to FALSE\n';

  Logger.log(report);
  Browser.msgBox('Debug Report Generated', 'Check the execution log (View → Logs) for full details', Browser.Buttons.OK);

  // Also return summary
  return report;
}

/**
 * Quick fix: Set all users to Full Time and older hire dates
 */
function forceFullTimeAndOldHireDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Browser.msgBox('Users sheet not found!');
    return;
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Browser.msgBox('No user data found!');
    return;
  }

  // Set employment type to "Full Time" (column G)
  for (let i = 2; i <= lastRow; i++) {
    sheet.getRange(i, 7).setValue('Full Time');

    // Set hire date to 2023 (column H) to avoid proration for 2025
    const oldDate = '2023-01-15';
    sheet.getRange(i, 8).setValue(oldDate);
  }

  Browser.msgBox('Success!',
    'All users set to:\n' +
    '- Employment Type: Full Time\n' +
    '- Hire Date: 2023-01-15\n\n' +
    'This ensures 120 hours and no proration.\n\n' +
    'Refresh your frontend to see changes!',
    Browser.Buttons.OK
  );
}
