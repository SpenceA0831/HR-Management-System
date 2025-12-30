# Google Sheets Column Structure

This document defines the exact column structure required for each sheet in the HR Management System.

## Important Notes

- **Column order matters!** Columns must be in the exact order shown below (left to right)
- Header row (row 1) should contain the column names for reference
- Data starts from row 2
- Leave cells empty for optional fields (marked with *)

---

## Sheet 1: Users

| Column | Name | Type | Required | Example |
|--------|------|------|----------|---------|
| A | id | Text | Yes | user_001 |
| B | name | Text | Yes | John Doe |
| C | email | Text | Yes | john.doe@company.com |
| D | userRole | Text | Yes | STAFF, MANAGER, or ADMIN |
| E | department | Text | Yes | Engineering |
| F | teamId | Text | Yes | team_eng_01 |
| G | managerId | Text | * | user_002 (leave empty for top-level) |
| H | employmentType | Text | Yes | Full Time or Part Time |
| I | hireDate | Date | Yes | 2024-01-15 (yyyy-MM-dd) |
| J | roleType | Text | Yes | DEVELOPMENT, ORGANIZER, etc. |
| K | avatar | Text | * | https://... (profile image URL) |
| L | createdAt | DateTime | Yes | 2024-01-01T00:00:00Z |
| M | updatedAt | DateTime | Yes | 2024-01-01T00:00:00Z |

---

## Sheet 2: PtoRequests

| Column | Name | Type | Required | Example |
|--------|------|------|----------|---------|
| A | id | Text | Yes | pto_001 |
| B | userId | Text | Yes | user_001 |
| C | userName | Text | Yes | John Doe |
| D | type | Text | Yes | Vacation, Sick, or Other |
| E | startDate | Date | Yes | 2025-01-15 (yyyy-MM-dd) |
| F | endDate | Date | Yes | 2025-01-17 (yyyy-MM-dd) |
| G | isHalfDayStart | Boolean | Yes | TRUE or FALSE |
| H | isHalfDayEnd | Boolean | Yes | TRUE or FALSE |
| I | totalHours | Number | Yes | 24 |
| J | reason | Text | * | Family vacation |
| K | attachment | Text | * | URL to document |
| L | status | Text | Yes | Draft, Submitted, Approved, Denied, Cancelled |
| M | managerComment | Text | * | Approved for requested dates |
| N | employeeComment | Text | * | Response to manager |
| O | approverId | Text | Yes | user_002 |
| P | approverName | Text | Yes | Jane Smith |
| Q | createdAt | DateTime | Yes | 2025-01-15T10:00:00Z |
| R | updatedAt | DateTime | Yes | 2025-01-16T09:00:00Z |
| S | history | Text (JSON) | Yes | [{"action":"created","timestamp":"..."}] |

---

## Sheet 3: PtoBalances

**⚠️ IMPORTANT: This sheet is auto-calculated by the backend. You can initialize it manually or use the `initializeAllBalances()` function.**

| Column | Name | Type | Required | Example | Notes |
|--------|------|------|----------|---------|-------|
| A | userId | Text | Yes | user_001 | |
| B | year | Number | Yes | 2025 | |
| C | totalHours | Number | Yes | 120 | Yearly allocation (160 for Full Time, 80 for Part Time) |
| D | availableHours | Number | Yes | 120 | **Deprecated** - Same as totalHours for backwards compatibility |
| E | usedHours | Number | Yes | 24 | Calculated from Approved requests |
| F | pendingHours | Number | Yes | 16 | Calculated from Submitted requests |

**To initialize balances:**
1. In Apps Script editor, run `initializeAllBalances()` function
2. This will create/update balance records for all users for the current year

---

## Sheet 4: Holidays

| Column | Name | Type | Required | Example | Notes |
|--------|------|------|----------|---------|-------|
| A | id | Text | Yes | holiday_001 | |
| B | date | Date | Yes | 2025-01-01 (yyyy-MM-dd) | Start date |
| C | endDate | Date | * | 2025-01-03 (yyyy-MM-dd) | For multi-day holidays (leave empty for single day) |
| D | name | Text | Yes | New Year's Holiday | |

**Example rows:**
- Single day: `holiday_001, 2025-01-01, , New Year's Day`
- Multi-day: `holiday_002, 2025-12-24, 2025-12-26, Christmas Holiday`

---

## Sheet 5: BlackoutDates

| Column | Name | Type | Required | Example | Notes |
|--------|------|------|----------|---------|-------|
| A | id | Text | Yes | blackout_001 | |
| B | date | Date | Yes | 2025-12-15 (yyyy-MM-dd) | Start date |
| C | endDate | Date | * | 2025-12-31 (yyyy-MM-dd) | For multi-day blackouts (leave empty for single day) |
| D | name | Text | Yes | Year-End Close | |
| E | createdBy | Text | * | admin@company.com | |
| F | createdAt | DateTime | * | 2025-01-01T00:00:00Z | |

**Example rows:**
- Single day: `blackout_001, 2025-03-15, , Annual Company Meeting, admin@company.com, 2025-01-01T00:00:00Z`
- Multi-day: `blackout_002, 2025-12-15, 2025-12-31, Year-End Close, admin@company.com, 2025-01-01T00:00:00Z`

---

## Sheet 6: SystemConfig

**Note: This sheet should have only ONE row of data (row 2)**

| Column | Name | Type | Required | Example |
|--------|------|------|----------|---------|
| A | defaultFullTimeHours | Number | Yes | 160 |
| B | defaultPartTimeHours | Number | Yes | 80 |
| C | prorateByHireDate | Boolean | Yes | TRUE |
| D | fullTeamCalendarVisible | Boolean | Yes | TRUE |
| E | shortNoticeThresholdDays | Number | Yes | 14 |

---

## Quick Setup Instructions

### Option 1: Use the Automated Setup Script

1. Create a new Google Sheet
2. Open Apps Script (Extensions → Apps Script)
3. Copy the contents of `/scripts/SetupGoogleSheets.gs`
4. Run `setupDatabase()` function
5. Optionally run `addSampleData()` for test data

### Option 2: Manual Setup

1. Create a new Google Sheet
2. Create 6 sheets with the exact names: `Users`, `PtoRequests`, `PtoBalances`, `Holidays`, `BlackoutDates`, `SystemConfig`
3. In each sheet, add the column headers in row 1 as shown above
4. Add your data starting from row 2
5. For PtoBalances, run the `initializeAllBalances()` function from Apps Script

### After Setup

1. Copy the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
2. In Apps Script: File → Project settings → Script properties → Add property
   - Property: `SPREADSHEET_ID`
   - Value: Your spreadsheet ID
3. Deploy the Apps Script as a Web App
4. Update frontend `.env` file with the deployment URL

---

## Date Formats

- **Dates**: Always use `yyyy-MM-dd` format (e.g., `2025-01-15`)
- **DateTimes**: Always use ISO 8601 format (e.g., `2025-01-15T10:30:00Z`)
- Google Sheets will auto-format dates - that's fine as long as the underlying value is correct

## Boolean Values

- Use `TRUE` or `FALSE` (case-insensitive)
- Google Sheets will display checkboxes if you format the column as Checkbox

## Validation

After setting up your sheets, test by:
1. Creating a user in the Users sheet
2. Running `initializeAllBalances()` to create their PTO balance
3. Creating a PTO request through the frontend
4. Verifying the data appears correctly in the PtoRequests sheet
