# HR Management System - Backend (Google Apps Script)

This is the backend API for the HR Management System, built with Google Apps Script and deployed as a Web App. It provides endpoints for both PTO Tracking and Staff Evaluations modules.

## Architecture

- **Platform**: Google Apps Script
- **Database**: Google Sheets (12 sheets)
- **Authentication**: Google Workspace (via `Session.getActiveUser()`)
- **API Style**: Action-based routing
- **Deployment**: Web App

## File Structure

```
backend/
├── Code.gs                # Main router (doGet/doPost)
├── Config.gs              # Sheet names, column mappings, enums
├── Utils.gs               # Helper functions and converters
├── Auth.gs                # Authentication and authorization
├── UserService.gs         # User operations
├── PtoService.gs          # PTO request CRUD
├── PtoBalanceService.gs   # PTO balance calculations
├── HolidayService.gs      # Holidays and blackout dates
├── ConfigService.gs       # System configuration
├── EvaluationService.gs   # Evaluation CRUD
├── RatingService.gs       # Rating operations
├── GoalService.gs         # Goal operations
├── PeerReviewService.gs   # Peer review handling
├── CycleService.gs        # Evaluation cycle management
└── CompetencyService.gs   # Competency management
```

## Deployment Instructions

### Step 1: Access Apps Script

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1wlKItUe5wK9PfLwQrLlOY64A_Df9ZcJ_Gl0d8q5fitQ/edit
2. Click **Extensions → Apps Script**
3. This opens the Apps Script editor

### Step 2: Create Script Files

For each `.gs` file in this `/backend` folder:

1. In the Apps Script editor, click the **+** button next to "Files"
2. Select **Script**
3. Name the file (e.g., `Code`, `Config`, `Utils`, etc.) - **do NOT include .gs extension**
4. Copy the entire contents of the corresponding `.gs` file from this folder
5. Paste into the Apps Script editor
6. Click the save icon (💾)

**Files to create (in order):**
1. Config
2. Utils
3. Auth
4. Code (this is the main entry point)
5. UserService
6. PtoService
7. PtoBalanceService
8. HolidayService
9. ConfigService
10. EvaluationService
11. RatingService
12. GoalService
13. PeerReviewService
14. CycleService
15. CompetencyService

**Note**: Delete the default `Code.gs` file that Apps Script creates if it exists.

### Step 3: Configure Script Properties

1. In the Apps Script editor, click **Project Settings** (gear icon)
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Add the following property:
   - **Property**: `SPREADSHEET_ID`
   - **Value**: `1wlKItUe5wK9PfLwQrLlOY64A_Df9ZcJ_Gl0d8q5fitQ`
5. Click **Save script properties**

### Step 4: Test the Script

1. In the Apps Script editor, select `Code.gs`
2. In the function dropdown at the top, select `doGet`
3. Click **Run** (▶️)
4. The first time, you'll be prompted to authorize:
   - Click **Review permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to Untitled project (unsafe)**
   - Click **Allow**
5. Check the **Execution log** at the bottom for any errors

### Step 5: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure deployment settings:
   - **Description**: `HR Management System API v1.0`
   - **Execute as**: `Me (your@email.com)`
   - **Who has access**: `Anyone with Google account` (or select your organization)
