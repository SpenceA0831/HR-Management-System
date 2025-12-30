/**
 * ClearPtoBalances.gs
 *
 * Utility function to clear all data from the PtoBalances sheet except the header row.
 * This is useful when the balance data needs to be recalculated due to column mapping changes.
 */

/**
 * Clears all rows in the PtoBalances sheet except the header row
 * Shows a success message and logs the number of rows deleted
 */
function clearPtoBalancesSheet() {
  try {
    // Get the spreadsheet
    const spreadsheetId = getSpreadsheetId();
    const ss = SpreadsheetApp.openById(spreadsheetId);

    // Get the PtoBalances sheet
    const sheetName = SHEET_NAMES.PTO_BALANCES;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      Browser.msgBox('Error', 'PtoBalances sheet not found!', Browser.Buttons.OK);
      Logger.log('ERROR: PtoBalances sheet not found');
      return;
    }

    // Get the total number of rows with data
    const lastRow = sheet.getLastRow();

    // If there's only a header row (or no data), nothing to delete
    if (lastRow <= 1) {
      Browser.msgBox('Info', 'PtoBalances sheet is already empty (only header row exists).', Browser.Buttons.OK);
      Logger.log('INFO: PtoBalances sheet already empty - no rows to delete');
      return;
    }

    // Calculate number of rows to delete (all rows except header)
    const numRowsToDelete = lastRow - 1;

    // Delete all rows from row 2 onwards
    sheet.deleteRows(2, numRowsToDelete);

    // Log and show success message
    const message = `Successfully cleared ${numRowsToDelete} row(s) from PtoBalances sheet.`;
    Logger.log(message);
    Browser.msgBox('Success', message, Browser.Buttons.OK);

  } catch (error) {
    const errorMessage = 'Error clearing PtoBalances sheet: ' + error.message;
    Logger.log('ERROR: ' + errorMessage);
    Browser.msgBox('Error', errorMessage, Browser.Buttons.OK);
  }
}
