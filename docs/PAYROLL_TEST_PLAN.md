# Payroll Module Test Plan

## Testing Status: ✅ TypeScript Compilation Successful

All Payroll module files compile without errors. The following tests should be performed before production deployment.

---

## Pre-Deployment Checklist

### 1. Backend Deployment
- [ ] Copy all backend `.gs` files to Google Apps Script
- [ ] Run `SetupGoogleSheets.gs` to create Payroll_History and Reimbursements sheets
- [ ] Verify column headers match Config.gs mappings
- [ ] Deploy as Web App and copy URL to frontend `.env`
- [ ] Test health endpoint: `?action=health`

### 2. Environment Configuration
- [ ] Update `frontend/.env` with Apps Script URL
- [ ] Verify Google OAuth Client ID (if using production auth)
- [ ] Run `npm install` in frontend directory
- [ ] Build frontend: `npm run build`
- [ ] Test dev server: `npm run dev`

---

## Module Testing

### A. Module Selector
**Test**: Navigation to Payroll module

**Steps**:
1. Sign in as any user role (STAFF, MANAGER, ADMIN)
2. From module selector, verify "Payroll & Reimbursements" card appears
3. Click the card
4. Verify navigation to `/payroll`

**Expected**:
- Green DollarSign icon visible
- Card accessible to all users
- Dashboard loads based on user role

---

### B. Payroll Dashboard

#### B1. STAFF/MANAGER View
**Test**: Non-admin users see reimbursement view

**Steps**:
1. Sign in as STAFF or MANAGER user
2. Navigate to `/payroll`
3. Verify dashboard sections

**Expected**:
- "New Reimbursement" button in header
- 3 stat cards: Total Requested, Reimbursed, Pending
- "My Reimbursements" DataGrid
- No payroll admin features visible

**Test Data**: No reimbursements yet
- All stats should show $0.00 and 0 count
- DataGrid should be empty

#### B2. ADMIN View
**Test**: Admin users see full payroll view

**Steps**:
1. Sign in as ADMIN user
2. Navigate to `/payroll`

**Expected**:
- 3 stat cards: Awaiting Payroll, Approved Amount, Pending Approval
- Quick Actions card with 4 buttons:
  - Upload Payroll
  - Process Reimbursements (with count)
  - Payroll History
  - All Reimbursements
- Recent Payroll Runs card (empty state if no runs)
- Reimbursements Pending Approval card (hidden if none)

**Empty State Test**:
- Recent Payroll Runs should show "No payroll runs yet" message
- Upload button should navigate to `/payroll/upload`

---

### C. Reimbursement Submission

#### C1. Create New Reimbursement
**Test**: Staff submits expense reimbursement

**Steps**:
1. Sign in as STAFF user
2. Navigate to `/payroll/reimbursements/new`
3. Fill out form:
   - Expense Date: Today's date
   - Reimbursement Type: "Expense Reimbursement"
   - Amount: 150.00
   - Description: "Office supplies for project"
   - Method: "Payroll Expense Reimbursement"
   - Notes: "Receipt attached to email"
4. Click "Submit Request"

**Expected**:
- Success alert appears
- Redirects to `/payroll/reimbursements`
- New reimbursement appears in list with status "Pending"
- Submitted At timestamp is current

#### C2. Section 127 (Educational) Reimbursement
**Test**: Educational assistance plan submission

**Steps**:
1. Create new reimbursement
2. Select Type: "Section 127 Plan - Educational Assistance"
3. Enter Amount: 500.00
4. Enter Description: "Online course for Python certification"
5. Submit

**Expected**:
- Info alert shows Section 127 plan details
- Submission successful
- Type displays as "Sect 127" chip in list

#### C3. Section 129 (Dependent Care) Reimbursement
**Test**: Dependent care plan submission

**Steps**:
1. Create new reimbursement
2. Select Type: "Section 129 Plan - Dependent Care"
3. Enter Amount: 300.00
4. Enter Description: "Childcare for January"
5. Submit

**Expected**:
- Info alert shows Section 129 plan details
- Submission successful
- Type displays as "Sect 129" chip in list

---

