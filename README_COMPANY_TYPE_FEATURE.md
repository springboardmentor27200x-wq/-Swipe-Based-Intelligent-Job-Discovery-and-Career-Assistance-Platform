# 🚀 Startup vs MNC Feature - Complete Guide

## 📌 Quick Overview

Recruiters can now specify whether their company is a **Startup** or **MNC** when posting jobs. If not specified, the system automatically detects based on the company name.

### What You Get
- 🎯 **Auto-Detection**: 100+ known companies recognized automatically
- 💡 **Manual Override**: Option to manually specify company type
- 📢 **Smart Notifications**: 
  - 🚀 "Startup Hiring Alert" for startups
  - 🏢 "MNC Hiring Alert" for MNCs
- 📊 **Better Filtering**: Data for future analytics and filtering

---

## 🚀 Quick Start

### For Recruiters
1. Go to **Recruiter Dashboard** → **Add New Job**
2. Fill in job details as usual
3. **Company Type** field: Leave blank for auto-detect OR select Startup/MNC
4. Click **"Save & Publish Job"**
5. Done! ✅

### For Developers
1. Run migration: `python backend/add_company_type_column.py`
2. Restart backend server
3. Frontend automatically updated
4. Test with `/recruiter/add-job` endpoint

---

## 📚 Documentation Map

| Document | Purpose | For Whom |
|----------|---------|----------|
| **IMPLEMENTATION_SUMMARY.md** | High-level overview of what was built | Everyone |
| **COMPANY_TYPE_FEATURE.md** | Detailed technical documentation | Developers |
| **TESTING_COMPANY_TYPE.md** | How to test the feature | QA/Testers |
| **DEPLOYMENT_CHECKLIST.md** | Deployment procedures | DevOps/Release |
| **This file** | Quick reference guide | Everyone |

---

## 🔍 MNC vs Startup Detection

### Auto-Detected as MNC (100+ companies including):
- **Big Tech**: Google, Microsoft, Apple, Amazon, Meta, Nvidia, Intel, Cisco, Oracle, IBM
- **Finance**: JPMorgan, Goldman Sachs, Bank of America, Citigroup, Vanguard
- **Consulting**: McKinsey, Bain, Deloitte, PwC, Accenture
- **IT Services**: TCS, Infosys, Wipro, Cognizant, HCL
- **And many more** across all major sectors...

### Defaults to Startup:
- Any company name not in the recognition list
- Empty/null values
- Unknown/niche companies

---

## 💻 API Examples

### Create Job with Auto-Detection
```bash
POST /api/jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Senior Developer",
  "company_name": "Google",
  "company_type": "",
  "location": "Remote",
  "salary_min": 150000,
  "salary_max": 200000,
  "skills_required": "Python",
  "job_type": "Full Time",
  "description": "..."
}

# Response includes:
# "company_type": "MNC"  ← Auto-detected!
```

### Create Job with Manual Specification
```bash
POST /api/jobs
{
  "title": "Junior Developer",
  "company_name": "My Cool Startup",
  "company_type": "Startup",  # ← Manual override
  # ... rest of fields ...
}

# Response includes:
# "company_type": "Startup"  ← As specified!
```

---

## 📝 Key Files Modified

| File | Change | Impact |
|------|--------|--------|
| `backend/app/models.py` | Added `company_type` column | Database schema |
| `backend/app/schemas.py` | Added `company_type` field | API contracts |
| `backend/app/dependencies.py` | Added `detect_company_type()` | Auto-detection logic |
| `backend/app/routers/dashboard.py` | Updated `create_job()` | Job creation flow |
| `frontend/src/pages/RecruiterAddJob.jsx` | Added dropdown selector | UI/UX |
| `backend/add_company_type_column.py` | Migration script | Database setup |

---

## 🔧 Installation & Deployment

### Step 1: Database Migration
```bash
cd backend
python add_company_type_column.py
```

