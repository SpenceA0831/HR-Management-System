/**
 * Clear PtoBalances sheet to force fresh calculation
 * The backend will recalculate balances on-the-fly when requested
 */

function clearBalancesCache() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PtoBalances');

  if (!sheet) {
    Browser.msgBox('PtoBalances sheet not found - this is OK, backend will calculate on-the-fly');
    return;
  }

  // Keep headers, clear all data rows
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    Browser.msgBox('Success!',
      'Cleared ' + (lastRow - 1) + ' cached balance records.\n\n' +
      'The backend will now calculate fresh balances when requested.\n\n' +
      'Refresh your frontend and check the balance again!',
      Browser.Buttons.OK
    );
  } else {
    Browser.msgBox('PtoBalances sheet is already empty - no cached data to clear.');
  }
}

/**
 * Check what the PtoBalances sheet currently contains
 */
function inspectBalancesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PtoBalances');

  if (!sheet) {
    Browser.msgBox('PtoBalances sheet does not exist - backend calculates balances on-the-fly');
    return;
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Browser.msgBox('PtoBalances sheet is empty - backend will calculate fresh balances');
    return;
  }

  let report = 'PtoBalances Sheet Contents:\n\n';

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    report += 'User: ' + row[0] + '\n';
    report += '  Year: ' + row[1] + '\n';
    report += '  Total Hours: ' + row[2] + '\n';
    report += '  Available Hours: ' + row[3] + '\n';
    report += '  Used Hours: ' + row[4] + '\n';
    report += '  Pending Hours: ' + row[5] + '\n\n';
  }

  Logger.log(report);
  Browser.msgBox('PtoBalances Inspection',
    'Found ' + (data.length - 1) + ' cached records.\n' +
    'Check execution log for details.\n\n' +
    'If these show old/wrong values, run clearBalancesCache()',
    Browser.Buttons.OK
  );
}