### D. Reimbursement Approval (Manager/Admin)

#### D1. View Reimbursement Details
**Test**: Manager views pending reimbursement

**Steps**:
1. Sign in as MANAGER user
2. Navigate to `/payroll/reimbursements`
3. Click on a Pending reimbursement

**Expected**:
- Detail page loads
- Shows all reimbursement information:
  - Employee name and email
  - Expense date, amount, type
  - Description and notes
  - Submitted timestamp
- "Review Actions" card visible with:
  - Optional approval comment field
  - Deny button (red, outlined)
  - Approve button (green, contained)

#### D2. Approve Reimbursement
**Test**: Manager approves request

**Steps**:
1. On reimbursement detail page
2. (Optional) Enter approval comment: "Approved per policy"
3. Click "Approve"
4. Confirm action

**Expected**:
- Success alert: "Reimbursement approved successfully!"
- Status chip changes to "Approved"
- Reviewer Name appears
- Review Actions card disappears
- Info alert shows: "awaiting processing in next payroll run"

**Backend Verification**:
- Status = "Approved"
- reviewerId and reviewerName set
- Approval comment in notes field (if provided)

#### D3. Deny Reimbursement
**Test**: Manager denies request with reason

**Steps**:
1. On reimbursement detail page
2. Click "Deny"
3. In dialog, enter reason: "Not a reimbursable expense per policy"
4. Click "Deny Request"

**Expected**:
- Success alert: "Reimbursement denied"
- Status changes to "Denied"
- Denial reason visible in error alert
- Cannot be processed in payroll

**Backend Verification**:
- Status = "Denied"
- reviewerId and reviewerName set
- Denial reason in notes field with timestamp

---

### E. Payroll Upload (Admin Only)

#### E1. PDF Upload
**Test**: Upload Paychex PDF journal

**Prerequisites**:
- Have a Paychex PDF file (e.g., `/Users/aaronspence/Downloads/Payroll Journal Dec 15 2025.pdf`)

**Steps**:
1. Sign in as ADMIN
2. Navigate to `/payroll/upload`
3. Click "PDF Upload" tab
4. Drag and drop PDF file OR click to browse
5. Wait for parsing

**Expected**:
- Parsing indicator appears
- Success alert: "PDF parsed successfully!"
- Manual entry form auto-populates with extracted data:
  - Pay period dates
  - Gross, Net, Taxes, Deductions
  - Notes: "Imported from PDF"
- Validation warnings if data incomplete

**If Parsing Fails**:
- Error alert with message
- Manual entry tab available as fallback

#### E2. Manual Payroll Entry
**Test**: Manually enter payroll data

**Steps**:
1. Navigate to `/payroll/upload`
2. Click "Manual Entry" tab
3. Fill out form:
   - Run Date: 12/29/2025
   - Check Date: 1/1/2026
   - Pay Period Start: 12/22/2025
   - Pay Period End: 1/4/2026
   - Total Gross: 50,000.00
   - Total Taxes: 12,500.00
   - Total Deductions: 2,500.00
   - Total Net: 35,000.00
   - Notes: "Manual entry test"
4. Click "Create Payroll Run"

**Expected**:
- Success alert appears
- Redirects to `/payroll/history`
- New payroll run appears with:
  - Source: "Manual"
  - Status: "Draft"
  - All entered values correct

#### E3. Calculation Warning
**Test**: Net pay mismatch warning

**Steps**:
1. Manual Entry tab
2. Enter: Gross = 10,000, Taxes = 2,000, Deductions = 1,000
3. Enter Net = 5,000 (incorrect, should be 7,000)

**Expected**:
- Warning alert appears:
  "Net Pay ($5,000.00) doesn't match calculation... = $7,000.00"
- Form still submittable (warning, not error)

---

### F. Payroll History (Admin Only)

#### F1. View All Payroll Runs
**Test**: Admin views payroll history

**Steps**:
1. Sign in as ADMIN
2. Navigate to `/payroll/history`
3. Verify DataGrid columns and data

**Expected**:
- Columns: Run Date, Check Date, Pay Period, Gross Pay, Net Pay, Taxes, Deductions, Status, Source
- Sortable by all columns
- Pagination (10, 25, 50, 100 per page)
- Total Net calculation in filter bar

