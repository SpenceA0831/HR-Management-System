# Next Steps & Project Status

Last Updated: 2025-12-28

## Current Session Status

**Status**: Ready to commit changes
**Branch**: main
**Last Action**: Created CLAUDE.md documentation

## Pending Immediate Tasks

### 1. Git Commit (Ready)
Changes are staged and ready to be committed locally. User has GitHub authentication.

**Modified Files:**
- `src/App.tsx` - Added PTO module routes
- `src/main.tsx` - Added GoogleOAuthProvider and debugApi
- `src/modules/pto/Dashboard.tsx` - Enhanced manager experience with better metrics
- `src/pages/SignIn.tsx` - Added multi-user demo mode selector
- `src/services/api/apiClient.ts` - Added CORS workaround and demo mode
- `src/services/api/ptoApi.ts` - Added status parameter to createPtoRequest
- `src/utils/ptoUtils.ts` - Added utility functions

**New Files:**
- `src/modules/pto/NewRequest.tsx` - PTO request creation form
- `src/modules/pto/RequestDetail.tsx` - View/edit PTO request with approval actions
- `src/modules/pto/RequestsList.tsx` - DataGrid list of all PTO requests
- `src/services/api/debugApi.ts` - Debugging utilities

**Suggested Commit Message:**
```
Complete PTO module with enhanced manager experience

- Add PTO request management (list, create, edit, approve/deny)
- Implement demo mode authentication for local development
- Fix CORS issues using text/plain Content-Type
- Enhance manager dashboard with clear metrics and visual priorities
- Add multi-user demo selector (Staff, Manager, Admin roles)
- Fix MUI v7 Grid compatibility issues
- Add auto-refresh when navigating back to dashboard
- Implement dual save/submit actions for draft workflow
- Add debugging utilities (window.debugApi)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 2. RequestsList Improvements (User said "stop" - deferred)
**Note**: User requested these but said "stop" before implementation began.

- [ ] Center data in DataGrid columns
- [ ] Vertically center action buttons in rows
- [ ] Reduce row height in Team PTO requests table
- [ ] Add filters (status, user name, date range)

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
- [ ] Manager comments/change requests workflow

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
2. **Submitted**: User submits request for approval
3. **Pending**: Same as Submitted (backend uses interchangeably)
4. **Approved**: Manager approves, hours deducted from balance
5. **Denied**: Manager denies with reason
6. **ChangesRequested**: Manager asks employee to modify (not fully implemented)
7. **Cancelled**: Employee cancels their own request

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
- **StatusChip**: `src/components/StatusChip.tsx`
- **TypeChip**: `src/components/TypeChip.tsx`

## Resume From Here

When resuming this session:

1. **First thing**: Check git status with `git status`
2. **If changes uncommitted**: Create the commit with the message above
3. **If commit done**: User can push to GitHub themselves
4. **Next feature work**: Likely RequestsList improvements or Evaluations module
5. **Check**: Read CLAUDE.md for architecture overview
6. **Environment**: Ensure `.env` is configured for local development

## Questions to Ask User (when resuming)

- Are the changes committed and pushed?
- Do you want to continue with RequestsList improvements?
- Should we start implementing the Evaluations module?
- Are there any bugs or issues with the current PTO module?
