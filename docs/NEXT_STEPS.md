# Next Steps - Implementation Roadmap

## Recent Updates (December 2025)

### Payroll & Reimbursements Module Implementation

The Payroll module has been added with comprehensive functionality for bi-weekly payroll tracking and employee reimbursement management.

**✅ Completed:**
- Backend Services:
  - `PayrollService.gs` - Payroll run CRUD and status management
  - `PayrollGenerator.gs` - Pre-populate 26 bi-weekly runs for the year
  - `ReimbursementService.gs` - Reimbursement request workflow with manager approval
  - Added 3 new routes: `generateAnnualRuns`, `getPendingRuns`, `updatePendingRun`
  - Added `Pending` status to payroll workflow (Pending → Draft → Approved → Processed)

- Frontend Components:
  - `Dashboard.tsx` - Role-based dashboard (ADMIN: payroll runs + reimbursements; STAFF: my reimbursements)
  - `PayrollApproval.tsx` - Batch process approved reimbursements (ADMIN only)
  - `PayrollHistory.tsx` - All payroll runs with DataGrid filtering (ADMIN only)
  - `PayrollUpload.tsx` - Dual-mode: Paychex PDF upload OR manual entry (ADMIN only)
  - `ReimbursementsList.tsx` - View/manage reimbursements with filters
  - `NewReimbursement.tsx` - Submit reimbursement request form
  - `ReimbursementDetail.tsx` - View and approve/deny reimbursements

- Utilities:
  - `payrollUtils.ts` - Currency formatting, date calculations, status helpers
  - `paychexParser.ts` - PDF parsing for Paychex payroll journals
  - Added types: `PayrollRun`, `Reimbursement`, with full status enums
  - Created `payrollApi.ts` with all endpoints

- Features:
  - Pre-populated payroll runs (26 bi-weekly runs created annually)
  - Paychex PDF parsing with validation
  - IRS tax-advantaged plans support (Section 127, Section 129)
  - Reimbursement → Payroll integration workflow
  - Role-based access control (STAFF can submit, MANAGER/ADMIN can approve)

**🟡 Remaining (10% of Payroll Module):**
- [ ] Update PayrollUpload to display pending runs list and allow selecting/filling them
- [ ] Create admin UI for generating annual runs (simple form: year + first run date)
- [ ] Add status color indicators for pending runs in PayrollHistory
- [ ] Create comprehensive test plan document

**Test Plan Available:** See `docs/PAYROLL_TEST_PLAN.md` for detailed testing procedures

---

### Staff Evaluations Components Created

Evaluation form components have been converted to Material-UI v7:

**✅ Completed:**
- Created evaluation constants file (`constants/evaluations.ts`)
- Converted components to MUI:
  - `RadarChart.tsx` - 360° competency visualization with ToggleButtonGroup
  - `Timeline.tsx` - MUI Stepper for workflow progress
  - `GrowthReport.tsx` - Perception gap analysis with Table and radar chart
  - `EvaluationForm.tsx` - Competency rating form with collapsible sections

**🟡 Remaining:**
- [ ] Create Evaluations Dashboard component
- [ ] Add evaluation routes to App.tsx
- [ ] Create navigation components
- [ ] Test evaluation workflow end-to-end

---

### PTO Dashboard Consolidation

**Completed:**
- ✅ Consolidated `/pto/requests` list into main dashboard
- ✅ Implemented 2-column grid layout for request details page
- ✅ Added tooltip on "Used Hours" showing breakdown by type
- ✅ Fixed home button visibility
- ✅ Updated navigation patterns

**Current Status:**
- PTO module is fully functional with complete request lifecycle
- Dashboard provides unified view with filtering, sorting, and inline actions
- Balance tracking with real-time calculations
- Approval workflows fully implemented

---

## Immediate Next Steps

### 1. Complete Payroll Module UI (2-3 hours)