#### F2. Filter by Year
**Test**: Year filter

**Steps**:
1. On Payroll History page
2. Select "Year: 2025"
3. Verify filtered results

**Expected**:
- Only 2025 payroll runs shown
- Total Net updates for filtered set

#### F3. Filter by Status
**Test**: Status filter

**Steps**:
1. Select "Status: Processed"
2. Verify filtered results

**Expected**:
- Only Processed runs shown
- Can combine with year filter

#### F4. View Run Details
**Test**: Click row to view details

**Steps**:
1. Click any payroll run row
2. Verify detail dialog

**Expected**:
- Dialog opens with complete information:
  - Run and Check dates
  - Pay Period range
  - Financial breakdown (Gross, Taxes, Deductions, Net)
  - Status chip
  - Source chip (PDF Import / Manual Entry)
  - Processed By email
  - Notes (if any)
  - Created timestamp

---

### G. Process Reimbursements (Admin Only)

#### G1. Process Approved Reimbursements
**Test**: Batch process reimbursements

**Prerequisites**:
- At least 2 approved reimbursements exist

**Steps**:
1. Sign in as ADMIN
2. Navigate to `/payroll/approval`
3. Verify summary stats:
   - Approved & Awaiting count
   - Selected count (0)
   - Total Selected Amount ($0.00)
4. Check checkboxes for 2 reimbursements
5. Select Date Reimbursed: 1/1/2026
6. Click "Process 2 Reimbursements"
7. Confirm action

**Expected**:
- Success alert: "Successfully processed 2 reimbursement(s)"
- Selected reimbursements disappear from list
- Stats update (Approved count decreases)
- Reimbursements now have:
  - Status = "Reimbursed"
  - dateReimbursed = 1/1/2026

#### G2. Next Pay Period Display
**Test**: Verify bi-weekly calculation

**Steps**:
1. On Payroll Approval page
2. Check "Next Payroll Period" card

**Expected**:
- Shows Pay Period: [start] - [end]
- Dates are 14 days apart
- Calculated from last pay period end (1/4/2026)
- Next period: 1/5/2026 - 1/18/2026

#### G3. Empty State
**Test**: No approved reimbursements

**Steps**:
1. Process all approved reimbursements
2. Return to Payroll Approval page

**Expected**:
- Empty state message: "No Approved Reimbursements"
- Checkmark icon
- Button: "View All Reimbursements"

---

### H. Reimbursements List

#### H1. Role-Based Filtering
**Test STAFF**: Only see own reimbursements

**Steps**:
1. Sign in as STAFF (user A)
2. Navigate to `/payroll/reimbursements`

**Expected**:
- DataGrid shows only user A's reimbursements
- No employee name column (redundant)
- Cannot see other staff reimbursements

**Test MANAGER**: See all reimbursements

**Steps**:
1. Sign in as MANAGER
2. Navigate to `/payroll/reimbursements`

**Expected**:
- DataGrid shows ALL reimbursements
- Employee name column visible
- Summary stats card visible
- Can filter and manage all requests

#### H2. Status Filter
**Test**: Filter by reimbursement status

**Steps**:
1. Select "Status: Pending"
2. Verify only pending reimbursements show
3. Select "Status: Reimbursed"
4. Verify only reimbursed requests show

**Expected**:
- Filter dropdown works
- Count updates in filter bar
- Can clear filters with button

#### H3. Type Filter
**Test**: Filter by reimbursement type

**Steps**:
1. Select "Type: Section 127 - Educational Assistance"
2. Verify filtered results

**Expected**:
- Only Section 127 reimbursements shown
- Can combine with status filter

---

## Permission Testing

### Permission Matrix Verification

