# Next Steps - Implementation Roadmap

## Recent Updates (December 2025)

### PTO Dashboard Consolidation
The PTO module has been streamlined with the following improvements:

**Completed:**
- ✅ Consolidated `/pto/requests` list into main dashboard - all request viewing now happens on the dashboard with DataGrid filtering
- ✅ Implemented 2-column grid layout for request details page - more efficient use of screen space
- ✅ Added tooltip on "Used Hours" showing breakdown by type (Vacation, Sick, Other)
- ✅ Fixed home button visibility - each module dashboard automatically sets `activeModule` on mount
- ✅ Updated navigation patterns - all routes now point to `/pto` instead of `/pto/requests`

**Current Status:**
- PTO module is fully functional with request lifecycle (create, submit, approve/deny, cancel)
- Dashboard provides unified view with filtering, sorting, and inline actions
- Balance tracking with real-time calculations working correctly
- Approval workflows implemented for managers and admins

---

## Immediate Next Steps (This Week)

### 1. Create Google Sheets Database (1-2 hours) - ✅ COMPLETE

**Action Items:**
- [x] Create new Google Sheet: "HR Management System Database"
- [x] Create 12 sheets (tabs) as specified in setup guide
- [x] Add column headers for each sheet
- [x] Populate with initial test data (copy from existing projects)
- [x] Share sheet with appropriate users
- [x] Note the Sheet ID

**Status:** Google Sheets database is fully set up and operational with all required sheets and test data.

**Reference:** See `/docs/GOOGLE_SHEETS_STRUCTURE.md` for column definitions

---

### 2. Build Google Apps Script Backend (1-2 days) - ✅ COMPLETE

**Files Created:**

#### Core Files
- [x] `Code.gs` - Main router (GET/POST handler)
- [x] `Config.gs` - Sheet names, column mappings, enums
- [x] `Auth.gs` - Authentication and authorization functions
- [x] `Utils.gs` - Helper functions (ID generation, row conversion)

#### Service Files
- [x] `UserService.gs` - User management
- [x] `PtoRequestService.gs` - PTO request CRUD
- [x] `BalanceService.gs` - PTO balance calculations
- [x] `HolidayService.gs` - Holiday management
- [x] `EvaluationService.gs` - Evaluation CRUD (foundation)
- [x] `RatingService.gs` - Rating operations (foundation)
- [x] `GoalService.gs` - Goal management (foundation)
- [x] `PeerReviewService.gs` - Peer review workflow (foundation)
- [x] `CompetencyService.gs` - Competency management (foundation)
- [x] `CycleService.gs` - Evaluation cycle management (foundation)

**Status:** Backend is fully deployed and operational. PTO services are complete, evaluation services have foundation in place.

**Deployment:**
- [x] Deploy as Web App
- [x] Test with curl/Postman
- [x] Verify authorization rules

---

### 3. Implement Google OAuth (2-3 hours) - ✅ COMPLETE

**Action Items:**
- [x] Create Google Cloud Project
- [x] Enable Google Sign-In API
- [x] Create OAuth 2.0 Client ID
- [x] Add authorized JavaScript origins
- [x] Update `VITE_GOOGLE_CLIENT_ID` in .env
- [x] Implement demo mode for local development
- [x] Test sign-in flow (both OAuth and demo mode)
- [x] Connect to backend `getCurrentUser` endpoint

**Status:** Authentication is fully functional with two modes:
- **Demo Mode:** Used for local development - dynamically loads users from Google Sheets via `getDemoUsers` endpoint
- **Google OAuth:** Available for production deployment with proper OAuth credentials

---

### 4. Migrate PTO Module (2-3 days) - ✅ COMPLETE

**Components Implemented:**
- [x] Dashboard (balance chart with tooltip breakdown, consolidated request list with DataGrid, filtering)
- [x] NewRequest (PTO request form with validation, real-time balance calculation, short notice warnings)
- [x] RequestDetail (2-column grid layout, request details + approval workflow for managers/admins)
- [x] ~~RequestsList~~ (consolidated into Dashboard with DataGrid - removed as separate page)
- [x] StatusChip and TypeChip components for color-coded badges

**Supporting Files:**
- [x] PTO utils (calculatePtoHours, formatPtoDates, isShortNotice)
- [x] Type colors and styling
- [x] Status/Type chip components with user-friendly labels

**API Integration:**
- [x] Created `src/services/api/ptoApi.ts` with all endpoints
- [x] Implemented all PTO API calls (requests, balance, approvals, cancellations)
- [x] Components integrated with API and state management

**Routing:**
- [x] Added PTO routes to App.tsx
- [x] `/pto` - Main dashboard (consolidated view)
- [x] `/pto/requests/new` - New request form
- [x] `/pto/requests/:id` - Request detail/edit
- [x] Navigation tested and working

**Recent Enhancements:**
- [x] Consolidated `/pto/requests` into main dashboard for better UX
- [x] 2-column grid layout on request details for better space utilization
- [x] Tooltip on "Used Hours" showing breakdown by type (Vacation, Sick, Other)
- [x] Fixed home button visibility by auto-setting activeModule

**Status:** PTO module is production-ready with full request lifecycle management, approval workflows, and balance tracking.

---

### 5. Migrate Staff Evaluations Module (2-3 days)

**Components to Migrate:**
- [ ] EvaluationForm (competency ratings form)
- [ ] GrowthReport (360-degree analysis with radar chart)
- [ ] PeerReviewList (peer review requests)
- [ ] Timeline (evaluation workflow visualization)
- [ ] CompetencyManager (admin competency CRUD)