**Action Items:**
- [ ] Update PayrollUpload component:
  - Display list of pending runs at top
  - Allow selecting a pending run to fill
  - Pre-populate form with run's dates
  - Call `updatePendingRun()` instead of `logPayroll()` when filling pending run

- [ ] Create admin page for generating annual runs:
  - Simple form with year input and first run date picker
  - Button to call `generateAnnualRuns()`
  - Success/error feedback

- [ ] Add visual indicators:
  - Color-code pending runs in PayrollHistory (gray/pending color)
  - Highlight next upcoming run to be filled
  - Show count of pending vs completed runs

**File Locations:**
- Update: `frontend/src/modules/payroll/PayrollUpload.tsx`
- Create: `frontend/src/modules/payroll/GenerateAnnualRuns.tsx` (or add to admin section)
- Update: `frontend/src/modules/payroll/PayrollHistory.tsx` (status chip colors)

---

### 2. Complete Staff Evaluations Module (1-2 days)

**Components to Create:**
- [ ] `Dashboard.tsx` - Main evaluations landing page
  - My current evaluations (self-assessment status)
  - Pending peer reviews I need to complete
  - Evaluations I'm managing (if manager)
  - Quick stats (completion rate, upcoming deadlines)

- [ ] Page components:
  - `MyEvaluation.tsx` - Self-assessment entry
  - `PeerReviews.tsx` - List of peer reviews to complete
  - `PeerReviewForm.tsx` - Submit peer review
  - `EvaluationDetail.tsx` - View complete evaluation with all ratings

**Routing:**
- [ ] Add routes to `App.tsx`:
  ```typescript
  <Route path="evaluations">
    <Route index element={<EvaluationsDashboard />} />
    <Route path="my-evaluation" element={<MyEvaluation />} />
    <Route path="peer-reviews" element={<PeerReviews />} />
    <Route path="peer-review/:id" element={<PeerReviewForm />} />
    <Route path=":id" element={<EvaluationDetail />} />
    <Route path="growth-report" element={<GrowthReport />} />
  </Route>
  ```

**API Integration:**
- [ ] Verify `evaluationsApi.ts` has all needed endpoints
- [ ] Add any missing API functions (evaluation CRUD, submit/approve)
- [ ] Connect components to API

---

### 3. Backend Deployment & Sample Data (3-4 hours)

**Google Sheets Setup:**
- [ ] Update `scripts/SetupGoogleSheets.gs` with new sheets:
  - Payroll_History
  - Reimbursements

- [ ] Add sample data for testing:
  - 3-4 sample payroll runs (some pending, some completed)
  - 10-12 sample reimbursements (various statuses and types)
  - 5-6 sample evaluation cycles
  - Sample competencies, ratings, goals

**Backend Files to Deploy:**

All files in `/backend` directory:
```
Code.gs (main router)
Config.gs (updated with payroll enums)
Auth.gs
Utils.gs (with payroll row converters)

# PTO Module
UserService.gs
PtoService.gs
PtoBalanceService.gs
HolidayService.gs
ConfigService.gs

# Payroll Module (NEW)
PayrollService.gs
PayrollGenerator.gs
ReimbursementService.gs

# Evaluations Module
EvaluationService.gs
RatingService.gs
GoalService.gs
PeerReviewService.gs
CompetencyService.gs
CycleService.gs
```

**Deployment Steps:**
1. [ ] Create/open Google Sheet for database
2. [ ] Extensions → Apps Script
3. [ ] Copy all `.gs` files from `/backend` directory
4. [ ] Run `setupDatabase()` from SetupGoogleSheets.gs
5. [ ] Run `addSampleData()` for test data
6. [ ] Deploy → New deployment → Web app
7. [ ] Copy deployment URL to `frontend/.env` as `VITE_APPS_SCRIPT_URL`
8. [ ] Test endpoints with Postman or curl
9. [ ] Verify all modules work with real backend

---

### 4. Testing & QA (2-3 days)

