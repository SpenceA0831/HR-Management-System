# Clasp Integration - Quick Reference

This document provides a quick reference for using Clasp (Command Line Apps Script Projects) with Claude Code for automated Google Apps Script deployment.

## What is Clasp?

Clasp enables command-line management of Google Apps Script projects. This project uses Clasp to allow Claude Code to edit backend files locally and deploy them automatically to Google Apps Script without manual copy/paste.

## Project Configuration

**Script ID:** `1DC7gl386BsUuT_kBlfMlNc5mIDqIMyacc3ZzU2RALCLvfQkj-FJroDZi`
**Script URL:** https://script.google.com/d/1DC7gl386BsUuT_kBlfMlNc5mIDqIMyacc3ZzU2RALCLvfQkj-FJroDZi/edit
**Authenticated as:** `aaron@lifteveryvoicephilly.org`

### Configuration Files

- `.clasp.json` - Script ID and file extension mappings
- `.claspignore` - Excludes frontend, docs, test files
- `appsscript.json` - OAuth scopes and Apps Script settings

## File Organization

### Local Files (Source of Truth)
```
backend/
├── Auth.js
├── Code.js (main router)
├── Config.js (constants, enums)
├── Utils.js
├── PtoService.js
├── PayrollService.js
├── ReimbursementService.js
├── EvaluationService.js
└── (20+ more service files)

scripts/
├── SetupGoogleSheets.js
├── DebugPtoBalance.js
└── (10+ utility scripts)
```

### Deployed Files (Google Apps Script)
- Same files appear as `.gs` in Apps Script editor
- Automatically converted during `clasp push`
- Identical content, different extension only

## Claude Code Workflow

### When Making Backend Changes

Claude Code automatically follows this pattern:

1. **Edit** `.js` files in `backend/` or `scripts/`
2. **Deploy** with `clasp push`
3. **Confirm** deployment success ("Pushed 34 files")

### Example Session

```
User: "Add a new endpoint to export PTO data as CSV"

Claude Code:
✅ Edits backend/PtoService.js → adds exportPtoDataCsv() function
✅ Edits backend/Code.js → adds route case 'exportPtoDataCsv'
✅ Runs: clasp push
✅ Output: "Pushed 34 files" - Success!
```

## Essential Clasp Commands

### Deploy Changes
```bash
clasp push
```
Uploads local `.js` files to Google Apps Script (converts to `.gs`)

### Check Status
```bash
clasp status
```
Lists tracked and untracked files

### Pull Remote Changes
```bash
clasp pull
```
Downloads changes from Apps Script to local (rarely needed)

### Re-authenticate
```bash
clasp login
```
Required if authentication expires

## Common Scenarios

### ✅ Normal Workflow
1. Claude edits `backend/PtoService.js`
2. Claude runs `clasp push`
3. Changes appear in Apps Script instantly
4. Frontend can use new endpoint immediately

### 🔄 Someone Edited in Browser
1. Run `clasp pull` to sync remote changes locally
2. Review changes with `git diff`
3. Commit or discard as needed
4. Continue normal workflow

### ❌ Authentication Expired
```
Error: invalid_grant
Solution: Run clasp login and re-authenticate
```

### ⚠️ Files Not Deploying
1. Check `.claspignore` - file might be excluded
2. Verify file is in `backend/` or `scripts/` directory
3. Run `clasp status` to see tracked files

## Important Rules

### ✅ DO
- Edit `.js` files in `backend/` or `scripts/` directories
- Always run `clasp push` after backend changes
- Keep local files as source of truth
- Commit changes to git after deployment
- Use `clasp status` to verify tracked files

### ❌ DON'T
- Never manually copy/paste code into Apps Script editor
- Don't edit `.gs` files directly in Apps Script (use local `.js` files)
- Don't skip `clasp push` after making changes
- Don't edit files outside `backend/` or `scripts/` and expect them to deploy

## Benefits

✅ **Automated Deployment** - One command deploys all changes
✅ **Version Control** - All changes tracked in git
✅ **IDE Support** - Full JavaScript/TypeScript tooling
✅ **No Manual Work** - Claude handles everything automatically
✅ **Instant Updates** - Changes live in seconds
✅ **Error Prevention** - No copy/paste mistakes

## Troubleshooting

### "Script is already up to date"
**Meaning:** No changes detected, files are synced
**Action:** None needed - this is normal

### "Pushed 34 files"
**Meaning:** Successful deployment
**Action:** None needed - verify in Apps Script editor if desired

### "invalid_grant" or "reauth related error"
**Meaning:** Authentication token expired
**Action:** Run `clasp login` to re-authenticate

### Changes don't appear in Apps Script
**Cause:** File excluded by `.claspignore`
**Action:** Check `.claspignore`, remove exclusion if needed

## For Future Claude Sessions

When starting a new Claude Code session, simply remind Claude:

> "This project uses Clasp for Google Apps Script deployment. Edit backend files and run `clasp push` to deploy."

Claude will automatically follow the established workflow based on this documentation.

## Quick Start Template

Copy this instruction for new Claude sessions:

```
This HR Management System uses Clasp integration for backend deployment.

Key Points:
- Backend files: backend/*.js (deployed as .gs)
- Deploy command: clasp push
- Script ID: 1DC7gl386BsUuT_kBlfMlNc5mIDqIMyacc3ZzU2RALCLvfQkj-FJroDZi
- Always run clasp push after editing backend files

See CLAUDE.md and docs/CLASP_QUICK_REFERENCE.md for full details.
```

---

**Last Updated:** 2026-01-08
**Clasp Version:** Compatible with @google/clasp (latest)
**Authentication:** aaron@lifteveryvoicephilly.org
