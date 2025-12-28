# Setup Scripts

## SetupGoogleSheets.gs

Automated script to set up your Google Sheets database in seconds instead of manually creating 12 sheets and 100+ column headers.

### Quick Start

1. **Create a new Google Sheet**
   - Go to https://sheets.google.com
   - Click **+ Blank**
   - Rename it to: `HR Management System Database`

2. **Open Apps Script Editor**
   - In your new sheet, click: **Extensions → Apps Script**

3. **Add the setup script**
   - Delete any existing code in the editor
   - Open `SetupGoogleSheets.gs` from this folder
   - Copy ALL the code
   - Paste it into the Apps Script editor

4. **Save and run**
   - Click the disk icon (💾) to save
   - In the function dropdown, select `setupDatabase`
   - Click **Run** (▶️)

5. **Authorize the script**
   - Click **Review permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to Untitled project (unsafe)**
   - Click **Allow**

6. **Wait for completion**
   - Watch the execution log at the bottom
   - You'll see a success message when done (about 5-10 seconds)

7. **Done!**
   - Close the Apps Script editor
   - Return to your sheet
   - You should see all 12 sheets with headers and formatting

### What This Script Does

✅ Creates 12 sheet tabs:
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

✅ Adds all column headers (100+ columns total)

✅ Applies formatting:
- Bold headers with blue background
- White text on headers
- Freezes top row
- Auto-resizes columns

✅ Adds default SystemConfig values

✅ Orders sheets logically

### Optional: Add Sample Data

After running `setupDatabase()`, you can optionally run `addSampleData()` to add test data:
- 3 sample users
- PTO balances for each user
- 5 holidays
- 5 competencies

This is useful for testing the frontend before you have real data.

### Custom Menu

After running the script once, you'll see a new menu **HR System Setup** in your Google Sheet with quick access to:
- Setup Database
- Add Sample Data

### Next Steps

1. **Copy your Sheet ID**
   - Look at the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Copy the `YOUR_SHEET_ID` part
   - Save it for frontend configuration

2. **Proceed to Phase 2**
   - Build the Google Apps Script backend (see `/docs/SETUP.md`)

### Troubleshooting

**"Authorization required"**
- This is normal for the first run
- Follow the authorization steps above

**"Script function not found"**
- Make sure you selected `setupDatabase` in the function dropdown
- Verify you pasted the entire script

**"Cannot read property 'getSheetByName'"**
- Make sure you're running this from a Google Sheet (not standalone Apps Script)

**Want to reset and start over?**
- Simply run `setupDatabase()` again
- It will clear and recreate all sheets