**Payroll Module Testing:**
- [ ] Test pre-populated runs workflow:
  - Generate annual runs for 2025
  - Upload Paychex PDF for next pending run
  - Verify dates pre-filled correctly
  - Verify financial data fills correctly
  - Approve and process run

- [ ] Test reimbursement workflow:
  - Submit as STAFF user
  - Approve as MANAGER user
  - Process in PayrollApproval as ADMIN
  - Verify status changes correctly

- [ ] Test permissions:
  - STAFF can only see own reimbursements
  - MANAGER can see all, approve reimbursements
  - ADMIN has full access to payroll functions

**Evaluations Module Testing:**
- [ ] Test evaluation lifecycle:
  - Self-assessment (STAFF)
  - Peer review (STAFF reviewing colleague)
  - Manager review (MANAGER)
  - Complete workflow and view growth report

- [ ] Test radar chart visualization
- [ ] Test perception gap analysis
- [ ] Test competency management (ADMIN)

**Cross-Module Testing:**
- [ ] Navigation between all modules
- [ ] Theme switching (light/dark mode)
- [ ] Responsive layout on mobile
- [ ] Browser compatibility (Chrome, Safari, Firefox)

**Performance Testing:**
- [ ] Load time with realistic data (100+ PTO requests, 50+ reimbursements)
- [ ] Multiple concurrent users
- [ ] PDF parsing performance

---

### 5. Documentation Updates (1-2 hours)

**Files to Update:**
- [x] `CLAUDE.md` - Updated with Payroll module info, workflows, backend services
- [ ] `docs/GOOGLE_SHEETS_STRUCTURE.md` - Add Payroll_History and Reimbursements sheets
- [ ] `docs/SETUP.md` - Add Payroll module setup steps
- [ ] `docs/CONFIGURATION.md` - Add payroll configuration options
- [ ] `README.md` - Update with current module status
- [ ] `frontend/CLAUDE.md` - Add Payroll component patterns

**New Documentation to Create:**
- [ ] `docs/PAYROLL_WORKFLOW.md` - Detailed payroll process documentation
- [ ] `docs/REIMBURSEMENT_GUIDE.md` - User guide for submitting reimbursements
- [ ] `docs/EVALUATION_GUIDE.md` - User guide for evaluation process

---

## Near Term (Next 2 Weeks)

### 6. Polish & UX Improvements (1-2 days)

**UI Enhancements:**
- [ ] Add loading skeletons for all data tables
- [ ] Implement toast notifications (success/error messages)
- [ ] Add empty states with helpful guidance
- [ ] Confirmation dialogs for destructive actions
- [ ] Optimistic UI updates for better perceived performance

**Accessibility:**
- [ ] Keyboard navigation for all forms
- [ ] ARIA labels for screen readers
- [ ] Color contrast validation
- [ ] Focus indicators on all interactive elements

**Mobile Optimization:**
- [ ] Test on iOS/Android devices
- [ ] Optimize DataGrid for mobile (responsive columns)
- [ ] Touch-friendly form inputs
- [ ] Mobile-specific navigation patterns

---

### 7. Deployment (1 day)

**Frontend Deployment (Netlify/Vercel):**
1. [ ] Create account on hosting platform
2. [ ] Connect GitHub repository
3. [ ] Configure build settings:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
4. [ ] Add environment variables:
   - `VITE_APPS_SCRIPT_URL`
   - `VITE_GOOGLE_CLIENT_ID` (optional for OAuth)
5. [ ] Deploy and test
6. [ ] Set up custom domain (optional)

**Post-Deployment:**
- [ ] Test all modules in production
- [ ] Verify Google OAuth works
- [ ] Monitor for errors
- [ ] Set up analytics (optional: Google Analytics, Plausible)
- [ ] Set up error tracking (optional: Sentry)

---

## Current Implementation Status

### ✅ Completed Modules

**PTO Tracker (100%)**
- Request management (create, submit, approve, deny, cancel)
- Balance tracking with real-time calculations
- Holiday and blackout date management
- Approval workflows for managers/admins
- Dashboard with consolidated view

