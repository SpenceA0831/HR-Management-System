# Google Sheets Database Structure

This document defines the exact structure for each sheet (tab) in your Google Sheets database.

---

## Sheet 1: Users

**Purpose**: Store all user/employee information

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `user_001` |
| name | String | Full name | `John Doe` |
| email | String | Email address | `john.doe@company.com` |
| userRole | String | Permission level | `STAFF`, `MANAGER`, `ADMIN` |
| teamId | String | Team identifier | `team_001` |
| managerId | String | Manager's user ID | `user_002` |
| employmentType | String | Employment status | `Full Time`, `Part Time` |
| hireDate | String | Date hired (yyyy-MM-dd) | `2023-01-15` |
| roleType | String | Job role category | `ORGANIZER`, `OPS_MANAGER`, `COMMS_MANAGER`, `DEVELOPMENT`, `DEPUTY_DIRECTOR`, `EXECUTIVE_DIRECTOR` |
| avatar | String | Avatar URL (optional) | `https://...` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| updatedAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |

---

## Sheet 2: PtoRequests

**Purpose**: Store all PTO/time-off requests

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `pto_001` |
| userId | String | Employee's user ID | `user_001` |
| userName | String | Employee's name | `John Doe` |
| type | String | PTO type | `Vacation`, `Sick`, `Other` |
| startDate | String | Start date (yyyy-MM-dd) | `2024-06-01` |
| endDate | String | End date (yyyy-MM-dd) | `2024-06-05` |
| isHalfDayStart | Boolean | Half day on start date | `TRUE`, `FALSE` |
| isHalfDayEnd | Boolean | Half day on end date | `TRUE`, `FALSE` |
| totalHours | Number | Total hours requested | `40` |
| reason | String | Optional reason | `Family vacation` |
| attachment | String | Optional file URL | `https://...` |
| status | String | Request status | `Draft`, `Submitted`, `Pending`, `Approved`, `Denied`, `ChangesRequested`, `Cancelled` |
| managerComment | String | Manager's feedback | `Approved for vacation` |
| employeeComment | String | Employee's response | `Thank you` |
| approverId | String | Approving manager's ID | `user_002` |
| approverName | String | Approving manager's name | `Jane Smith` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| updatedAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| history | String | JSON array of audit trail | `[{"timestamp":"2024-01-15T10:30:00Z","actorId":"user_001","actorName":"John Doe","action":"Created","note":"Initial request"}]` |

---

## Sheet 3: PtoBalances

**Purpose**: Track PTO balances by user and year

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| userId | String | Employee's user ID | `user_001` |
| year | Number | Year | `2024` |
| availableHours | Number | Available PTO hours | `120` |
| usedHours | Number | Used PTO hours | `24` |
| pendingHours | Number | Pending request hours | `16` |

**Note**: Composite key is `userId + year`

---

## Sheet 4: Holidays

**Purpose**: Company-wide holidays

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `holiday_001` |
| date | String | Holiday date (yyyy-MM-dd) | `2024-07-04` |
| name | String | Holiday name | `Independence Day` |

---

## Sheet 5: BlackoutDates

**Purpose**: Dates when PTO requests are restricted

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `blackout_001` |
| date | String | Blackout date (yyyy-MM-dd) | `2024-12-20` |
| name | String | Reason/description | `Year-end freeze` |
| createdBy | String | User ID who created | `user_admin` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |

---

## Sheet 6: SystemConfig

**Purpose**: System-wide configuration (single row)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| defaultFullTimeHours | Number | Default annual PTO for FT | `120` |
| defaultPartTimeHours | Number | Default annual PTO for PT | `60` |
| prorateByHireDate | Boolean | Prorate first year PTO | `TRUE` |
| fullTeamCalendarVisible | Boolean | Show team calendar | `TRUE` |
| shortNoticeThresholdDays | Number | Days for short notice warning | `7` |

**Note**: This sheet should only have ONE row of data (the current config)

---

## Sheet 7: Evaluations

**Purpose**: Store performance evaluations

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `eval_001` |
| employeeId | String | Employee's user ID | `user_001` |
| cycleId | String | Evaluation cycle ID | `cycle_2024_q1` |
| type | String | Evaluation type | `QUARTERLY_SELF`, `MID_YEAR_REVIEW`, `PEER_REVIEW`, `ANNUAL_REVIEW` |
| status | String | Evaluation status | `Draft`, `Submitted`, `Peer-Review`, `Manager-Review`, `Approved`, `Complete` |
| overallSummary | String | Summary comments | `Strong performance this quarter` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| updatedAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |

**Note**: Related ratings and goals are stored in separate sheets and linked by evaluationId

---

## Sheet 8: EvaluationCycles

