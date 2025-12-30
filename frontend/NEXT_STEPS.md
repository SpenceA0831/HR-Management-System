# Next Steps & Project Status

Last Updated: 2025-12-30

## Current Session Status

**Status**: SignIn page dynamic user loading implemented - ready for backend deployment
**Branch**: main
**Last Action**: Implemented dynamic user loading on SignIn page from Google Sheets

## Recently Completed (Latest Session)

### Dynamic SignIn User Loading (⏳ Pending Deployment - Session 2025-12-30)
- [x] Created `usersApi.ts` with `getDemoUsers()`, `getUsers()`, and `getCurrentUser()` functions
- [x] Added `handleGetDemoUsers()` backend function in `UserService.gs` (public endpoint)
- [x] Added `getDemoUsers` route in `Code.gs` (no auth required, for login page)
- [x] Updated `SignIn.tsx` to dynamically fetch users on mount
- [x] Removed hardcoded `DEMO_USERS` array from SignIn page
- [x] Added loading state and error handling for user fetch
- [x] Updated button to show loading spinner while fetching users
- [x] Backend changes ready to deploy - need new Apps Script deployment

**Next Steps for Deployment:**
1. Copy updated backend files to Google Apps Script:
   - `backend/Code.gs` (added getDemoUsers route)
   - `backend/UserService.gs` (added handleGetDemoUsers function)
   - `backend/Auth.gs` (updated getCurrentUserEmail for demo mode)
2. Create new Apps Script deployment
3. Update `.env` with new deployment URL
4. Add users to Google Sheets Users tab (currently only has 3 users)
5. Test login with dynamically loaded users

## Previously Completed

### PTO Workflow Enhancements (✅ Complete - Commit: 3b9e20f)
- [x] Status label mapping: "Submitted" now displays as "Awaiting Approval"
- [x] Changed Submitted status color from blue to orange (warning)
- [x] Real-time PTO balance display on NewRequest and RequestDetail forms
- [x] Balance shows: Available PTO, This Request, and Remaining After
- [x] Warning indicator when request exceeds available balance
- [x] Display assigned approver information on request details
- [x] Made history section collapsible to reduce UI clutter
- [x] Cache-busting for GET requests to prevent stale data
- [x] Updated Dashboard pie chart legend to show "Awaiting Approval"
- [x] Optimized RequestsList column widths and added Created date

### RequestsList Improvements (✅ Complete - Commit: ddeebda)
- [x] Center data in DataGrid columns
- [x] Vertically center action buttons in rows
- [x] Reduce row height in Team PTO requests table
- [x] Add filters (status, user name, date range)
- [x] Fix TypeScript build errors

## Recently Completed

### PTO Module Foundation (✅ Complete)
- [x] PTO Dashboard with balance tracking and charts
- [x] Request list view with DataGrid
- [x] New request form with validation
- [x] Request detail view with edit mode
- [x] Approval/denial workflow for managers
- [x] Draft vs Submit status handling
- [x] Short notice warnings (< 14 days)
- [x] Half-day support

### Demo Mode (✅ Complete)
- [x] Four demo users (Staff, Manager, Admin roles)
- [x] Menu selector in SignIn page
- [x] Backend integration with demoEmail parameter
- [x] User ID synchronization with Google Sheets

### Manager Experience (✅ Complete)
- [x] Enhanced dashboard with 4 metric cards
- [x] Visual priority for pending requests (orange highlight)
- [x] Quick approve/deny actions in dashboard
- [x] Separate "My Requests" and "Team Requests" sections
- [x] Type and status chips for quick scanning
- [x] Request reason preview in team activity

### Technical Fixes (✅ Complete)
- [x] CORS bypass using Content-Type: text/plain
- [x] MUI v7 Grid migration (item/xs → size prop)
- [x] Dashboard auto-refresh using location.key
- [x] Separate button loading states (draft vs submit)
- [x] User ID matching between frontend and backend
- [x] Form width improvements (maxWidth: 800)

## Known Issues & Quirks

### Backend Dependencies
- Backend must accept `demoEmail` parameter in both URL and POST body
- Backend must use `payload.status || PTO_STATUSES.DRAFT` (not hardcoded)
- User data in frontend must exactly match Google Sheets Users tab

### State Caching
- User data is cached in localStorage as 'hr-management-storage'
- Users must sign out and back in after changing user data to see updates
- Can clear with: `localStorage.removeItem('hr-management-storage')`

### Google Apps Script Caching
- GET requests are cached by Apps Script, causing stale data
- **Fixed**: Cache-busting implemented in `apiClient.ts` with `&_t=${Date.now()}` parameter
- If you see old data after updates, verify cache-busting is enabled

### MUI v7 Breaking Changes
- Must use `<Grid size={{ xs: 12 }}>` instead of `<Grid item xs={12}>`
- TypeScript will error if using old API

## Not Yet Implemented

