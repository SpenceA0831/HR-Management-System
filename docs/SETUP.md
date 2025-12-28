# HR Management System - Setup Guide

## Overview

This is a unified platform combining PTO Tracking and Staff Evaluations with:
- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Auth**: Google Workspace

---

## Project Structure

```
HR-Management-System/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── modules/      # Feature modules
│   │   │   ├── pto/     # PTO Tracker module
│   │   │   └── evaluations/  # Staff Evaluations module
│   │   ├── pages/        # Top-level pages (SignIn, ModuleSelector)
│   │   ├── services/     # API clients
│   │   ├── store/        # Zustand state management
│   │   ├── theme/        # MUI theme configuration
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   ├── .env.example      # Environment variables template
│   └── package.json
├── backend/              # Google Apps Script code (to be created)
├── docs/                 # Documentation
└── README.md
```

---

## Current Status

### ✅ Completed
- [x] Project structure created
- [x] Frontend React project initialized with all dependencies
- [x] Unified type definitions for both modules
- [x] Zustand store for state management
- [x] Theme configuration (MUI with light/dark mode)
- [x] Layout component with module selector
- [x] SignIn page (demo mode, Google OAuth ready)
- [x] Module selector page
- [x] Placeholder dashboards for both modules
- [x] API client structure

### 🚧 In Progress / TODO
- [ ] Create Google Sheet with unified data model
- [ ] Build Google Apps Script backend
- [ ] Implement real Google OAuth authentication
- [ ] Migrate PTO module components from PTO-Tracker-main
- [ ] Migrate Staff Evaluations components from Staff-Evaluation-System
- [ ] Connect frontend to backend
- [ ] Testing
- [ ] Deployment

---

## Quick Start

### Frontend Development

1. **Navigate to frontend directory:**
   ```bash
   cd "/Users/aaronspence/Desktop/Coding Projects/HR-Management-System/frontend"
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to http://localhost:5174 (or whatever port Vite assigns)

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## Next Steps

### Phase 1: Google Sheets Database Setup

1. **Create a new Google Sheet** named "HR Management System Database"

2. **Create the following sheets (tabs):**
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

3. **Set up column headers** (see GOOGLE_SHEETS_STRUCTURE.md for details)

4. **Note the Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   ```

### Phase 2: Google Apps Script Backend

1. **Open Script Editor** from your Google Sheet:
   - Extensions → Apps Script

2. **Create backend files:**
   - Code.gs (main router)
   - Config.gs (configuration and mappings)
   - Auth.gs (authentication and authorization)
   - Utils.gs (helper functions)
   - UserService.gs
   - PtoService.gs
   - EvaluationService.gs
   - ... (other service files)

3. **Deploy as Web App:**
   - Click "Deploy" → "New deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone within [your organization]
   - Deploy and copy the Web App URL

### Phase 3: Configure Frontend

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update .env with your values:**
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Restart dev server** to pick up environment changes

### Phase 4: Migrate Module Components

#### PTO Module Migration
Copy and adapt components from `/PTO-Tracker-main/src/`:
- pages/ → modules/pto/
- Update imports to use unified types
- Update API calls to use new apiClient

#### Evaluation Module Migration
Copy and adapt components from `/Staff-Evaluation-System/src/`:
- App.tsx components → modules/evaluations/
- Rebuild with MUI components
- Update API calls to use new apiClient

### Phase 5: Testing

1. **Test authentication flow**
2. **Test PTO module features**
3. **Test Evaluation module features**
4. **Test cross-module navigation**
5. **Test permissions and authorization**

### Phase 6: Deployment

**Frontend Options:**
- Netlify (recommended, free tier)
- Vercel (free tier)
- Google Cloud Storage + Cloud Run

**Backend:**
- Already deployed via Apps Script Web App

---

## Development Guidelines

### Adding New Features

1. **Types first**: Add types to `src/types/index.ts`
2. **API layer**: Add endpoints to `src/services/api/`
3. **Components**: Build in appropriate module folder
4. **Routing**: Add routes to `src/App.tsx`

### State Management

Use Zustand store for:
- User authentication state
- Current user info
- Active module
- Theme mode
- Global loading states

Use local state (useState) for:
- Component-specific UI state
- Form data
- Temporary values

### Styling

- Use MUI's `sx` prop for styling
- Leverage theme values (colors, spacing, etc.)
- Keep responsive design in mind (use breakpoints)

---

## Troubleshooting

### Build Errors

**Issue**: TypeScript errors
**Solution**: Run `npm run build` to see all errors, fix one by one

**Issue**: Module not found
**Solution**: Check import paths, ensure file exists

### Runtime Errors

**Issue**: API calls failing
**Solution**:
1. Check VITE_APPS_SCRIPT_URL is set correctly
2. Verify Apps Script is deployed and accessible
3. Check browser console for CORS errors

**Issue**: Authentication not working
**Solution**:
1. Verify Google OAuth Client ID is correct
2. Check authorized JavaScript origins in Google Cloud Console
3. Ensure Apps Script has correct permissions

---

## Resources

- [MUI Documentation](https://mui.com)
- [React Router Documentation](https://reactrouter.com)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Vite Documentation](https://vitejs.dev)

---

## Support

For issues or questions, refer to:
- Project README.md
- Source code comments
- Original project documentation in PTO-Tracker-main and Staff-Evaluation-System