**Purpose**: Define evaluation periods/cycles

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `cycle_2024_q1` |
| name | String | Cycle name | `Q1 2024 Self-Assessment` |
| year | Number | Year | `2024` |
| type | String | Cycle type | `QUARTERLY_SELF`, `MID_YEAR_REVIEW`, `PEER_REVIEW`, `ANNUAL_REVIEW` |
| deadline | String | Overall deadline (yyyy-MM-dd) | `2024-03-31` |
| selfDeadline | String | Self-review deadline | `2024-03-15` |
| peerDeadline | String | Peer review deadline | `2024-03-22` |
| managerDeadline | String | Manager review deadline | `2024-03-31` |
| status | String | Cycle status | `Upcoming`, `Active`, `Complete` |

---

## Sheet 9: Ratings

**Purpose**: Individual competency ratings within evaluations

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `rating_001` |
| evaluationId | String | Parent evaluation ID | `eval_001` |
| ratingType | String | Who rated | `SELF`, `PEER`, `MANAGER` |
| competencyId | String | Competency being rated | `comp_001` |
| score | Number | Rating score (1-5) | `4` |
| comments | String | Optional comments | `Shows strong leadership` |
| reviewerId | String | Who gave this rating | `user_002` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| updatedAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |

---

## Sheet 10: Goals

**Purpose**: Goals set during evaluations

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `goal_001` |
| evaluationId | String | Parent evaluation ID | `eval_001` |
| description | String | Goal description | `Complete leadership training` |
| status | String | Goal progress | `Not Started`, `In Progress`, `Completed`, `Deferred` |
| achievements | String | What was achieved | `Completed module 1 and 2` |
| challenges | String | Obstacles faced | `Time constraints` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| updatedAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |

---

## Sheet 11: PeerReviewRequests

**Purpose**: Track peer review assignments

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `peer_001` |
| evaluationId | String | Related evaluation ID | `eval_001` |
| reviewerId | String | Peer reviewer's ID | `user_003` |
| targetUserId | String | Person being reviewed | `user_001` |
| targetUserName | String | Person being reviewed | `John Doe` |
| status | String | Request status | `Pending`, `In Progress`, `Complete` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| updatedAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |

---

## Sheet 12: Competencies

**Purpose**: Define competencies used in evaluations

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | String | Unique identifier | `comp_001` |
| name | String | Competency name | `Communication` |
| description | String | Detailed description | `Ability to communicate clearly and effectively` |
| category | String | Competency category | `Org-Wide`, `Role-Specific` |
| roleType | String | For role-specific comps | `ORGANIZER`, `OPS_MANAGER`, etc. (empty if Org-Wide) |
| isCustom | Boolean | Custom vs standard | `TRUE`, `FALSE` |
| createdAt | String | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |

---

## Setup Instructions

### Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Rename it to: `HR Management System Database`

### Step 2: Create Sheet Tabs

1. Rename the first sheet from "Sheet1" to "Users"
2. Click the **+** button at the bottom to add more sheets
3. Create all 12 sheets with these exact names:
   - Users
   - PtoRequests
   - PtoBalances
   - Holidays
   - BlackoutDates
   - SystemConfig
   - Evaluations
   - EvaluationCycles
   - Ratings
   - Goals
   - PeerReviewRequests
   - Competencies

### Step 3: Add Column Headers

For each sheet, add the column headers from the tables above:
1. Click on the sheet tab
2. In row 1, enter each column name from left to right
3. **Bold** the header row for clarity
4. Consider freezing row 1 (View → Freeze → 1 row)

### Step 4: Optional Formatting

**For better readability:**
- Make header row bold with background color
- Set column widths appropriately
- Apply data validation where appropriate:
  - UserRole: `STAFF`, `MANAGER`, `ADMIN`
  - PtoType: `Vacation`, `Sick`, `Other`
  - PtoStatus: `Draft`, `Submitted`, `Pending`, `Approved`, `Denied`, `ChangesRequested`, `Cancelled`
  - Boolean fields: `TRUE`, `FALSE`

### Step 5: Get Sheet ID

1. Look at your Google Sheet URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```
2. Copy the `YOUR_SHEET_ID_HERE` part
3. Save it for later configuration

---

## Data Type Notes

- **String**: Text values
- **Number**: Numeric values (integers or decimals)
- **Boolean**: Use `TRUE` or `FALSE` in Google Sheets
- **ISO 8601 timestamp**: `2024-01-15T10:30:00Z` format
- **Date (yyyy-MM-dd)**: `2024-01-15` format
- **JSON**: For complex data like history, store as JSON string

---

## Next Steps

After setting up the Google Sheet:
1. Proceed to **Phase 2: Google Apps Script Backend** (see SETUP.md)
2. The backend will read/write to these sheets
3. Configure the frontend with your Sheet ID