### Evaluations Module
The evaluations module has foundation files but is not functional:
- Dashboard exists but shows placeholder content
- No forms or workflows implemented
- Types are defined in `src/types/index.ts`
- Will need evaluation creation, peer review, manager review flows

### PTO Features Not Implemented
- [ ] Calendar view of team PTO
- [ ] Conflict detection (multiple people out same day)
- [ ] Holiday and blackout date management UI
- [ ] System configuration UI (admin only)
- [ ] Email notifications
- [ ] File attachments for PTO requests
- [ ] Manager comments/change requests workflow (status exists but UI incomplete)
- [ ] Export requests to PDF/CSV
- [ ] Bulk approve/deny actions for managers

### General Features
- [ ] User profile management
- [ ] Team management (create/edit teams)
- [ ] User administration (ADMIN role)
- [ ] Reporting/analytics
- [ ] Export functionality
- [ ] Mobile responsive improvements

## Development Environment

### Current Setup
- React 19.2.0 + TypeScript
- Vite 7.2.4 dev server on port 5173
- Material-UI v7.3.6
- Zustand for state management
- React Hook Form + Zod validation
- Google Apps Script backend

### Environment Variables
Located in `.env` (not tracked in git):
```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Running Locally
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Debugging
- Open browser console and use `window.debugApi`
- Available methods: `testHealth()`, `testGetBalance()`, `testGetRequests()`, `testCreateRequest()`, `runAllTests()`

## Architecture Notes

### Demo Mode Flow
1. User selects demo user from SignIn menu
2. Frontend sets user in Zustand store
3. All API calls include `demoEmail` in URL query params AND POST body
4. Backend checks for `demoEmail` when no Google session exists
5. Backend uses demo email to look up user in Users sheet

### PTO Request Workflow
1. **Draft**: User creates request, saves without submitting
2. **Submitted**: User submits request for approval (displays as "Awaiting Approval" in UI)
3. **Pending**: Same as Submitted (backend uses interchangeably)
4. **Approved**: Manager approves, hours deducted from balance
5. **Denied**: Manager denies with reason
6. **ChangesRequested**: Manager asks employee to modify (not fully implemented)
7. **Cancelled**: Employee cancels their own request

**Status Label Mapping**: The UI displays user-friendly labels while maintaining technical status values internally:
- `StatusChip` component uses `statusLabelMap` to show "Awaiting Approval" instead of "Submitted"
- Dashboard pie chart and all status displays use the mapped labels

### Permission Model
- **STAFF**: Can create/edit own requests, view own balance
- **MANAGER**: All STAFF permissions + approve/deny team requests, view team activity
- **ADMIN**: All MANAGER permissions + future admin features (not implemented)

## Quick Reference: File Locations

### Core Files
- **Types**: `src/types/index.ts`
- **Store**: `src/store/useStore.ts`
- **Routing**: `src/App.tsx`
- **Auth**: `src/pages/SignIn.tsx`

### PTO Module
- **Dashboard**: `src/modules/pto/Dashboard.tsx`
- **List**: `src/modules/pto/RequestsList.tsx`
- **Create**: `src/modules/pto/NewRequest.tsx`
- **Detail**: `src/modules/pto/RequestDetail.tsx`

### API Layer
- **Client**: `src/services/api/apiClient.ts`
- **PTO API**: `src/services/api/ptoApi.ts`
- **Debug**: `src/services/api/debugApi.ts`

### Utilities
- **PTO Calculations**: `src/utils/ptoUtils.ts`
- **Type Colors**: `src/utils/typeColors.ts`

### Shared Components
- **Layout**: `src/components/Layout.tsx`
- **StatusChip**: `src/components/StatusChip.tsx` (includes status label mapping)
- **TypeChip**: `src/components/TypeChip.tsx`

### Key UX Features
- **Real-time Balance Display**: NewRequest and RequestDetail show Available PTO, Request Hours, and Remaining After as user fills form
- **Collapsible Sections**: History section in RequestDetail uses Material-UI Collapse component
- **Assigned Approver**: Request details show who will review the request (highlighted in blue)
- **Cache-Busting**: All GET requests include timestamp to prevent stale data from Apps Script cache

## Resume From Here

When resuming this session:

1. **First thing**: Check git status with `git status`
2. **Last commit**: 3b9e20f - "Enhance PTO workflow with clearer status labels and balance visibility"
3. **All work committed**: PTO workflow enhancements are complete
4. **Read CLAUDE.md**: For comprehensive architecture overview and implementation patterns
5. **Environment**: Ensure `.env` is configured for local development

## Potential Next Steps

The PTO module is now feature-complete for the core workflow. Possible next areas:

1. **Calendar View**: Implement visual calendar showing team PTO requests
2. **Conflict Detection**: Warn when multiple people request same dates
3. **Evaluations Module**: Start implementing the evaluation creation and review workflow
4. **Admin Features**: User management, team configuration, system settings
5. **Reporting**: Export capabilities, analytics, PTO usage reports
6. **Mobile Optimization**: Improve responsive design for mobile devices
