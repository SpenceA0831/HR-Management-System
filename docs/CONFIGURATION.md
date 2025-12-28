# Configuration Reference

This document tracks all the IDs, URLs, and configuration values for the HR Management System.

## Google Sheets Database

**Sheet Name**: HR Management System Database

**Sheet ID**: `1wlKItUe5wK9PfLwQrLlOY64A_Df9ZcJ_Gl0d8q5fitQ`

**Direct Link**: https://docs.google.com/spreadsheets/d/1wlKItUe5wK9PfLwQrLlOY64A_Df9ZcJ_Gl0d8q5fitQ/edit

**Status**: ✅ Configured (Phase 1 complete)

---

## Google Apps Script Backend

**Deployment URL**: _Not yet deployed_

**Script Project**: _Not yet created_

**Status**: ⏳ Pending (Phase 2)

**Next Steps**:
1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. Create backend files (Code.gs, Config.gs, etc.)
4. Deploy as Web App
5. Copy deployment URL to frontend/.env

---

## Google OAuth (Authentication)

**Client ID**: _Not yet configured_

**Status**: ⏳ Pending

**Next Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Workspace APIs
4. Create OAuth 2.0 Client ID
5. Add authorized JavaScript origins
6. Copy Client ID to frontend/.env

---

## Google Gemini API (Optional)

**API Key**: _Not yet configured_

**Status**: ⏳ Optional

**Purpose**: Powers AI-generated feedback suggestions in staff evaluations

**Next Steps**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy to frontend/.env

---

## Environment Variables

Current configuration in `frontend/.env`:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SHEET_ID=1wlKItUe5wK9PfLwQrLlOY64A_Df9ZcJ_Gl0d8q5fitQ
```

---

## Phase Checklist

- [x] **Phase 1: Google Sheets Database**
  - [x] Create Google Sheet
  - [x] Set up all sheets and columns
  - [x] Document Sheet ID
  - [x] Add to .env file

- [ ] **Phase 2: Google Apps Script Backend**
  - [ ] Create Apps Script project
  - [ ] Build API endpoints
  - [ ] Deploy as Web App
  - [ ] Add deployment URL to .env

- [ ] **Phase 3: Authentication Setup**
  - [ ] Create OAuth Client ID
  - [ ] Configure authorized origins
  - [ ] Add Client ID to .env

- [ ] **Phase 4: Frontend Integration**
  - [ ] Update API client with real endpoints
  - [ ] Test authentication flow
  - [ ] Test data operations

- [ ] **Phase 5: Module Migration**
  - [ ] Migrate PTO module components
  - [ ] Migrate Evaluations module components
  - [ ] Test all features

- [ ] **Phase 6: Deployment**
  - [ ] Deploy frontend to hosting
  - [ ] Final testing
  - [ ] Go live

---

Last updated: 2025-12-28
