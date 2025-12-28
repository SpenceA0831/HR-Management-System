# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an HR Management System frontend built with React 19, TypeScript, and Material-UI v7. The application is a multi-module system currently supporting:
- **PTO (Paid Time Off) tracking** - Fully implemented with request management, approval workflows, and balance tracking
- **Staff Evaluations** - Foundation in place, not yet fully implemented

The backend is a Google Apps Script Web App that stores data in Google Sheets.

## Development Commands

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

## Architecture

### Backend Integration

**Critical**: This app uses Google Apps Script as its backend, NOT a traditional REST API.

- Backend URL is configured in `.env` as `VITE_APPS_SCRIPT_URL`
- All API calls go through `src/services/api/apiClient.ts`
- The `ApiClient` uses `Content-Type: text/plain` to bypass CORS preflight (OPTIONS) requests
- **Demo mode**: All requests include `demoEmail` parameter for local development without Google OAuth
  - Demo email is added to both URL query params AND POST body
  - Backend checks for `demoEmail` parameter and uses it when no Google session exists

### State Management

Uses **Zustand** with persistence (`src/store/useStore.ts`):
- `currentUser`: The authenticated user object
- `isAuthenticated`: Auth status (controls routing between SignIn and authenticated app)
- `activeModule`: Currently selected module ('pto' | 'evaluations')
- `mode`: Theme mode ('light' | 'dark')
- State is persisted to localStorage as 'hr-management-storage'

### Type System

All types are defined in `src/types/index.ts`:
- **User types**: `User`, `UserRole`, `RoleType`, `EmploymentType`
- **PTO types**: `PtoRequest`, `PtoBalance`, `PtoStatus`, `Holiday`, `BlackoutDate`, `SystemConfig`
- **Evaluation types**: `Evaluation`, `Rating`, `Goal`, `Competency`, `PeerReviewRequest`
- **API types**: `ApiResponse<T>` - all API functions return this wrapper

### Routing Structure

```
/ (unauthenticated) → SignIn page
/ (authenticated)   → ModuleSelector (choose PTO or Evaluations)
/pto                → PTO Dashboard
/pto/requests       → PTO Requests List
/pto/requests/new   → Create New PTO Request
/pto/requests/:id   → View/Edit PTO Request Details
/evaluations        → Evaluations Dashboard (placeholder)
```

All authenticated routes use the `Layout` component wrapper which provides navigation and theme toggle.

### Module Structure

Each module lives in `src/modules/{moduleName}/`:
- **Dashboard.tsx**: Main landing page for the module
- **RequestsList.tsx** (PTO): DataGrid view of all requests with filtering
- **NewRequest.tsx** (PTO): Form to create new requests
- **RequestDetail.tsx** (PTO): View/edit individual requests with approval actions

### API Service Layer

All API calls are organized in `src/services/api/`:
- `apiClient.ts`: Core HTTP client with demo mode support
- `ptoApi.ts`: PTO-specific endpoints (getPtoRequests, createPtoRequest, etc.)
- `debugApi.ts`: Debugging utilities exposed as `window.debugApi` in dev mode

### Form Handling

- **React Hook Form** + **Zod** for validation
- DatePicker from `@mui/x-date-pickers` with `date-fns` adapter
- All PTO forms share the same schema in respective files (NewRequest.tsx, RequestDetail.tsx)

### Material-UI v7 Breaking Changes

**Important**: This project uses MUI v7 which has breaking changes from v6:
- ✅ Use `<Grid size={{ xs: 12, md: 6 }}>`
- ❌ Don't use `<Grid item xs={12} md={6}>`
- The `item` prop and direct `xs`/`md` props were removed
- Grid now uses a `size` prop with an object containing responsive breakpoints

### Demo Mode Users

Four demo users are available in `src/pages/SignIn.tsx`:
1. **Demo User** (`demo@example.com`) - STAFF role
2. **Aaron Spence** (`aaronhspence@gmail.com`) - MANAGER role
3. **Test Employee** (`test@example.com`) - STAFF role
4. **Jane CEO** (`ceo@example.com`) - ADMIN role

User data must match the Users sheet in the Google Apps Script backend.

## Key Implementation Patterns

### Permission-Based UI

Components check `currentUser.userRole` to show/hide features:
```typescript
const isManager = currentUser?.userRole === 'MANAGER' || currentUser?.userRole === 'ADMIN';
const canApprove = isManager && request.status === 'Pending';
```

### PTO Hour Calculation

Use `utils/ptoUtils.ts` functions:
- `calculatePtoHours(startDate, endDate, isHalfDayStart, isHalfDayEnd)`: Returns total hours
- `isShortNotice(startDate)`: Checks if request is within 14-day threshold
- `formatPtoDates(startDate, endDate)`: Formats date range for display

### Status and Type Chips

Reusable components in `src/components/`:
- `<StatusChip status={request.status} />`: Color-coded status badges
- `<TypeChip type={request.type} />`: PTO type badges (Vacation, Sick, Other)

### Dashboard Auto-Refresh

PTO Dashboard uses `location.key` to re-fetch data when navigating back:
```typescript
const location = useLocation();
useEffect(() => {
  fetchData();
}, [user, location.key]); // Refetch when route changes
```

### Form Submit Actions

PTO forms support both "Save as Draft" and "Submit" actions:
```typescript
const [submitAction, setSubmitAction] = useState<'draft' | 'submit' | null>(null);

const onSubmit = async (data: FormData, submit: boolean = false) => {
  setSubmitAction(submit ? 'submit' : 'draft');
  await ptoApi.createPtoRequest({
    ...data,
    status: submit ? 'Submitted' : 'Draft',
  });
};

// In JSX:
<Button onClick={handleSubmit(data => onSubmit(data, false))}>Save Draft</Button>
<Button type="submit">Submit Request</Button>
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `VITE_APPS_SCRIPT_URL`: Your Google Apps Script deployment URL
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID (optional for demo mode)
- `VITE_GEMINI_API_KEY`: Google Gemini API key for evaluation features

## Common Issues

### CORS Errors
If you see CORS preflight errors, verify that `apiClient.ts` is using `Content-Type: text/plain`. Do NOT use `application/json` as it triggers preflight OPTIONS requests that fail with Apps Script.

### User ID Mismatches
If requests appear in the wrong section (team activity instead of "My Requests"), check that:
1. The demo user ID in `SignIn.tsx` matches the backend Users sheet
2. User signs out and back in after changing user data (state is cached in localStorage)

### MUI Grid Errors
If you see TypeScript errors about Grid props, you're likely using the old v6 API. Use the v7 `size` prop instead of `item`/`xs`/`md` props.

### Dashboard Not Refreshing
If the dashboard doesn't update after creating/editing requests, ensure `location.key` is in the useEffect dependency array.