| Action | STAFF | MANAGER | ADMIN | Test Status |
|--------|-------|---------|-------|-------------|
| View Dashboard | ✓ (own) | ✓ (own) | ✓ (all) | [ ] |
| Submit Reimbursement | ✓ | ✓ | ✓ | [ ] |
| View Own Reimbursements | ✓ | ✓ | ✓ | [ ] |
| View All Reimbursements | ✗ | ✓ | ✓ | [ ] |
| Approve Reimbursements | ✗ | ✓ | ✓ | [ ] |
| Deny Reimbursements | ✗ | ✓ | ✓ | [ ] |
| Process to Reimbursed | ✗ | ✗ | ✓ | [ ] |
| View Payroll History | ✗ | ✗ | ✓ | [ ] |
| Upload Payroll | ✗ | ✗ | ✓ | [ ] |
| Payroll Approval Page | ✗ | ✗ | ✓ | [ ] |

**Test**: STAFF tries to access admin routes
1. Sign in as STAFF
2. Manually navigate to `/payroll/history`
3. Expected: Redirect to `/payroll`

**Test**: MANAGER tries to access admin routes
1. Sign in as MANAGER
2. Manually navigate to `/payroll/upload`
3. Expected: Redirect to `/payroll`

---

## Integration Testing

### I1. Reimbursement Workflow (End-to-End)
**Test**: Complete lifecycle from submission to reimbursed

**Steps**:
1. **STAFF**: Submit expense reimbursement ($200)
   - Verify status = "Pending"
   - Verify appears on staff dashboard
2. **MANAGER**: Navigate to Reimbursements
   - Verify request appears in list
   - Click to view details
   - Approve with comment
   - Verify status = "Approved"
3. **ADMIN**: Navigate to Payroll Dashboard
   - Verify appears in "Approved & Awaiting" stat
   - Click "Process Reimbursements"
   - Select the reimbursement
   - Set date and process
   - Verify status = "Reimbursed"
4. **STAFF**: View own reimbursements
   - Verify status chip shows "Reimbursed" (green)
   - Verify Paid Date column populated

**Expected**: Smooth workflow, all status transitions work, data persists correctly

### I2. Multiple Reimbursements in One Payroll
**Test**: Process 5+ reimbursements together

**Steps**:
1. Create 5 reimbursements (various staff)
2. Manager approves all 5
3. Admin processes all 5 in single batch
4. Verify all marked as Reimbursed with same date

### I3. Bi-Weekly Payroll Schedule
**Test**: Verify 26 runs per year calculation

**Steps**:
1. Upload/enter payroll for pay period: 12/22/25 - 1/4/26
2. Navigate to Payroll Approval
3. Verify next period: 1/5/26 - 1/18/26 (14 days)
4. Upload next payroll: 1/5/26 - 1/18/26
5. Verify next period: 1/19/26 - 2/1/26
6. Count: 26 periods = 364 days (52 weeks)

---

## Edge Cases & Error Handling

### E1. Negative Amount
**Test**: Try to submit negative reimbursement

**Steps**:
1. New reimbursement form
2. Enter Amount: -50.00
3. Try to submit

**Expected**:
- Validation error: "Amount must be greater than zero"
- Form does not submit

### E2. Missing Required Fields
**Test**: Submit incomplete form

**Steps**:
1. Leave Description blank
2. Try to submit

**Expected**:
- Validation error on Description field
- Form highlights error
- Does not submit

### E3. Deny Without Comment
**Test**: Try to deny without reason

**Steps**:
1. Manager views pending reimbursement
2. Click Deny
3. Leave comment field empty
4. Click "Deny Request"

**Expected**:
- Error: "Please provide a reason for denial"
- Dialog stays open
- Denial not processed

### E4. Process Without Date
**Test**: Process reimbursements without date

**Steps**:
1. Admin on Payroll Approval
2. Select reimbursements
3. Clear Date Reimbursed field
4. Try to process

**Expected**:
- Error: "Please select a reimbursement date"
- Processing disabled or blocked

### E5. PDF Parse Failure
**Test**: Upload invalid PDF

**Steps**:
1. Upload a non-payroll PDF (e.g., random document)
2. Observe parsing

**Expected**:
- Warning alerts if data extraction incomplete
- Manual entry tab available as fallback
- No crash or unhandled error

---

## Performance Testing

### P1. Large Dataset
**Test**: 100+ reimbursements

