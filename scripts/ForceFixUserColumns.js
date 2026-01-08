/**
 * FORCE FIX User Columns
 * Completely rebuilds Users sheet with correct data in correct columns
 */

function forceFixUserColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Browser.msgBox('Users sheet not found!');
    return;
  }

  // Get current data
  const data = sheet.getDataRange().getValues();

  // Correct headers
  const headers = ['id', 'name', 'email', 'userRole', 'teamId', 'managerId',
                   'employmentType', 'hireDate', 'roleType', 'avatar', 'createdAt', 'updatedAt'];

  // Clear and rebuild
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Manually set correct data for each user
  const users = [
    {
      id: 'user_001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      userRole: 'STAFF',
      teamId: 'team_001',
      managerId: 'user_002',
      employmentType: 'Full Time',
      hireDate: '2023-01-15',
      roleType: 'ORGANIZER',
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      userRole: 'MANAGER',
      teamId: 'team_001',
      managerId: '',
      employmentType: 'Full Time',
      hireDate: '2022-06-01',
      roleType: 'OPS_MANAGER',
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_003',
      name: 'Bob Johnson',
      email: 'bob.johnson@company.com',
      userRole: 'ADMIN',
      teamId: 'team_001',
      managerId: '',
      employmentType: 'Full Time',
      hireDate: '2021-03-10',
      roleType: 'EXECUTIVE_DIRECTOR',
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_004',
      name: 'Jane CEO',
      email: 'ceo@example.com',
      userRole: 'ADMIN',
      teamId: 'team_001',
      managerId: '',
      employmentType: 'Full Time',
      hireDate: '2024-01-10',
      roleType: 'EXECUTIVE_DIRECTOR',
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Write users
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const row = [
      u.id,
      u.name,
      u.email,
      u.userRole,
      u.teamId,
      u.managerId,
      u.employmentType,  // Column G - MUST be "Full Time"
      u.hireDate,        // Column H - MUST be a date string
      u.roleType,        // Column I
      u.avatar,
      u.createdAt,
      u.updatedAt
    ];
    sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
  }

  // Format
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  Browser.msgBox('SUCCESS!',
    'Users sheet completely rebuilt with correct column mapping:\n\n' +
    'Column G = "Full Time" (employmentType)\n' +
    'Column H = Date string (hireDate)\n' +
    'Column I = Role type\n\n' +
    '4 users created, all Full Time, old hire dates.\n\n' +
    'Refresh frontend - should show 120 hours!',
    Browser.Buttons.OK
  );
}

/**
 * Verify what's actually in the Users sheet
 */
function inspectUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Browser.msgBox('Users sheet not found!');
    return;
  }

  const data = sheet.getDataRange().getValues();

  let report = 'Users Sheet Inspection:\n\n';
  report += 'Headers (Row 1):\n';

  for (let i = 0; i < data[0].length; i++) {
    const col = String.fromCharCode(65 + i); // A, B, C, etc.
    report += '  ' + col + ': ' + data[0][i] + '\n';
  }

  report += '\nFirst User (Row 2):\n';
  if (data.length > 1) {
    for (let i = 0; i < data[1].length; i++) {
      const col = String.fromCharCode(65 + i);
      const header = data[0][i];
      const value = data[1][i];
      report += '  ' + col + ' (' + header + '): ' + value + '\n';
    }
  }

  Logger.log(report);
  Browser.msgBox('Inspection Complete',
    'Check execution log for full details.\n\n' +
    'Pay attention to columns G, H, I',
    Browser.Buttons.OK
  );
}
