/**
 * Fix User Data - Repair column mapping issues in Users sheet
 * Run this once to fix the employment type and other misaligned columns
 */

function fixUserData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Logger.log('Users sheet not found!');
    return;
  }

  // Get all data
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    Logger.log('No user data to fix');
    return;
  }

  // Expected header order:
  // A=id, B=name, C=email, D=userRole, E=teamId, F=managerId,
  // G=employmentType, H=hireDate, I=roleType, J=avatar, K=createdAt, L=updatedAt

  // Fix each user row (starting from row 2)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Current incorrect mapping (based on API response):
    // E (teamId) has managerId value
    // F (managerId) is empty/missing
    // G (employmentType) has hireDate value
    // H (hireDate) has roleType value
    // I (roleType) is empty

    // Create corrected row
    const correctedRow = [
      row[0],  // A: id
      row[1],  // B: name
      row[2],  // C: email
      row[3],  // D: userRole
      'team_001',  // E: teamId (default team)
      row[4] || '',  // F: managerId (from old teamId column)
      'Full Time',  // G: employmentType (default to Full Time)
      row[5] || new Date().toISOString().split('T')[0],  // H: hireDate (from old employmentType)
      row[6] || 'ORGANIZER',  // I: roleType (from old hireDate)
      '',  // J: avatar
      row[9] || new Date().toISOString(),  // K: createdAt
      row[10] || new Date().toISOString()   // L: updatedAt
    ];

    // Write corrected row back
    sheet.getRange(i + 1, 1, 1, correctedRow.length).setValues([correctedRow]);
  }

  Logger.log('Fixed ' + (data.length - 1) + ' user records');
  Browser.msgBox('Success', 'Fixed ' + (data.length - 1) + ' user records', Browser.Buttons.OK);
}

/**
 * Set specific employment types for users
 * Customize this based on your actual users
 */
function setEmploymentTypes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) {
    Logger.log('Users sheet not found!');
    return;
  }

  const data = sheet.getDataRange().getValues();

  // Define employment types for each user (by email)
  const employmentTypes = {
    'john.doe@company.com': 'Full Time',
    'jane.smith@company.com': 'Full Time',
    'bob.johnson@company.com': 'Full Time',
    'ceo@example.com': 'Full Time'
  };

  // Update employment type (column G = index 6)
  for (let i = 1; i < data.length; i++) {
    const email = data[i][2]; // Column C (email)
    const employmentType = employmentTypes[email] || 'Full Time';

    sheet.getRange(i + 1, 7).setValue(employmentType); // Column G
  }

  Logger.log('Updated employment types for ' + (data.length - 1) + ' users');
  Browser.msgBox('Success', 'Updated employment types', Browser.Buttons.OK);
}
