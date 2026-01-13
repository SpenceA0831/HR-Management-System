/**
 * Email Notification Service for PTO Requests
 * Uses Google Apps Script MailApp to send email notifications
 */

/**
 * Send email notification when a PTO request is submitted
 * @param {Object} request - The PTO request object
 * @param {Object} employee - The employee who submitted the request
 * @param {Object} approver - The manager who will approve the request
 */
function sendPtoSubmissionEmail(request, employee, approver) {
    try {
        // Email to employee confirming submission
        const employeeSubject = 'PTO Request Submitted - ' + formatDateRange(request.startDate, request.endDate);
        const employeeBody = `
Hello ${employee.name},

Your PTO request has been submitted successfully and is pending approval.

Request Details:
- Type: ${request.type}
- Dates: ${formatDateRange(request.startDate, request.endDate)}
- Total Days: ${request.totalDays}
- Reason: ${request.reason || 'Not specified'}
- Approver: ${approver.name}

You will receive an email once your request has been reviewed.

Best regards,
HR Management System
    `.trim();

        MailApp.sendEmail({
            to: employee.email,
            subject: employeeSubject,
            body: employeeBody
        });
        Logger.log('Sent submission confirmation email to employee: ' + employee.email);

        // Email to approver for review
        const approverSubject = 'PTO Request Pending Approval - ' + employee.name;
        const approverBody = `
Hello ${approver.name},

A new PTO request requires your approval.

Employee: ${employee.name}
Request Details:
- Type: ${request.type}
- Dates: ${formatDateRange(request.startDate, request.endDate)}
- Total Days: ${request.totalDays}
- Reason: ${request.reason || 'Not specified'}

Please log in to the HR Management System to review and approve/deny this request.

Best regards,
HR Management System
    `.trim();

        MailApp.sendEmail({
            to: approver.email,
            subject: approverSubject,
            body: approverBody
        });
        Logger.log('Sent approval request email to approver: ' + approver.email);

    } catch (error) {
        Logger.log('Error sending submission emails: ' + error.message);
        // Don't throw - email failure shouldn't block the request
    }
}

/**
 * Send email notification when a PTO request is approved
 * @param {Object} request - The PTO request object
 * @param {Object} employee - The employee whose request was approved
 * @param {Object} approver - The manager who approved the request
 */
function sendPtoApprovalEmail(request, employee, approver) {
    try {
        const subject = '✅ PTO Request Approved - ' + formatDateRange(request.startDate, request.endDate);
        const body = `
Hello ${employee.name},

Great news! Your PTO request has been approved.

Request Details:
- Type: ${request.type}
- Dates: ${formatDateRange(request.startDate, request.endDate)}
- Total Days: ${request.totalDays}
- Approved by: ${approver.name}
${request.managerComment ? '- Manager Comment: ' + request.managerComment : ''}

Enjoy your time off!

Best regards,
HR Management System
    `.trim();

        MailApp.sendEmail({
            to: employee.email,
            subject: subject,
            body: body
        });
        Logger.log('Sent approval email to employee: ' + employee.email);

    } catch (error) {
        Logger.log('Error sending approval email: ' + error.message);
    }
}

/**
 * Send email notification when a PTO request is denied
 * @param {Object} request - The PTO request object
 * @param {Object} employee - The employee whose request was denied
 * @param {Object} approver - The manager who denied the request
 * @param {string} reason - The reason for denial
 */
function sendPtoDenialEmail(request, employee, approver, reason) {
    try {
        const subject = '❌ PTO Request Denied - ' + formatDateRange(request.startDate, request.endDate);
        const body = `
Hello ${employee.name},

Unfortunately, your PTO request has been denied.

Request Details:
- Type: ${request.type}
- Dates: ${formatDateRange(request.startDate, request.endDate)}
- Total Days: ${request.totalDays}
- Reviewed by: ${approver.name}
- Reason for Denial: ${reason}

If you have questions, please speak with your manager directly.

Best regards,
HR Management System
    `.trim();

        MailApp.sendEmail({
            to: employee.email,
            subject: subject,
            body: body
        });
        Logger.log('Sent denial email to employee: ' + employee.email);

    } catch (error) {
        Logger.log('Error sending denial email: ' + error.message);
    }
}

/**
 * Send email notification when a PTO request is cancelled
 * @param {Object} request - The PTO request object
 * @param {Object} employee - The employee who cancelled the request
 * @param {Object} approver - The manager (if the request was approved)
 * @param {boolean} wasApproved - Whether the request was previously approved
 */
function sendPtoCancellationEmail(request, employee, approver, wasApproved) {
    try {
        // Email to employee confirming cancellation
        const employeeSubject = 'PTO Request Cancelled - ' + formatDateRange(request.startDate, request.endDate);
        const employeeBody = `
Hello ${employee.name},

Your PTO request has been cancelled successfully.

Cancelled Request Details:
- Type: ${request.type}
- Dates: ${formatDateRange(request.startDate, request.endDate)}
- Total Days: ${request.totalDays}

${wasApproved ? 'Your PTO balance has been restored with ' + request.totalDays + ' day(s).' : ''}

Best regards,
HR Management System
    `.trim();

        MailApp.sendEmail({
            to: employee.email,
            subject: employeeSubject,
            body: employeeBody
        });
        Logger.log('Sent cancellation confirmation email to employee: ' + employee.email);

        // If the request was approved, notify the approver
        if (wasApproved && approver) {
            const approverSubject = 'PTO Request Cancelled by ' + employee.name;
            const approverBody = `
Hello ${approver.name},

${employee.name} has cancelled their previously approved PTO request.

Cancelled Request Details:
- Type: ${request.type}
- Dates: ${formatDateRange(request.startDate, request.endDate)}
- Total Days: ${request.totalDays}

No action is required on your part.

Best regards,
HR Management System
      `.trim();

            MailApp.sendEmail({
                to: approver.email,
                subject: approverSubject,
                body: approverBody
            });
            Logger.log('Sent cancellation notification email to approver: ' + approver.email);
        }

    } catch (error) {
        Logger.log('Error sending cancellation emails: ' + error.message);
    }
}

/**
 * Format date range for display in emails
 * @param {string} startDate - Start date (yyyy-MM-dd)
 * @param {string} endDate - End date (yyyy-MM-dd)
 * @returns {string} Formatted date range
 */
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);

    if (startDate === endDate) {
        return startStr;
    }
    return startStr + ' - ' + endStr;
}
