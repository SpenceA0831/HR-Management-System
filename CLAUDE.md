# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HR Management System is a unified platform combining **PTO (Paid Time Off) tracking** and **Staff Evaluations** in a single application. The system uses a non-traditional architecture with Google Apps Script as the backend, Google Sheets as the database, and React as the frontend.

**Architecture Stack:**
- **Frontend**: React 19 + TypeScript + Material-UI v7 + Zustand + React Router v7
- **Backend**: Google Apps Script (deployed as Web App)
- **Database**: Google Sheets (12 sheets)
- **Auth**: Google Workspace OAuth (with demo mode for local dev)

**Module Status:**
- **PTO Tracker**: Fully implemented with request management, approval workflows, balance tracking
- **Staff Evaluations**: Foundation in place, not fully implemented
- **Admin Panel**: Configuration management for both modules

## Repository Structure

```
/
├── frontend/           # React application (see frontend/CLAUDE.md for details)
├── backend/            # Google Apps Script files (*.gs)
├── scripts/            # Setup automation (SetupGoogleSheets.gs)
├── docs/               # Documentation (SETUP.md, GOOGLE_SHEETS_STRUCTURE.md, etc.)
└── CLAUDE.md          # This file
```

## Development Commands

### Frontend (from `/frontend` directory)

```bash
# Start development server (runs on port 5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Backend Deployment

The backend is Google Apps Script and must be deployed manually through the Google Apps Script editor:

1. Open Google Sheet → Extensions → Apps Script
2. Copy `.gs` files from `/backend` directory
3. Deploy → New deployment → Web app
4. Copy deployment URL to frontend `.env` file

See `/backend/README.md` for detailed deployment instructions.

### Database Setup

Use the automated setup script instead of manually creating sheets:

1. Create new Google Sheet
2. Extensions → Apps Script
3. Copy contents of `/scripts/SetupGoogleSheets.gs`
4. Run `setupDatabase()` function
5. Optionally run `addSampleData()` for test data

See `/scripts/README.md` for details.

## Critical Architecture Notes

### 1. Google Apps Script Backend

**This is NOT a traditional REST API**. Key differences:

- All requests go through a single Web App URL endpoint
- Routing is action-based via `?action=<actionName>` query parameter
- Uses `Content-Type: text/plain` to avoid CORS preflight (OPTIONS) requests
- All responses follow `ApiResponse<T>` wrapper: `{ success: boolean, data?: T, error?: string }`
- GET requests include cache-busting timestamp parameter (`&_t=${Date.now()}`) to prevent stale data

### 2. Demo Mode

The application supports demo mode for local development without real Google OAuth:

- Demo users are defined in `frontend/src/pages/SignIn.tsx`
- Backend checks for `demoEmail` parameter in requests
- `demoEmail` is added to both URL query params AND POST body
- User data must match the Users sheet in Google Sheets backend

**Demo Users:**
1. `demo@example.com` - STAFF role
2. `aaronhspence@gmail.com` - MANAGER role
3. `test@example.com` - STAFF role
4. `ceo@example.com` - ADMIN role

### 3. Material-UI v7 Breaking Changes

**IMPORTANT**: This project uses MUI v7 with breaking changes from v6:

```tsx
// ✅ CORRECT (v7)
<Grid size={{ xs: 12, md: 6 }}>

// ❌ WRONG (v6 - will not work)
<Grid item xs={12} md={6}>
```

The `item` prop and direct responsive props (`xs`, `md`, etc.) were removed. Use the `size` prop with an object.

### 4. Multi-Module Architecture

The application has a module selector pattern:

```
Unauthenticated → SignIn page
Authenticated → ModuleSelector → Choose PTO or Evaluations
              → /pto → PTO Dashboard & features
              → /evaluations → Evaluations Dashboard & features
              → /admin → Admin settings (ADMIN role only)
