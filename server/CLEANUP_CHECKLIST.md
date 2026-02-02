# Backend Cleanup Checklist

**Purpose:** Track unused files, redundant code, and cleanup tasks before production deployment.

---

## ✅ Files to KEEP

### Core Application
- ✅ `server.js` - Main entry point
- ✅ `src/app.js` - Express app configuration
- ✅ `.env.example` - Environment template
- ✅ `.gitignore` - Git exclusions
- ✅ `package.json` - Dependencies

### Shared Infrastructure (src/shared/)
- ✅ `config/database.js` - MongoDB connection
- ✅ `config/agenda.js` - Job queue setup
- ✅ `utils/logger.js` - Winston logger
- ✅ `utils/encryption.js` - AES-256 encryption
- ✅ **`utils/envValidator.js`** - Environment validation (NEW)
- ✅ `middleware/auth.js` - JWT authentication
- ✅ `middleware/errorHandler.js` - Error handling
- ✅ `services/silkpayService.js` - SilkPay API wrapper

### Modules (All 8 Core Modules)
- ✅ `modules/auth/` - **Login, JWT, Password Reset** (5 files + reset functionality)
- ✅ `modules/merchant/` - Profile, API keys, change password (5 files + reset token fields)
- ✅ `modules/beneficiary/` - CRUD, validation (6 files)
- ✅ `modules/payout/` - Payout creation (6 files)
- ✅ `modules/transaction/` - Ledger, export (5 files)
- ✅ `modules/dashboard/` - Metrics, charts (4 files)
- ✅ `modules/balance/` - Sync, reserve/release (4 files)
- ✅ `modules/webhook/` - SilkPay callbacks (3 files)

### Workers
- ✅ `workers/payout-sync.worker.js` - Status sync (5 min)
- ✅ `workers/balance-sync.worker.js` - Balance sync (hourly)
- ✅ `workers/email.worker.js` - Email queue

### Scripts
- ✅ `server/scripts/seed.js` - Test data (dev only - DO NOT deploy to production)
- ✅ `server/scripts/reset-data.js` - Data cleanup tool (dev only)

---

## ❌ Files to REMOVE / CHECK

### Check These Items:

**1. Duplicate Dependencies in package.json**
- ❌ Check for duplicate packages
- ❌ Remove unused dev dependencies
- Status: **TO REVIEW**

**2. Old/Unused Middleware**
- ❌ Any custom middleware not being used in `app.js`?
- Status: **CLEAN** (all middleware in use)

**3. Unused Service Methods**
- ❌ Check each service for unused/dead code methods
- Status: **TO REVIEW** (need to audit)

**4. Test Files (if any)**
- ❌ Remove test files from production build
- Current: **None exist yet**

**5. Logs Directory**
- ✅ KEEP in development
- ❌ Remove `/logs/*` files before Git commit (already in .gitignore)
- Status: **CONFIGURED**

**6. node_modules**
- ❌ Already in .gitignore
- Status: **CLEAN**

**7. Commented Code**
- ❌ Review all files for commented-out code blocks
- Status: **TO REVIEW**

**8. Console.log Statements**
- ❌ Replace with logger.debug() in production code
- Status: **TO REVIEW**

**9. Unused npm Packages**
Check and remove if not used:
```bash
npm install -g depcheck
depcheck
```
- Status: **TO RUN**

---

## 🧹 Cleanup Actions Required

### Before Production:

- [ ] Run `npm prune` to remove unused dependencies
- [ ] Run `depcheck` to find unused packages
- [ ] Search for `console.log` and replace with `logger.debug()`
- [ ] Remove commented code blocks
- [ ] Delete `scripts/seed.js` or ensure it's NOT deployed
- [ ] Clean `/logs/*` files (rotate/archive)
- [ ] Run `npm audit fix` for security vulnerabilities

### Code Quality:

- [ ] Add JSDoc comments to all public methods
- [ ] Add inline comments for complex logic
- [ ] Remove unused imports
- [ ] Ensure all error messages are user-friendly
- [ ] Standardize response formats across all controllers

---

## 📋 Module-by-Module Status

| Module | Files | Comments | Unused Code | Status |
|--------|-------|----------|-------------|--------|
| **Auth** | 5 | ⏳ TO ADD | ✅ CLEAN | 🟡 **+Password Reset** |
| **Merchant** | 5 | ⏳ TO ADD | ✅ CLEAN | 🟡 **+Reset Token Fields** |
| Beneficiary | 6 | ⏳ TO ADD | ✅ CLEAN | 🟡 IN PROGRESS |
| Payout | 6 | ⏳ TO ADD | ✅ CLEAN | 🟡 IN PROGRESS |
| Transaction | 5 | ⏳ TO ADD | ✅ CLEAN | 🟡 IN PROGRESS |
| Dashboard | 4 | ⏳ TO ADD | ✅ CLEAN | 🟡 IN PROGRESS |
| Balance | 4 | ⏳ TO ADD | ✅ CLEAN | 🟡 IN PROGRESS |
| Webhook | 3 | ⏳ TO ADD | ✅ CLEAN | 🟡 IN PROGRESS |
| **Utilities** | 4 | ⏳ TO ADD | ✅ CLEAN | 🟢 **+EnvValidator** |

---

## 🔍 Files That Need Review

**None identified yet** - all current files are in active use.

---

## 📝 Notes

### Current State:
- All **46 backend files** are actively used (+ envValidator, + password reset)
- No redundant or duplicate modules found
- Clean architecture with clear separation of concerns
- **New:** Environment validation at server startup
- **New:** Complete password reset flow (forgot/reset/change)
- **Ready for:** Backend integration testing with SilkPay API

### Recommendations:
1. Focus on adding JSDoc comments
2. Run dependency audit
3. Standardize error handling messages
4. Add comprehensive logging to all critical paths
5. **Test password reset flow end-to-end**
6. **Validate all env vars before production deployment**

---

**Last Updated:** 2026-01-29  
**Next Review:** Before production deployment
