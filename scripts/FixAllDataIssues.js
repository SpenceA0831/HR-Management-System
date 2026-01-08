/**
 * Complete Data Fix Script
 * Fixes Users sheet, sets up SystemConfig, and verifies all sheet structures
 *
 * HOW TO USE:
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script
 * 3. Create a new script file
 * 4. Paste this entire content
 * 5. Save
 * 6. Run "fixAllData" function
 * 7. Authorize when prompted
 */

function fixAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Fix All Data Issues',
    'This will:\n' +
    '1. Fix Users sheet column mapping\n' +
    '2. Set up SystemConfig with default PTO hours\n' +
    '3. Verify all sheet structures\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  let report = 'Data Fix Report:\n\n';

  // 1. Fix Users Sheet
  report += fixUsersSheet(ss);

  // 2. Setup SystemConfig
  report += setupSystemConfig(ss);

  // 3. Verify BlackoutDates structure
  report += verifyBlackoutDatesSheet(ss);

  Logger.log(report);
  ui.alert('Complete!', report, ui.Buttons.OK);
}

/**
 * Fix Users sheet column alignment
 */
function fixUsersSheet(ss) {
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    return '❌ Users sheet not found!\n\n';
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return '⚠️ No user data to fix\n\n';
  }

  // Verify headers are correct
  const headers = ['id', 'name', 'email', 'userRole', 'teamId', 'managerId',
                   'employmentType', 'hireDate', 'roleType', 'avatar', 'createdAt', 'updatedAt'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  let fixedCount = 0;

  // Fix each user row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Determine correct values
    const id = row[0] || 'user_' + (i.toString().padStart(3, '0'));
    const name = row[1] || 'User ' + i;
    const email = row[2] || '';
    const userRole = row[3] || 'STAFF';

    // Fix the misaligned columns
    let teamId = 'team_001';
    let managerId = '';
    let employmentType = 'Full Time';
    let hireDate = new Date().toISOString().split('T')[0];
    let roleType = 'ORGANIZER';

    // If data exists in old positions, try to recover it
    if (row[4] && row[4].toString().startsWith('user_')) {
      managerId = row[4]; // Old teamId column had managerId
    }

    if (row[5] && typeof row[5] === 'object' && row[5].getTime) {
      hireDate = Utilities.formatDate(row[5], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else if (row[5] && !isNaN(Date.parse(row[5]))) {
      hireDate = new Date(row[5]).toISOString().split('T')[0];
    }

    if (row[6] && (row[6] === 'ORGANIZER' || row[6] === 'OPS_MANAGER' || row[6] === 'EXECUTIVE_DIRECTOR')) {
      roleType = row[6];
    }

    const avatar = '';
    const createdAt = row[9] || new Date().toISOString();
    const updatedAt = row[10] || new Date().toISOString();

    // Write corrected row
    const correctedRow = [
      id, name, email, userRole, teamId, managerId,
      employmentType, hireDate, roleType, avatar, createdAt, updatedAt
    ];

    sheet.getRange(i + 1, 1, 1, correctedRow.length).setValues([correctedRow]);
    fixedCount++;
  }

  // Format the sheet
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  return '✅ Fixed Users sheet: ' + fixedCount + ' rows updated\n\n';
}

/**
 * Setup SystemConfig sheet with proper defaults
 */
function setupSystemConfig(ss) {
  let sheet = ss.getSheetByName('SystemConfig');

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('SystemConfig');
  }

  // Clear existing data
  sheet.clear();

  // Set headers
  const headers = ['defaultFullTimeHours', 'defaultPartTimeHours', 'prorateByHireDate',
                   'fullTeamCalendarVisible', 'shortNoticeThresholdDays'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Set default values
  const values = [
    120,    // defaultFullTimeHours (15 days × 8 hours)
    60,     // defaultPartTimeHours (7.5 days × 8 hours)
    true,   // prorateByHireDate
    true,   // fullTeamCalendarVisible
    7       // shortNoticeThresholdDays
  ];
  sheet.getRange(2, 1, 1, values.length).setValues([values]);

  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#34a853')
    .setFontColor('#ffffff');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  return '✅ SystemConfig sheet configured:\n' +
         '   - Full Time: 120 hours/year\n' +
         '   - Part Time: 60 hours/year\n' +
         '   - Prorate by hire date: YES\n' +
         '   - Short notice threshold: 7 days\n\n';
}

/**
 * Verify BlackoutDates sheet structure
 */
function verifyBlackoutDatesSheet(ss) {
  let sheet = ss.getSheetByName('BlackoutDates');

  if (!sheet) {
    sheet = ss.insertSheet('BlackoutDates');
  }

  const data = sheet.getDataRange().getValues();

  // Expected headers
  const headers = ['id', 'date', 'endDate', 'name', 'createdBy', 'createdAt'];

  // Check if headers exist and are correct
  if (data.length === 0 || data[0].join(',') !== headers.join(',')) {
    // Clear and set correct headers
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#ea4335')
      .setFontColor('#ffffff');

    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);

    return '✅ BlackoutDates sheet structure fixed\n\n';
  }

  return '✅ BlackoutDates sheet structure verified\n\n';
}

/**
 * Quick function to just fix employment types
 */
function quickFixEmploymentTypes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Browser.msgBox('Users sheet not found!');
    return;
  }

  const lastRow = sheet.getLastRow();

  // Set all users to Full Time (column G = 7)
  const employmentTypes = new Array(lastRow - 1).fill(['Full Time']);
  sheet.getRange(2, 7, lastRow - 1, 1).setValues(employmentTypes);

  Browser.msgBox('Success', 'Set all users to Full Time employment', Browser.Buttons.OK);
}

/**
 * Test PTO balance calculation for a specific user
 */
function testPtoCalculation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');

  if (!usersSheet) {
    Browser.msgBox('Users sheet not found!');
    return;
  }

  // Get first user
  const userData = usersSheet.getRange(2, 1, 1, 12).getValues()[0];
  const userId = userData[0];
  const name = userData[1];
  const employmentType = userData[6];

  // Get system config
  const configSheet = ss.getSheetByName('SystemConfig');
  const configData = configSheet.getRange(2, 1, 1, 5).getValues()[0];
  const fullTimeHours = configData[0];
  const partTimeHours = configData[1];

  const expectedHours = employmentType === 'Full Time' ? fullTimeHours : partTimeHours;

  const report = 'PTO Calculation Test:\n\n' +
                 'User: ' + name + ' (' + userId + ')\n' +
                 'Employment Type: ' + employmentType + '\n' +
                 'Expected Annual PTO: ' + expectedHours + ' hours\n\n' +
                 'Note: Log into the app to see full balance with used/pending hours';

  Logger.log(report);
  Browser.msgBox('Test Results', report, Browser.Buttons.OK);
}