**Payroll & Reimbursements (90%)**
- Backend: Complete (100%)
  - Pre-populated payroll runs
  - Paychex PDF parsing
  - Reimbursement workflow
  - All API endpoints

- Frontend: Mostly Complete (90%)
  - ✅ Dashboard, History, Approval components
  - ✅ Reimbursement list, form, detail
  - ✅ PayrollUpload with PDF parsing
  - 🟡 Pending: UI for filling pre-populated runs
  - 🟡 Pending: Admin UI to generate annual runs

### 🟡 In Progress

**Staff Evaluations (40%)**
- ✅ Backend services foundation (100%)
- ✅ Component library created (70%)
  - RadarChart, Timeline, GrowthReport, EvaluationForm
- 🟡 Routes and Dashboard (0%)
- 🟡 Full workflow integration (0%)

### 🔴 Not Started

**Advanced Features**
- Email notifications
- Export to PDF/CSV
- Batch operations
- Real-time updates
- Mobile app

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Google Sheets Setup | 1-2 hours | ✅ Complete |
| 2. Apps Script Backend - PTO | 1-2 days | ✅ Complete |
| 3. Apps Script Backend - Payroll | 1 day | ✅ Complete |
| 4. Google OAuth | 2-3 hours | ✅ Complete |
| 5. PTO Migration | 2-3 days | ✅ Complete |
| 6. Payroll Frontend | 2 days | 🟡 90% Complete |
| 7. Evaluations Components | 1 day | 🟡 40% Complete |
| 8. Evaluations Integration | 1-2 days | 🔴 Not Started |
| 9. Testing & QA | 2-3 days | 🟡 Ongoing |
| 10. Documentation | 1-2 hours | 🟡 In Progress |
| 11. Deployment | 1 day | 🔴 Not Started |
| **TOTAL** | **12-20 days** | **🟢 70% Complete** |

---

## Success Metrics

**Track these to measure success:**
- [ ] User adoption rate
- [ ] PTO requests submitted per week
- [ ] Reimbursement processing time
- [ ] Evaluation completion rate
- [ ] Average approval time
- [ ] System uptime (>99%)
- [ ] User satisfaction score
- [ ] Time saved vs. manual process

---

## Getting Help

If you get stuck:
1. Check `CLAUDE.md` for architecture patterns
2. Review `docs/PAYROLL_TEST_PLAN.md` for testing guidance
3. Check Google Apps Script documentation
4. Test API endpoints with Postman/curl
5. Use browser DevTools for frontend debugging
6. Check `window.debugApi` in dev mode

---

## Key Files Reference

**Documentation:**
- `CLAUDE.md` - Main project documentation
- `docs/NEXT_STEPS.md` - This file
- `docs/GOOGLE_SHEETS_STRUCTURE.md` - Database schema
- `docs/PAYROLL_TEST_PLAN.md` - Payroll testing guide

**Backend:**
- `backend/Code.gs` - Main router
- `backend/Config.gs` - Configuration
- `backend/PayrollGenerator.gs` - Annual run generation
- `scripts/SetupGoogleSheets.gs` - Database setup script

**Frontend:**
- `frontend/src/types/index.ts` - All TypeScript types
- `frontend/src/services/api/payrollApi.ts` - Payroll API functions
- `frontend/src/modules/payroll/` - Payroll components
- `frontend/src/constants/evaluations.ts` - Evaluation constants

---

## Ready to Continue?

**Next immediate tasks (in order):**
1. Complete PayrollUpload pending runs UI (2-3 hours)
2. Create admin UI for generating annual runs (1 hour)
3. Complete Evaluations Dashboard (3-4 hours)
4. Deploy backend to Google Apps Script (1-2 hours)
5. End-to-end testing of all modules (1 day)
6. Deploy frontend to production (2-3 hours)

The foundation is solid and most features are implemented. Focus on completing the remaining UI components and deploying to production!
