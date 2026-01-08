/**
 * Debug script to test PTO hours calculation
 * Run this function from Apps Script editor to debug
 */
function debugPtoCalculation() {
  const testDate = '2026-01-19';

  Logger.log('===== PTO Hours Calculation Debug =====');
  Logger.log('Test Date: ' + testDate);

  // Test OLD date parsing (buggy)
  const dateBuggy = new Date(testDate);
  Logger.log('OLD Parsing (buggy): ' + dateBuggy);
  Logger.log('OLD Day of Week: ' + dateBuggy.getDay() + ' (0=Sunday, 1=Monday, etc.)');

  // Test NEW date parsing (fixed)
  const dateFixed = parseLocalDate(testDate);
  Logger.log('NEW Parsing (fixed): ' + dateFixed);
  Logger.log('NEW Day of Week: ' + dateFixed.getDay() + ' (0=Sunday, 1=Monday, etc.)');
  Logger.log('Is Weekend? ' + isWeekend(dateFixed));

  // Get holidays
  const holidays = getSheetData(SHEET_NAMES.HOLIDAYS, COLUMN_MAPS.HOLIDAYS, rowToHoliday);
  Logger.log('Number of holidays loaded: ' + holidays.length);
  Logger.log('Is Holiday? ' + isHoliday(dateFixed, holidays));

  // Test hours calculation
  const hours = calculateTotalHours(testDate, testDate, false, false, holidays);
  Logger.log('Calculated Hours: ' + hours);

  // Log formatted date
  const formattedDate = Utilities.formatDate(dateFixed, Session.getScriptTimeZone(), 'yyyy-MM-dd EEEE');
  Logger.log('Formatted: ' + formattedDate);
  Logger.log('Script Timezone: ' + Session.getScriptTimeZone());

  return {
    date: testDate,
    oldParsing: dateBuggy.toString(),
    newParsing: dateFixed.toString(),
    dayOfWeek: dateFixed.getDay(),
    isWeekend: isWeekend(dateFixed),
    isHoliday: isHoliday(dateFixed, holidays),
    calculatedHours: hours,
    timezone: Session.getScriptTimeZone()
  };
}
