/**
 * Test calendar access
 * Run this to verify calendar permissions
 */
function testCalendarAccess() {
  try {
    const calendarId = 'c_bbe5eba035ea3848deef6d1e6949f8b8dca77f3f14e8e6b9bdd727953c107631@group.calendar.google.com';
    
    Logger.log('Testing calendar access...');
    Logger.log('Calendar ID: ' + calendarId);
    
    const calendar = CalendarApp.getCalendarById(calendarId);
    
    if (!calendar) {
      Logger.log('ERROR: Calendar not found or no access');
      Logger.log('Make sure the calendar is shared with your Google account');
      return { success: false, error: 'Calendar not found' };
    }
    
    Logger.log('SUCCESS: Calendar found!');
    Logger.log('Calendar name: ' + calendar.getName());
    
    // Try to create a test event
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 30); // 30 days from now
    
    const event = calendar.createAllDayEvent('TEST - Out of Office', testDate, {
      description: 'Test event - please delete',
      location: 'Test'
    });
    
    Logger.log('SUCCESS: Test event created!');
    Logger.log('Event ID: ' + event.getId());
    Logger.log('Please check the calendar and delete this test event');
    
    return { 
      success: true, 
      calendarName: calendar.getName(),
      eventId: event.getId()
    };
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return { success: false, error: error.toString() };
  }
}