5. Click **Deploy**
6. **IMPORTANT**: Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`)
7. Save this URL - you'll need it for the frontend

### Step 6: Update Frontend Configuration

1. Open `/HR-Management-System/frontend/.env`
2. Update the `VITE_APPS_SCRIPT_URL` with your deployment URL:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
3. Save the file
4. Restart your frontend development server if it's running

## API Endpoints

### Health Check
- **Action**: `health`
- **Method**: GET
- **Auth**: None
- **Response**: `{ success: true, data: { status: "ok" } }`

### User Endpoints
- `getCurrentUser` (GET) - Get authenticated user info
- `getUsers` (GET) - Get all users (Admin only)
- `getDirectReports` (GET) - Get manager's direct reports

### PTO Module Endpoints
- `getPtoRequests` (GET) - List PTO requests with filters
- `getPtoRequest` (GET) - Get single request by ID
- `createPtoRequest` (POST) - Create new PTO request
- `updatePtoRequest` (POST) - Update draft request
- `approvePtoRequest` (POST) - Approve request (Manager)
- `denyPtoRequest` (POST) - Deny request (Manager)
- `cancelPtoRequest` (POST) - Cancel request (Employee)
- `getPtoBalance` (GET) - Get PTO balance for user/year
- `getHolidays` (GET) - Get all holidays
- `createHoliday` (POST) - Create holiday (Admin)
- `deleteHoliday` (POST) - Delete holiday (Admin)
- `getBlackoutDates` (GET) - Get all blackout dates
- `createBlackoutDate` (POST) - Create blackout date (Admin)
- `deleteBlackoutDate` (POST) - Delete blackout date (Admin)
- `getSystemConfig` (GET) - Get system configuration
- `updateSystemConfig` (POST) - Update config (Admin)

### Evaluation Module Endpoints
- `getEvaluationCycles` (GET) - Get all cycles
- `getActiveCycle` (GET) - Get currently active cycle
- `getEvaluations` (GET) - Get evaluations with filters
- `getEvaluation` (GET) - Get single evaluation (enriched)
- `createEvaluation` (POST) - Create new evaluation
- `updateEvaluationStatus` (POST) - Transition status
- `pullBackEvaluation` (POST) - Revert to Draft
- `saveRatings` (POST) - Save ratings by type
- `saveGoals` (POST) - Save goals
- `getPeerReviewRequests` (GET) - Get pending peer reviews
- `submitPeerReview` (POST) - Submit peer review
- `createPeerReviewRequest` (POST) - Create peer review request
- `getCompetencies` (GET) - Get custom competencies
- `saveCompetency` (POST) - Create/update competency (Admin)
- `deleteCompetency` (POST) - Delete competency (Admin)

## Request/Response Format

### Request Format

**GET requests:**
```
GET https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=health
```

**POST requests:**
```
POST https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=createPtoRequest
Content-Type: application/json

{
  "type": "Vacation",
  "startDate": "2024-07-01",
  "endDate": "2024-07-05",
  "isHalfDayStart": false,
  "isHalfDayEnd": false,
  "reason": "Family vacation"
}
```

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User lacks required permission |
| `USER_NOT_FOUND` | User not in Users sheet |
| `MISSING_ACTION` | No action parameter |
| `UNKNOWN_ACTION` | Action not recognized |
| `MISSING_PARAMETERS` | Required fields missing |
| `INVALID_JSON` | POST body invalid |
| `INTERNAL_ERROR` | Server error |
| `NOT_FOUND` | Resource not found |
| `BLACKOUT_CONFLICT` | PTO overlaps blackout date |

## Testing the API

### Using Apps Script Editor

1. Open the Apps Script editor
2. Add this test function:

```javascript
function testHealthEndpoint() {
  const e = {
    parameter: { action: 'health' }
  };
  const result = doGet(e);
  Logger.log(result.getContent());
}
```

3. Run the function
4. Check the logs

### Using curl

```bash
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health"
```

### Using Postman

1. Create new request
2. Method: GET or POST
3. URL: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=ACTION_NAME`
4. For POST: Set body to JSON and include payload
5. Send request

## Updating the Backend

When you make changes to the backend code:

1. Edit the files in the Apps Script editor
2. Click **Save**
3. Click **Deploy → Manage deployments**
4. Click the edit icon (✏️) next to your current deployment
5. In the "Version" dropdown, select **New version**
6. Add a description of your changes
7. Click **Deploy**

**Note**: The Web App URL stays the same - you don't need to update the frontend `.env` file.

## Monitoring and Logs

### View Execution Logs

1. In Apps Script editor: **View → Logs** or **View → Executions**
2. Shows all recent API calls with timestamps
3. Useful for debugging errors

### Common Issues

**"Authorization required" error**
- User not signed into Google account
- Check browser cookies/incognito mode

**"User not found in system"**
- User's email not in Users sheet
- Add user to the Users sheet in Google Sheets

**"Internal server error"**
- Check Apps Script execution logs
- Verify SPREADSHEET_ID is set correctly
- Ensure all sheet names match exactly

## Security Notes

1. **Authentication**: Automatic via Google Workspace
2. **Authorization**: Row-level security enforced in every endpoint
3. **Admin Operations**: Require `userRole: ADMIN`
4. **Manager Operations**: Require `userRole: MANAGER` or `ADMIN`
5. **Audit Trails**: PTO requests maintain full history

## Support

For issues or questions:
- Check the execution logs in Apps Script
- Review the error codes above
- Ensure Google Sheet structure matches `/docs/GOOGLE_SHEETS_STRUCTURE.md`
- Verify all users exist in the Users sheet

---

**Last Updated**: 2024-12-28
**Version**: 1.0.0