**Rebuild with MUI:**
- [ ] Replace custom components with MUI equivalents
- [ ] Match PTO Tracker theme/style
- [ ] Ensure mobile responsiveness

**API Integration:**
- [ ] Create `src/services/api/evaluationApi.ts`
- [ ] Implement all Evaluation API calls
- [ ] Update components to use new API

**Routing:**
- [ ] Add all Evaluation routes to App.tsx
- [ ] Test navigation between pages

---

## Near Term (Next 2 Weeks)

### 6. Testing & QA (2-3 days)

**Functional Testing:**
- [ ] Test authentication flow (sign in, sign out)
- [ ] Test PTO request lifecycle (create, submit, approve, deny, cancel)
- [ ] Test PTO balance calculations
- [ ] Test evaluation lifecycle (self → peer → manager → complete)
- [ ] Test 360-degree feedback analysis
- [ ] Test permissions (staff vs manager vs admin)
- [ ] Test cross-module navigation

**Edge Cases:**
- [ ] Concurrent edits (use LockService)
- [ ] Invalid data handling
- [ ] Network errors
- [ ] Session expiration

**Performance Testing:**
- [ ] Load time with realistic data volumes
- [ ] Multiple concurrent users (5-10)
- [ ] Large dataset queries

**Browser Testing:**
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

### 7. Polish & UX Improvements (1-2 days)

**UI Enhancements:**
- [ ] Loading states for all async operations
- [ ] Error messages and toast notifications
- [ ] Empty states (no requests, no evaluations)
- [ ] Confirmation dialogs for destructive actions
- [ ] Optimistic UI updates

**Accessibility:**
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ratios
- [ ] Focus indicators

**Mobile Optimization:**
- [ ] Test on actual devices
- [ ] Optimize touch targets
- [ ] Responsive tables/grids
- [ ] Mobile-friendly forms

---

### 8. Deployment (1 day)

**Frontend Deployment (Netlify recommended):**
1. [ ] Create Netlify account
2. [ ] Connect GitHub repo (optional)
3. [ ] Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. [ ] Add environment variables in Netlify dashboard
5. [ ] Deploy and test
6. [ ] Set up custom domain (optional)

**Backend:**
- [ ] Already deployed via Apps Script
- [ ] Update CORS settings if needed
- [ ] Monitor quota usage

**Post-Deployment:**
- [ ] Test production URLs
- [ ] Verify Google OAuth works in production
- [ ] Check analytics/monitoring
- [ ] Set up error tracking (optional: Sentry)

---

## Future Enhancements (Optional)

### Short Term
- [ ] Email notifications (PTO approvals, evaluation deadlines)
- [ ] Export data to PDF/CSV
- [ ] Batch operations (approve multiple requests)
- [ ] Advanced filtering and search
- [ ] Auto-save drafts
- [ ] Keyboard shortcuts

### Medium Term
- [ ] Real-time updates (polling or WebSockets)
- [ ] Mobile app (React Native)
- [ ] Offline support with sync
- [ ] Advanced analytics dashboard
- [ ] Integration with Slack/Teams
- [ ] Automated reminders

### Long Term (If Scaling)
- [ ] Migrate to Node.js + PostgreSQL backend
- [ ] Implement Redis caching
- [ ] Add full-text search (Elasticsearch)
- [ ] Multi-tenant support
- [ ] Role-based access control (RBAC) with granular permissions
- [ ] Audit logging
- [ ] API rate limiting

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue**: Apps Script 6-minute timeout
**Mitigation**:
- Optimize queries
- Implement pagination
- Use batch operations
- Monitor execution times

**Issue**: Sheet row limits
**Mitigation**:
- Archive old data annually
- Implement data retention policy
- Monitor row counts

**Issue**: Concurrent edit conflicts
**Mitigation**:
- Use LockService for critical sections
- Implement optimistic locking
- Display conflict warnings

**Issue**: User adoption
**Mitigation**:
- User training sessions
- Documentation and help text
- Gradual rollout
- Gather feedback

---

## Success Metrics

**Track these to measure success:**
- [ ] User sign-ups and active users
- [ ] PTO requests submitted per week
- [ ] Evaluation completion rate
- [ ] Average approval time for requests
- [ ] System uptime and error rates
- [ ] User satisfaction (survey)
- [ ] Time saved vs. previous process

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Google Sheets Setup | 1-2 hours | ✅ Complete |
| 2. Apps Script Backend | 1-2 days | ✅ Complete |
| 3. Google OAuth | 2-3 hours | ✅ Complete (Demo mode implemented) |
| 4. PTO Migration | 2-3 days | ✅ Complete (Recently enhanced) |
| 5. Evaluation Migration | 2-3 days | 🟡 Foundation in place, not fully implemented |
| 6. Testing & QA | 2-3 days | 🟡 Ongoing (manual testing) |
| 7. Polish & UX | 1-2 days | 🟡 Partially complete |
| 8. Deployment | 1 day | 🔴 Not started |
| **TOTAL** | **8-15 days** | **🟢 Core PTO functionality complete** |

---

## Getting Help

If you get stuck:
1. Check the SETUP.md documentation
2. Review original project code (PTO-Tracker-main, Staff-Evaluation-System)
3. Check Google Apps Script documentation
4. Test in isolation (create minimal reproduction)
5. Use browser dev tools for debugging

## Ready to Continue?

The foundation is in place! Start with Phase 1 (Google Sheets setup) and work through each phase systematically. The modular structure makes it easy to build incrementally.
