/**
 * Test function to verify email sending works
 * Run this from the Apps Script editor to:
 * 1. Trigger the OAuth authorization dialog for the email scope
 * 2. Verify emails can be sent
 */
function testEmailSending() {
    try {
        const testEmail = Session.getActiveUser().getEmail();

        Logger.log('Testing email to: ' + testEmail);

        MailApp.sendEmail({
            to: testEmail,
            subject: 'Test Email from HR Management System',
            body: 'This is a test email to verify the email notification system is working correctly.\n\nIf you receive this, the email setup is correct!'
        });

        Logger.log('Test email sent successfully!');
        return { success: true, message: 'Test email sent to ' + testEmail };
    } catch (error) {
        Logger.log('Error sending test email: ' + error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Check remaining email quota
 */
function checkEmailQuota() {
    try {
        const quota = MailApp.getRemainingDailyQuota();
        Logger.log('Remaining daily email quota: ' + quota);
        return { quota: quota };
    } catch (error) {
        Logger.log('Error checking email quota: ' + error.message);
        return { error: error.message };
    }
}