**Steps**:
1. Create/import 100+ reimbursements
2. Navigate to Reimbursements List
3. Test pagination, filtering, sorting

**Expected**:
- DataGrid renders smoothly
- Pagination works (10, 25, 50, 100 per page)
- Filters apply quickly
- No performance degradation

### P2. Payroll History with Years of Data
**Test**: Multiple years of payroll runs

**Steps**:
1. Create payroll runs spanning 3+ years
2. Navigate to Payroll History
3. Test year filter

**Expected**:
- Initial load shows current year by default
- Year filter works smoothly
- Total calculations accurate

---

## Browser Compatibility

Test in the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Test responsive design:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px width)
- [ ] Mobile (375px width)

---

## Backend Verification Checklist

### Google Sheets Data Validation

After each test, verify in Google Sheets:

**Reimbursements Sheet**:
- [ ] ID generated correctly (reimb_xxxxx)
- [ ] staffName and staffEmail populated
- [ ] expenseDate in yyyy-MM-dd format
- [ ] amount is numeric
- [ ] status transitions correctly (Pending → Approved → Reimbursed)
- [ ] submittedAt timestamp accurate
- [ ] dateReimbursed populated only when processed
- [ ] reviewerId and reviewerName populated when approved/denied
- [ ] notes contain comments/reasons
- [ ] createdAt and updatedAt timestamps

**Payroll_History Sheet**:
- [ ] ID generated correctly (pay_xxxxx)
- [ ] All date fields in yyyy-MM-dd format
- [ ] All currency fields are numeric (no $ symbols)
- [ ] status values match enum (Draft, Approved, Processed)
- [ ] source values match enum (PDF_Import, Manual)
- [ ] processedBy contains admin email
- [ ] timestamps accurate

---

## Known Limitations

1. **PDF Parsing**: Parser is tuned for Paychex format. Other payroll providers may require adjustments to regex patterns.

2. **Attachment Storage**: Reimbursement notes field references attachments but does not store files. Implement file upload in future phase.

3. **Email Notifications**: No automated emails on approval/denial. Add in future phase.

4. **Audit Trail**: Basic tracking with reviewerId/reviewerName. Consider full audit log in future.

5. **Payroll Status Updates**: No UI to update Draft → Approved → Processed. Add workflow in future phase.

---

## Test Results Summary

**Test Date**: ___________
**Tester**: ___________
**Environment**: Development / Staging / Production

### Module Test Results

| Test Category | Tests Passed | Tests Failed | Notes |
|---------------|--------------|--------------|-------|
| Module Selector | __ / __ | __ / __ | |
| Dashboard (Staff/Manager) | __ / __ | __ / __ | |
| Dashboard (Admin) | __ / __ | __ / __ | |
| Reimbursement Submission | __ / __ | __ / __ | |
| Reimbursement Approval | __ / __ | __ / __ | |
| Payroll Upload | __ / __ | __ / __ | |
| Payroll History | __ / __ | __ / __ | |
| Process Reimbursements | __ / __ | __ / __ | |
| Reimbursements List | __ / __ | __ / __ | |
| Permissions | __ / __ | __ / __ | |
| Integration | __ / __ | __ / __ | |
| Edge Cases | __ / __ | __ / __ | |

### Critical Issues Found
_(List any blocker issues that prevent module use)_

---

### Non-Critical Issues Found
_(List any minor issues or enhancements)_

---

### Overall Assessment
- [ ] **PASS** - Module ready for production
- [ ] **CONDITIONAL PASS** - Minor issues, acceptable for deployment
- [ ] **FAIL** - Critical issues must be resolved before deployment

---

## Next Steps After Testing

1. **If tests pass**:
   - Deploy to staging environment
   - User acceptance testing (UAT) with real users
   - Create user documentation
   - Training for staff on new reimbursement process

2. **If tests fail**:
   - Document all failures with screenshots
   - Create GitHub issues for each bug
   - Prioritize fixes
   - Re-test after fixes

3. **Enhancement backlog**:
   - File upload for receipts
   - Email notifications
   - Payroll status workflow UI
   - Bulk reimbursement import
   - Reporting and analytics
   - Export to CSV/Excel
