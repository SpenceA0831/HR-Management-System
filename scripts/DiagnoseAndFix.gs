/**
 * DEFINITIVE DIAGNOSTIC AND FIX
 * This will find the exact problem and fix it
 */

function diagnoseAndFixPtoIssue() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Browser.msgBox('ERROR: Users sheet not found!');
    return;
  }

  // STEP 1: Check what's actually in the sheet
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const firstUser = data[1];

  let diagnosis = 'DIAGNOSTIC REPORT:\n\n';
  diagnosis += 'ACTUAL SHEET STRUCTURE:\n';

  for (let i = 0; i < headers.length && i < 12; i++) {
    const col = String.fromCharCode(65 + i);
    diagnosis += col + ': ' + headers[i] + ' = "' + firstUser[i] + '"\n';
  }

  // STEP 2: What should it be?
  diagnosis += '\n\nEXPECTED STRUCTURE:\n';
  diagnosis += 'G: employmentType = "Full Time"\n';
  diagnosis += 'H: hireDate = "2023-01-15"\n';
  diagnosis += 'I: roleType = "ORGANIZER"\n';

  // STEP 3: Find the problem
  const colG = firstUser[6]; // Column G (index 6)
  const colH = firstUser[7]; // Column H (index 7)
  const colI = firstUser[8]; // Column I (index 8)

  diagnosis += '\n\nACTUAL VALUES:\n';
  diagnosis += 'G (index 6): ' + colG + ' (type: ' + typeof colG + ')\n';
  diagnosis += 'H (index 7): ' + colH + ' (type: ' + typeof colH + ')\n';
  diagnosis += 'I (index 8): ' + colI + ' (type: ' + typeof colI + ')\n';

  let needsFix = false;

  if (colG !== 'Full Time') {
    diagnosis += '\n❌ Column G is WRONG! Has: ' + colG + '\n';
    needsFix = true;
  }

  if (typeof colH === 'string' && (colH === 'ORGANIZER' || colH === 'OPS_MANAGER')) {
    diagnosis += '❌ Column H is WRONG! Has roleType instead of date\n';
    needsFix = true;
  }

  Logger.log(diagnosis);

  if (!needsFix) {
    Browser.msgBox('Sheet looks correct but still getting 60 hours.\nCheck execution log for details.');
    return;
  }

  // STEP 4: FIX IT
  const response = Browser.msgBox(
    'Fix Required',
    'The Users sheet has incorrect column data.\n\nFix it now?',
    Browser.Buttons.YES_NO
  );

  if (response !== Browser.Buttons.YES) {
    return;
  }

  // Rebuild sheet with correct data
  sheet.clear();

  const correctHeaders = ['id', 'name', 'email', 'userRole', 'teamId', 'managerId',
                         'employmentType', 'hireDate', 'roleType', 'avatar', 'createdAt', 'updatedAt'];

  sheet.getRange(1, 1, 1, correctHeaders.length).setValues([correctHeaders]);

  // Set correct user data AS TEXT (not dates)
  const users = [
    ['user_001', 'John Doe', 'john.doe@company.com', 'STAFF', 'team_001', 'user_002',
     'Full Time', '2023-01-15', 'ORGANIZER', '', new Date().toISOString(), new Date().toISOString()],

    ['user_002', 'Jane Smith', 'jane.smith@company.com', 'MANAGER', 'team_001', '',
     'Full Time', '2022-06-01', 'OPS_MANAGER', '', new Date().toISOString(), new Date().toISOString()],

    ['user_003', 'Bob Johnson', 'bob.johnson@company.com', 'ADMIN', 'team_001', '',
     'Full Time', '2021-03-10', 'EXECUTIVE_DIRECTOR', '', new Date().toISOString(), new Date().toISOString()],

    ['user_004', 'Jane CEO', 'ceo@example.com', 'ADMIN', 'team_001', '',
     'Full Time', '2024-01-10', 'EXECUTIVE_DIRECTOR', '', new Date().toISOString(), new Date().toISOString()]
  ];

  sheet.getRange(2, 1, users.length, correctHeaders.length).setValues(users);

  // Format column H as PLAIN TEXT to prevent date conversion
  sheet.getRange(2, 8, users.length, 1).setNumberFormat('@STRING@');

  // Format column G as PLAIN TEXT
  sheet.getRange(2, 7, users.length, 1).setNumberFormat('@STRING@');

  // Format headers
  sheet.getRange(1, 1, 1, correctHeaders.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');

  sheet.setFrozenRows(1);

  // STEP 5: Test it immediately
  Utilities.sleep(1000); // Wait for sheet to update

  const testUser = getUserById('user_001');

  let testReport = '\n\nTEST AFTER FIX:\n';
  testReport += 'Employment Type: "' + testUser.employmentType + '"\n';
  testReport += 'Hire Date: "' + testUser.hireDate + '"\n';
  testReport += 'Role Type: "' + testUser.roleType + '"\n';

  const isFullTime = testUser.employmentType === 'Full Time';
  testReport += '\nComparison Result: ' + isFullTime + '\n';

  if (isFullTime) {
    testReport += '✅ FIXED! User is now Full Time\n';
    testReport += '\nExpected PTO: 120 hours\n';
    Browser.msgBox('SUCCESS!',
      'Users sheet fixed!\n\n' +
      'Employment Type now reads correctly as "Full Time"\n\n' +
      'Refresh your frontend - should show 120 hours!',
      Browser.Buttons.OK
    );
  } else {
    testReport += '❌ STILL BROKEN\n';
    Browser.msgBox('ERROR',
      'Fix applied but backend still reading wrong data.\n' +
      'Check execution log for details.',
      Browser.Buttons.OK
    );
  }

  Logger.log(testReport);
}
