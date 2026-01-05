/**
 * Test calendar access
 * Run this to verify calendar permissions
 */
function testCalendarAccess() {
  let calendarId = 'c_bbe5eba035ea3848deef6d1e6949f8b8dca77f3f14e8e6b9bdd727953c107631@group.calendar.google.com';

  // Try to get from config. Using a mini try-catch JUST for this part is okay on some runtimes, 
  // but let's keep it safe and just use the ID directly if simple lookup fails, 
  // or wrap ONLY this non-essential part in try-catch.
  try {
    if (typeof handleGetSystemConfig === 'function') {
      const config = handleGetSystemConfig(null);
      if (config.success && config.data && config.data.sharedCalendarId) {
        calendarId = config.data.sharedCalendarId;
        Logger.log('Retrieved calendar ID from System Config');
      }
    }
  } catch (e) {
    Logger.log('Could not retrieve from config, using hardcoded default');
  }

  Logger.log('----------------------------------------');
  Logger.log('TESTING CALENDAR ACCESS');
  Logger.log('Calendar ID: ' + calendarId);
  Logger.log('----------------------------------------');

  // THIS IS THE CRITICAL PART - NO TRY/CATCH HERE
  // If authorization is missing, this line MUST crash to trigger the prompt.
  const calendar = CalendarApp.getCalendarById(calendarId);

  if (!calendar) {
    Logger.log('❌ ERROR: Calendar not found or no access');
    Logger.log('Make sure the calendar is shared with your Google account');
    return;
  }

  Logger.log('✅ SUCCESS: Calendar found!');
  Logger.log('Calendar Name: ' + calendar.getName());
  Logger.log('Time Zone: ' + calendar.getTimeZone());

  // Try to create a test event
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 30); // 30 days from now

  Logger.log('Attempting to create test event...');
  const event = calendar.createAllDayEvent('TEST - HR System Integration', testDate, {
    description: 'This is a test event from the HR Management System. You can safely delete this.',
    location: 'System Test'
  });

  Logger.log('✅ SUCCESS: Test event created!');
  Logger.log('Event ID: ' + event.getId());
  Logger.log('Date: ' + testDate.toDateString());
  Logger.log('----------------------------------------');
  Logger.log('PLEASE CHECK THE CALENDAR TO VERIFY THE EVENT APPEARED');
  Logger.log('----------------------------------------');
}