```

Active module is stored in Zustand state (`activeModule: 'pto' | 'evaluations' | 'admin'`).

### 5. Backend Service Layer Organization

Backend code is organized by service:

- **Code.gs**: Main router (doGet/doPost handlers)
- **Config.gs**: Sheet names, column mappings, enums
- **Auth.gs**: Authentication and authorization
- **Utils.gs**: Helper functions, converters, response builders
- **UserService.gs**: User CRUD operations
- **PtoService.gs**: PTO request management
- **PtoBalanceService.gs**: PTO balance calculations
- **HolidayService.gs**: Holidays and blackout dates
- **ConfigService.gs**: System configuration
- **EvaluationService.gs**: Evaluation CRUD
- **RatingService.gs**, **GoalService.gs**, **PeerReviewService.gs**, **CycleService.gs**, **CompetencyService.gs**: Evaluation features

All services follow the same pattern:
1. Handler function in Code.gs routes to service function
2. Service function validates permissions
3. Service accesses Google Sheets via Config.gs mappings
4. Returns `successResponse(data)` or `errorResponse(message, code)`

### 6. State Management Strategy

**Zustand Store** (`frontend/src/store/useStore.ts`) - Global state:
- `currentUser`: Authenticated user object
- `isAuthenticated`: Boolean for routing
- `activeModule`: 'pto' | 'evaluations' | 'admin'
- `mode`: 'light' | 'dark' theme mode
- Persisted to localStorage as 'hr-management-storage'

**Local State** (useState) - Component-specific:
- Form data
- Loading states
- UI toggles (expanded sections, etc.)
- Temporary values

**React Hook Form** - Form validation:
- Uses Zod schemas for validation
- All forms follow this pattern

### 7. API Client Pattern

All API calls go through service layers in `frontend/src/services/api/`:

- `apiClient.ts`: Core HTTP client with demo mode support
- `ptoApi.ts`: PTO endpoints
- `evaluationsApi.ts`: Evaluation endpoints
- `debugApi.ts`: Debugging utilities (exposed as `window.debugApi` in dev)

**Never call fetch() directly** - always use the service layer functions.

## Type System

All TypeScript types are centralized in `frontend/src/types/index.ts`:

- **User types**: `User`, `UserRole`, `RoleType`, `EmploymentType`
- **PTO types**: `PtoRequest`, `PtoBalance`, `PtoStatus`, `Holiday`, `BlackoutDate`, `SystemConfig`
- **Evaluation types**: `Evaluation`, `Rating`, `Goal`, `Competency`, `PeerReviewRequest`, `EvaluationCycle`
- **API types**: `ApiResponse<T>` - wrapper for all API responses

Backend types are maintained separately in `backend/Config.gs` as Google Apps Script constants.

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_APPS_SCRIPT_URL=<your-google-apps-script-deployment-url>
VITE_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
VITE_GEMINI_API_KEY=<your-gemini-api-key>
```

- `VITE_APPS_SCRIPT_URL`: Required - Web app URL from Apps Script deployment
- `VITE_GOOGLE_CLIENT_ID`: Optional - for production Google OAuth (demo mode works without it)
- `VITE_GEMINI_API_KEY`: Optional - for AI features in evaluations module

## Common Development Workflows

### Adding a New API Endpoint

1. **Backend** (`backend/` directory):
   - Add handler function in appropriate service file (e.g., `PtoService.gs`)
   - Add route case in `Code.gs` handleRequest() switch statement
   - Add any new constants to `Config.gs`

2. **Frontend** (`frontend/src/` directory):
   - Add TypeScript type to `types/index.ts` if needed
   - Add API function to appropriate service in `services/api/` (e.g., `ptoApi.ts`)
   - Use the API function in your component

3. **Deploy**:
   - Save changes in Apps Script editor
   - Deploy → Manage deployments → Edit → New version → Deploy

### Adding a New Module Feature (PTO Example)

1. Create component in `frontend/src/modules/pto/`
2. Add route in `frontend/src/App.tsx`
3. Update navigation in `frontend/src/components/Layout.tsx`
4. Add backend handlers if new API endpoints are needed
5. Test with demo users of different roles

### Updating Google Sheets Structure

1. Update sheet structure in Google Sheets
2. Update `backend/Config.gs` column mappings
3. Update TypeScript types in `frontend/src/types/index.ts`
4. Update any affected service functions
5. Redeploy backend

## Permission Patterns

All features check user role for access control:

```typescript
const isAdmin = currentUser?.userRole === 'ADMIN';
const isManager = currentUser?.userRole === 'MANAGER' || currentUser?.userRole === 'ADMIN';
const isStaff = currentUser?.userRole === 'STAFF';
```

Backend enforces authorization in every handler function before data access.

## Debugging

**Frontend:**
- Use browser DevTools console
- `window.debugApi` is available in dev mode (see `frontend/src/services/api/debugApi.ts`)
- Check Network tab for API calls (look for requests to Apps Script URL)

**Backend:**
- View → Logs in Apps Script editor
- View → Executions for detailed execution history
- Add `Logger.log()` statements to backend code

**Common Issues:**
- **CORS errors**: Verify `apiClient.ts` uses `Content-Type: text/plain`
- **User ID mismatches**: Check demo user data matches Users sheet, sign out/in to refresh cache
- **Stale data**: Cache-busting is already implemented in `apiClient.ts`
- **MUI Grid errors**: Using v6 API instead of v7 - use `size` prop

## Testing

**No automated tests** are currently implemented. Testing is manual:

1. Test with all demo user roles (STAFF, MANAGER, ADMIN)
2. Test PTO request lifecycle: create draft → submit → approve/deny → cancel
3. Test permission boundaries (staff can't approve, etc.)
4. Test edge cases (half days, blackout dates, insufficient balance)
5. Test theme switching and responsive layout

## Deployment

**Frontend:**
- Build: `npm run build` (outputs to `frontend/dist/`)
- Deploy to: Netlify, Vercel, or any static hosting
- Set environment variables in hosting platform

**Backend:**
- Already deployed via Google Apps Script Web App
- Updates require new deployment version (see backend/README.md)

**Database:**
- Google Sheets - no deployment needed
- Share sheet with appropriate Google Workspace users
- Set permissions: backend service account needs edit access

## Documentation

See `/docs` directory for detailed documentation:
- `SETUP.md`: Complete setup instructions
- `GOOGLE_SHEETS_STRUCTURE.md`: Database schema
- `NEXT_STEPS.md`: Future enhancements and roadmap
- `CONFIGURATION.md`: System configuration options
