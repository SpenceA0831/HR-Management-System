# Production Deployment Guide

## Overview

This guide walks through deploying the HR Management System to your Google Workspace for your team.

## Architecture

- **Frontend**: React app hosted on Netlify/Vercel/Firebase
- **Backend**: Google Apps Script Web App
- **Database**: Google Sheets (already set up)
- **Authentication**: Google Workspace OAuth (domain-restricted)

---

## Part 1: Backend Deployment (Google Apps Script)

### Step 1: Verify Google Sheet Setup

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1xbPk8by_HBdbtDy0ox4BHpcFm76MiIl3n44B7EgSYoA
2. Verify all sheets exist:
   - Users
   - PTO_Requests
   - PTO_Balances
   - Holidays
   - Blackout_Dates
   - System_Config
   - Payroll_History
   - Reimbursements
   - Evaluations (and 5 related sheets)

### Step 2: Deploy Google Apps Script

1. **Open Apps Script Editor**:
   - In your Google Sheet: Extensions → Apps Script

2. **Verify All Backend Files**:
   - Ensure all files from `/backend/*.gs` are copied to the editor
   - Main files:
     - `Code.gs` (main router)
     - `Config.gs` (configuration)
     - `Auth.gs` (authentication)
     - `Utils.gs` (utilities)
     - All service files (UserService.gs, PtoService.gs, etc.)

3. **Set Script Properties**:
   - Click Project Settings (gear icon)
   - Scroll to "Script Properties"
   - Add property:
     - Key: `SPREADSHEET_ID`
     - Value: `1xbPk8by_HBdbtDy0ox4BHpcFm76MiIl3n44B7EgSYoA`

