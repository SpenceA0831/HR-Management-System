/**
 * HR Management System - Google Sheets Database Setup Script
 *
 * This script will automatically:
 * 1. Create all required sheet tabs
 * 2. Add column headers to each sheet
 * 3. Format headers (bold, colored background, frozen row)
 * 4. Auto-resize columns
 *
 * HOW TO USE:
 * 1. Create a new blank Google Sheet
 * 2. Rename it to "HR Management System Database"
 * 3. Go to Extensions → Apps Script
 * 4. Delete any existing code
 * 5. Paste this entire script
 * 6. Click the disk icon to save
 * 7. Click "Run" → Select "setupDatabase"
 * 8. Authorize the script when prompted
 * 9. Wait for completion (check execution log)
 * 10. Close Apps Script editor and return to your sheet
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('Starting database setup...');

  // Delete default sheet if it exists
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // Define all sheets and their columns
  const sheetsConfig = {
    'Users': [
      'id', 'name', 'email', 'userRole', 'teamId', 'managerId',
      'employmentType', 'hireDate', 'roleType', 'avatar',
      'createdAt', 'updatedAt'
    ],

    'PtoRequests': [
      'id', 'userId', 'userName', 'type', 'startDate', 'endDate',
      'isHalfDayStart', 'isHalfDayEnd', 'totalHours', 'reason',
      'attachment', 'status', 'managerComment', 'employeeComment',
      'approverId', 'approverName', 'createdAt', 'updatedAt', 'history'
    ],

    'PtoBalances': [
      'userId', 'year', 'availableHours', 'usedHours', 'pendingHours'
    ],

    'Holidays': [
      'id', 'date', 'name'
    ],

    'BlackoutDates': [
      'id', 'date', 'name', 'createdBy', 'createdAt'
    ],

    'SystemConfig': [
      'defaultFullTimeHours', 'defaultPartTimeHours', 'prorateByHireDate',
      'fullTeamCalendarVisible', 'shortNoticeThresholdDays'
    ],

    'Evaluations': [
      'id', 'employeeId', 'cycleId', 'type', 'status',
      'overallSummary', 'createdAt', 'updatedAt'
    ],

    'EvaluationCycles': [
      'id', 'name', 'year', 'type', 'deadline', 'selfDeadline',
      'peerDeadline', 'managerDeadline', 'status'
    ],

    'Ratings': [
      'id', 'evaluationId', 'ratingType', 'competencyId', 'score',
      'comments', 'reviewerId', 'createdAt', 'updatedAt'
    ],

    'Goals': [
      'id', 'evaluationId', 'description', 'status', 'achievements',
      'challenges', 'createdAt', 'updatedAt'
    ],

    'PeerReviewRequests': [
      'id', 'evaluationId', 'reviewerId', 'targetUserId', 'targetUserName',
      'status', 'createdAt', 'updatedAt'
    ],

    'Competencies': [
      'id', 'name', 'description', 'category', 'roleType',
      'isCustom', 'createdAt'
    ]
  };

  // Create/update each sheet
  Object.keys(sheetsConfig).forEach(function(sheetName) {
    const columns = sheetsConfig[sheetName];
    Logger.log('Setting up sheet: ' + sheetName);

    // Get or create sheet
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('  Created new sheet: ' + sheetName);
    } else {
      sheet.clear();
      Logger.log('  Cleared existing sheet: ' + sheetName);
    }

    // Add headers
    const headerRange = sheet.getRange(1, 1, 1, columns.length);
    headerRange.setValues([columns]);

    // Format headers
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');

    // Freeze header row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= columns.length; i++) {
      sheet.autoResizeColumn(i);
      // Set minimum width
      if (sheet.getColumnWidth(i) < 100) {
        sheet.setColumnWidth(i, 100);
      }
    }

    Logger.log('  ✓ Completed: ' + sheetName + ' (' + columns.length + ' columns)');
  });

  // Add default SystemConfig row
  const configSheet = ss.getSheetByName('SystemConfig');
  if (configSheet) {
    configSheet.getRange(2, 1, 1, 5).setValues([[
      120,    // defaultFullTimeHours
      60,     // defaultPartTimeHours
      true,   // prorateByHireDate
      true,   // fullTeamCalendarVisible
      7       // shortNoticeThresholdDays
    ]]);
    Logger.log('  ✓ Added default SystemConfig values');
  }

  // Reorder sheets to match documentation order
  const sheetOrder = [
    'Users', 'PtoRequests', 'PtoBalances', 'Holidays', 'BlackoutDates',
    'SystemConfig', 'Evaluations', 'EvaluationCycles', 'Ratings',
    'Goals', 'PeerReviewRequests', 'Competencies'
  ];

  sheetOrder.forEach(function(name, index) {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(index + 1);
    }
  });

  // Set Users as the active sheet
  const usersSheet = ss.getSheetByName('Users');
  if (usersSheet) {
    ss.setActiveSheet(usersSheet);
  }

  Logger.log('✅ Database setup complete!');
  Logger.log('All 12 sheets created with headers and formatting.');
  Logger.log('');
  Logger.log('NEXT STEPS:');
  Logger.log('1. Copy the Sheet ID from the URL');
  Logger.log('2. Add sample data if needed');
  Logger.log('3. Proceed to Phase 2: Google Apps Script Backend');

  // Show completion message
  SpreadsheetApp.getUi().alert(
    'Setup Complete!',
    'Your HR Management System database has been set up successfully.\n\n' +
    '✓ 12 sheets created\n' +
    '✓ Column headers added\n' +
    '✓ Headers formatted and frozen\n' +
    '✓ Default system config added\n\n' +
    'Next: Copy the Sheet ID from the URL and save it for your frontend configuration.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Optional: Add sample data for testing
 * Run this after setupDatabase() if you want test data
 */
function addSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Add Sample Data',
    'This will add sample test data to your database. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  // Sample Users
  const usersSheet = ss.getSheetByName('Users');
  usersSheet.getRange(2, 1, 3, 12).setValues([
    [
      'user_001', 'John Doe', 'john.doe@company.com', 'STAFF', 'team_001', 'user_002',
      'Full Time', '2023-01-15', 'ORGANIZER', '',
      new Date().toISOString(), new Date().toISOString()
    ],
    [
      'user_002', 'Jane Smith', 'jane.smith@company.com', 'MANAGER', 'team_001', '',
      'Full Time', '2022-06-01', 'OPS_MANAGER', '',
      new Date().toISOString(), new Date().toISOString()
    ],
    [
      'user_003', 'Bob Johnson', 'bob.johnson@company.com', 'ADMIN', 'team_001', '',
      'Full Time', '2021-03-10', 'EXECUTIVE_DIRECTOR', '',
      new Date().toISOString(), new Date().toISOString()
    ]
  ]);

  // Sample PtoBalances
  const balancesSheet = ss.getSheetByName('PtoBalances');
  balancesSheet.getRange(2, 1, 3, 5).setValues([
    ['user_001', 2024, 120, 24, 16],
    ['user_002', 2024, 120, 40, 0],
    ['user_003', 2024, 120, 16, 8]
  ]);

  // Sample Holidays
  const holidaysSheet = ss.getSheetByName('Holidays');
  holidaysSheet.getRange(2, 1, 5, 3).setValues([
    ['holiday_001', '2024-01-01', 'New Year\'s Day'],
    ['holiday_002', '2024-07-04', 'Independence Day'],
    ['holiday_003', '2024-11-28', 'Thanksgiving'],
    ['holiday_004', '2024-12-25', 'Christmas Day'],
    ['holiday_005', '2024-12-31', 'New Year\'s Eve']
  ]);

  // Sample Competencies
  const competenciesSheet = ss.getSheetByName('Competencies');
  competenciesSheet.getRange(2, 1, 5, 7).setValues([
    ['comp_001', 'Communication', 'Ability to communicate clearly and effectively', 'Org-Wide', '', false, new Date().toISOString()],
    ['comp_002', 'Teamwork', 'Works well with others and contributes to team success', 'Org-Wide', '', false, new Date().toISOString()],
    ['comp_003', 'Problem Solving', 'Identifies issues and develops effective solutions', 'Org-Wide', '', false, new Date().toISOString()],
    ['comp_004', 'Event Planning', 'Plans and executes successful events', 'Role-Specific', 'ORGANIZER', false, new Date().toISOString()],
    ['comp_005', 'Operations Management', 'Manages operational processes efficiently', 'Role-Specific', 'OPS_MANAGER', false, new Date().toISOString()]
  ]);

  Logger.log('✅ Sample data added successfully');

  ui.alert(
    'Sample Data Added',
    'Test data has been added to:\n' +
    '• Users (3 employees)\n' +
    '• PtoBalances (for all 3 users)\n' +
    '• Holidays (5 holidays)\n' +
    '• Competencies (5 competencies)\n\n' +
    'You can now test the system with this data.',
    ui.ButtonSet.OK
  );
}

/**
 * Create a custom menu when the spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('HR System Setup')
    .addItem('Setup Database', 'setupDatabase')
    .addItem('Add Sample Data', 'addSampleData')
    .addToUi();
}