### Step 2: Restart Services
```bash
# Backend
uvicorn app.main:app --reload

# Frontend (if needed)
npm start
```

### Step 3: Verify
- Navigate to `/recruiter/add-job`
- Look for "Company Type" dropdown
- Should see: Auto-detect, Startup, MNC options

---

## 🧪 Testing Checklist

- [ ] Create job with auto-detect (company_name: "Google") → Should get "MNC"
- [ ] Create job with auto-detect (company_name: "XYZ") → Should get "Startup"
- [ ] Create job with manual Startup selection → Should save "Startup"
- [ ] Create job with manual MNC selection → Should save "MNC"
- [ ] Check notifications for correct alert type
- [ ] Verify database column exists and is populated
- [ ] Test with known MNC companies (Microsoft, Amazon, etc.)
- [ ] Test with unknown company names

---

## ⚡ Features

✅ **Smart Auto-Detection**
- Recognizes 100+ companies globally
- Case-insensitive matching
- Handles company name variations

✅ **Flexible Manual Override**
- Recruiters can override auto-detection
- Optional field (doesn't break if not filled)
- Easy dropdown selection

✅ **Enhanced Notifications**
- Different alert types for Startups vs MNCs
- More relevant job alerts for candidates
- Emotional icons (🚀 vs 🏢)

✅ **Future-Ready**
- Easy to extend with more companies
- Foundation for more company metadata
- Can be used for filtering/analytics

✅ **Production Ready**
- Backwards compatible
- Minimal performance impact
- Comprehensive documentation
- Migration script included

---

## 🐛 Troubleshooting

### Issue: "Company Type" field doesn't show up
**Solution**: Clear browser cache and refresh page (Ctrl+Shift+R)

### Issue: Auto-detection not working (always "Startup")
**Solution**: Check if migration was run: `python add_company_type_column.py`

### Issue: Jobs not saving
**Solution**: 
- Check if migration completed successfully
- Verify database column exists
- Check backend logs for errors

### Issue: Wrong auto-detection result
**Solution**: Check `backend/app/dependencies.py` for company keyword list

---

## 📊 Database Schema

### New Column in `jobs` Table
```sql
company_type VARCHAR(50) DEFAULT 'Startup'
```

### Sample Data
```
id | company_name  | company_type | title
---|---------------|--------------|----------------------------
1  | Google        | MNC          | Senior Developer
2  | My Startup    | Startup      | Junior Developer
3  | Microsoft     | MNC          | DevOps Engineer
4  | Unknown Biz   | Startup      | Product Manager
```

---

## 🎯 Future Enhancements

Potential improvements:
- [ ] Company size (employees) detection
- [ ] Industry classification
- [ ] Funding stage for startups
- [ ] Company type filters in job search
- [ ] Analytics dashboard for hiring trends
- [ ] User preferences for company type alerts
- [ ] API endpoint to get all known MNC companies
- [ ] Ability for users to submit new company keywords

---

## 📞 Questions?

1. **Technical Details** → See `COMPANY_TYPE_FEATURE.md`
2. **How to Test** → See `TESTING_COMPANY_TYPE.md`
3. **Deployment Steps** → See `DEPLOYMENT_CHECKLIST.md`
4. **Quick Summary** → See `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Status

| Item | Status |
|------|--------|
| Backend Implementation | ✅ Complete |
| Frontend Implementation | ✅ Complete |
| Database Migration | ✅ Complete |
| Documentation | ✅ Complete |
| Testing Guide | ✅ Complete |
| Deployment Ready | ✅ Yes |

---

## 📅 Timeline

- **Designed**: August 15, 2026
- **Implemented**: August 15, 2026
- **Documented**: August 15, 2026
- **Ready for Deployment**: August 15, 2026

---

**Version**: 1.0  
**Status**: Production Ready ✅  
**Support**: See documentation files  

---

*This feature was designed to improve job relevance and candidate experience by providing smarter notifications based on company type (Startup vs MNC).*