4. **Deploy as Web App**:
   - Click "Deploy" → "New deployment"
   - Click "Select type" → "Web app"
   - Configuration:
     - **Description**: "HR Management System v1.0"
     - **Execute as**: "Me (your-email@domain.com)"
     - **Who has access**: "Anyone with Google account" (we'll restrict in OAuth later)
   - Click "Deploy"
   - **Copy the Web App URL** (you'll need this for frontend)
   - Example: `https://script.google.com/macros/s/AKfycbx.../exec`

5. **Authorize the Script**:
   - First time deployment will ask for permissions
   - Click "Authorize access"
   - Choose your Google Workspace account
   - Review permissions (reads/writes to sheets, sends emails, etc.)
   - Click "Allow"

### Step 3: Configure Sheet Permissions

1. **Share the Google Sheet**:
   - Click "Share" button in the sheet
   - Add your coworkers by email or share with entire domain
   - Set permissions:
     - **Regular users**: "Viewer" (backend script has edit access)
     - **Admins**: "Editor" (for direct data management if needed)

2. **Service Account Access** (backend needs edit access):
   - The script runs as "you", so it inherits your permissions
   - Ensure you have Editor access to the sheet

---

## Part 2: Google OAuth Setup (Real Authentication)

Currently using demo mode. To enable real Google Workspace authentication:

### Step 1: Create OAuth Credentials

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Create New Project** (or use existing):
   - Click project dropdown → "New Project"
   - Name: "HR Management System"
   - Click "Create"

3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - Google Sheets API
     - Google Drive API (for file uploads if needed)

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "Internal" (only users in your Google Workspace)
   - Fill in:
     - App name: "HR Management System"
     - User support email: your-email@domain.com
     - Developer contact: your-email@domain.com
   - Scopes: (leave default - we'll use basic profile)
   - Click "Save and Continue"

5. **Create OAuth Client ID**:
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "HR Management Frontend"
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local dev)
     - `https://your-app-name.netlify.app` (add after frontend deployment)
   - **Authorized redirect URIs**:
     - `http://localhost:5173` (for local dev)
     - `https://your-app-name.netlify.app` (add after frontend deployment)
   - Click "Create"
   - **Copy the Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)

### Step 2: Update Frontend Environment Variables

1. **Edit `.env` file** in `/frontend`:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   VITE_GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
   VITE_GEMINI_API_KEY=your-gemini-key (optional, for evaluations AI features)
   ```

2. **Important**: Don't commit `.env` to version control (already in `.gitignore`)

---

## Part 3: Frontend Deployment

You have several hosting options. Here's the recommended approach for each:

### Option A: Netlify (Recommended - Easiest)

**Pros**: Free tier, automatic HTTPS, easy continuous deployment from Git
**Cons**: None for this use case

#### Steps:

1. **Prepare for Deployment**:
   ```bash
   cd frontend
   npm run build
   ```
   - This creates a `dist/` folder with production build

2. **Create Netlify Account**:
   - Go to https://www.netlify.com/
   - Sign up with your Google Workspace account

3. **Deploy via Git** (Recommended):

   a. **Push code to GitHub** (if not already):
      ```bash
      # From project root
      git init
      git add .
      git commit -m "Initial commit"
      git remote add origin https://github.com/YOUR_USERNAME/hr-management-system.git
      git push -u origin main
      ```

   b. **Connect to Netlify**:
      - In Netlify dashboard: "Add new site" → "Import an existing project"
      - Choose "GitHub" → Authorize → Select repository
      - Build settings:
        - **Base directory**: `frontend`
        - **Build command**: `npm run build`
        - **Publish directory**: `frontend/dist`
      - Click "Deploy site"

   c. **Configure Environment Variables**:
      - In Netlify: Site settings → Environment variables
      - Add:
        - `VITE_APPS_SCRIPT_URL`: Your Apps Script URL
        - `VITE_GOOGLE_CLIENT_ID`: Your OAuth Client ID
        - `VITE_GEMINI_API_KEY`: (optional)
      - Click "Save"
      - Trigger new deployment for env vars to take effect

4. **Configure Custom Domain** (Optional):
   - Netlify provides: `random-name-123.netlify.app`
   - To use custom domain:
     - Domain settings → Add custom domain
     - Follow DNS configuration instructions

5. **Update OAuth Credentials**:
   - Go back to Google Cloud Console → Credentials
   - Edit your OAuth Client ID
   - Add your Netlify URL to:
     - Authorized JavaScript origins: `https://your-app.netlify.app`
     - Authorized redirect URIs: `https://your-app.netlify.app`

### Option B: Vercel

Similar to Netlify, great Git integration:

1. Sign up at https://vercel.com/
2. Import Git repository
3. Build settings (same as Netlify)
4. Add environment variables
5. Update OAuth credentials with Vercel URL

### Option C: Firebase Hosting (Google Ecosystem)

Best if you're fully invested in Google Cloud:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**:
   ```bash
   cd frontend
   firebase login
   firebase init hosting
   ```
   - Choose existing project or create new
   - Public directory: `dist`
   - Single-page app: Yes
   - GitHub deploys: Optional

3. **Build and Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

4. **Configure Environment Variables**:
   - Firebase doesn't support build-time env vars directly
   - Use Firebase App Check or store in Firestore
   - Or use build-time replacement in CI/CD

---

## Part 4: Domain Restrictions & Security

### Restrict to Your Google Workspace Domain

1. **OAuth Consent Screen** (already done in Part 2):
   - Set to "Internal" limits to your Workspace domain automatically

2. **Backend Validation** (Optional - Extra Security):
   - Edit `backend/Auth.gs`:
   ```javascript
   function getCurrentUserEmail(e) {
     // Demo mode check
     const demoEmail = e.parameter.demoEmail ||
                      (e.postData && JSON.parse(e.postData.contents).demoEmail);

     if (demoEmail) {
       // Remove this block in production to disable demo mode
       return demoEmail;
     }

     // Production: Get authenticated user
     const email = Session.getActiveUser().getEmail();

     // OPTIONAL: Restrict to your domain
     if (!email.endsWith('@yourdomain.com')) {
       throw new Error('Access restricted to @yourdomain.com users');
     }

     return email;
   }
   ```

3. **Frontend Domain Check** (Optional):
   - Edit `frontend/src/pages/SignIn.tsx`
   - Add domain validation after OAuth login

### Remove Demo Mode (Production)

1. **Backend** - Edit `backend/Code.gs`:
   ```javascript
   // REMOVE or comment out this block:
   if (action === 'getDemoUsers') {
     return output.setContent(JSON.stringify(handleGetDemoUsers()));
   }
   ```

2. **Backend** - Edit `backend/Auth.gs`:
   ```javascript
   function getCurrentUserEmail(e) {
     // REMOVE demo mode block
     const email = Session.getActiveUser().getEmail();

     if (!email) {
       throw new Error('Authentication required');
     }

     return email;
   }
   ```

3. **Frontend** - Edit `frontend/src/pages/SignIn.tsx`:
   - Remove the "Demo Mode" button
   - Show only the Google OAuth login button

4. **Redeploy**:
   - Apps Script: Deploy → Manage deployments → Edit → New version
   - Frontend: Push to Git (auto-deploys on Netlify/Vercel)

---

## Part 5: User Onboarding

### Add Coworkers to the System

1. **Add to Users Sheet**:
   - Open Google Sheet → "Users" tab
   - Add row for each employee:
     ```
     ID          | Name       | Email                  | Role    | Team ID | Manager ID | Employment | Hire Date  | Role Type
     user_004    | Jane Smith | jane@yourdomain.com   | STAFF   | team_001| user_002   | Full Time  | 2024-01-15 | MEMBER
     ```

2. **User Roles**:
   - `STAFF`: Regular employees (can submit PTO/reimbursements, view own data)
   - `MANAGER`: Team managers (can approve requests for direct reports)
   - `ADMIN`: HR/admins (full access to all modules, settings)

3. **Send Invitations**:
   - Share the app URL: `https://your-app.netlify.app`
   - Users click "Sign in with Google"
   - System automatically matches their email to Users sheet
   - If email not found → "User not found" error (add to sheet first)

### Initial PTO Balances

1. **Open Google Sheet** → "PTO_Balances" tab
2. **Add balance for each user**:
   ```
   User ID  | Year | Total Hours | Created At           | Updated At
   user_004 | 2026 | 120         | 2026-01-04T10:00:00Z | 2026-01-04T10:00:00Z
   ```

3. **PTO Accrual Rules** (from System_Config):
   - Full Time: 120 hours/year (15 days)
   - Part Time: 80 hours/year (10 days)
   - Prorated for mid-year hires

---

## Part 6: Testing & Validation

### Pre-Launch Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed with HTTPS
- [ ] OAuth configured for internal users only
- [ ] All coworkers added to Users sheet
- [ ] Initial PTO balances created
- [ ] Demo mode disabled
- [ ] Test login with multiple users
- [ ] Test PTO request workflow (create, submit, approve)
- [ ] Test manager approval flow
- [ ] Test admin settings access
- [ ] Verify email domain restrictions work

### Test Scenarios

1. **Regular Employee (STAFF)**:
   - Log in with Google
   - Navigate to PTO module
   - Create and submit PTO request
   - Check balance updates
   - View request status

2. **Manager**:
   - Log in
   - View team's PTO requests
   - Approve/deny requests
   - Verify notifications (if configured)

3. **Admin**:
   - Access all modules
   - Configure holidays/blackout dates
   - View system-wide reports
   - Manage payroll runs

---

## Part 7: Ongoing Maintenance

### Updates and Deployments

**Backend Updates**:
1. Edit files in Google Apps Script editor
2. Save changes
3. Deploy → Manage deployments → Edit → New version
4. Note: No downtime, instant updates

**Frontend Updates**:
1. Make changes locally
2. Test: `npm run dev`
3. Commit and push to Git
4. Netlify/Vercel auto-deploys (or manual: `npm run build`)

### Monitoring

- **Backend Logs**: Apps Script → Executions (see all API calls, errors)
- **Frontend Errors**: Browser console or error tracking (Sentry, LogRocket)
- **Usage**: Google Sheet activity log

### Backups

**Automated** (Google Sheets):
- Google Sheets has version history (File → Version history)
- Can restore any previous version

**Manual** (Recommended):
- Weekly: File → Download → Excel (.xlsx)
- Store in Google Drive folder

---

## Troubleshooting

### Common Issues

**"User not found in system"**:
- User's email not in Users sheet
- Solution: Add user to Users sheet, have them log out and back in

**CORS errors**:
- OAuth redirect URI not configured
- Solution: Add your domain to Google Cloud Console → Credentials

**"Authentication required"**:
- Session expired or OAuth not configured
- Solution: Log out and back in

**Balance not updating**:
- PTO_Balances sheet missing user's year row
- Solution: Add balance row for current year

---

## Security Best Practices

1. **Never commit `.env` files** (already in .gitignore)
2. **Use "Internal" OAuth** (domain-restricted)
3. **Disable demo mode** in production
4. **Regular audits** of Users sheet (remove ex-employees)
5. **Sheet permissions**: Most users as "Viewer"
6. **HTTPS only** (Netlify/Vercel provide this automatically)
7. **API rate limiting**: Apps Script has built-in limits

---

## Cost Estimate

- **Google Apps Script**: Free (up to 20,000 executions/day)
- **Google Sheets**: Free (Google Workspace subscription)
- **Frontend Hosting**:
  - Netlify: Free tier (100GB bandwidth/month)
  - Vercel: Free tier (100GB bandwidth/month)
  - Firebase: Free tier (10GB storage, 360MB/day transfer)
- **OAuth**: Free

**Total**: $0/month for small teams (under 100 users)

---

## Next Steps

1. ✅ Deploy backend (Part 1)
2. ✅ Set up OAuth (Part 2)
3. ✅ Deploy frontend (Part 3)
4. ✅ Restrict to domain (Part 4)
5. ✅ Add users (Part 5)
6. ✅ Test with team (Part 6)
7. ✅ Launch! 🚀

---

## Support

For issues or questions:
- Check Google Apps Script execution logs
- Review browser console for frontend errors
- Check this repository's Issues page
