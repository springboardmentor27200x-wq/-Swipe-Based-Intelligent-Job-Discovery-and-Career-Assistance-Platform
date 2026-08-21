# Testing Guide: Startup vs MNC Company Type Feature

## Quick Test Checklist

### Backend Testing

#### 1. Auto-Detection Function
```python
# Test in Python REPL or test file
from app.dependencies import detect_company_type

# Test MNC detection
assert detect_company_type("Google") == "MNC"
assert detect_company_type("Microsoft Solutions") == "MNC"
assert detect_company_type("JPMorgan Chase") == "MNC"
assert detect_company_type("Accenture Consulting") == "MNC"

# Test Startup detection (no known keywords)
assert detect_company_type("XYZ Labs") == "Startup"
assert detect_company_type("My Tech Startup") == "Startup"
assert detect_company_type("") == "Startup"
assert detect_company_type(None) == "Startup"

print("✅ All auto-detection tests passed!")
```

#### 2. Job Creation with Auto-Detection
**API Call**: `POST /api/jobs`

**Test Case 1**: With auto-detection (company_type = "")
```json
{
  "title": "Backend Engineer",
  "company_name": "Google",
  "company_type": "",
  "location": "Remote",
  "salary_min": 150000,
  "salary_max": 200000,
  "skills_required": "Python, Go",
  "job_type": "Full Time",
  "description": "Build scalable systems",
  "education": "Bachelor's Degree"
}
```
**Expected Response**: `company_type: "MNC"` (auto-detected)

---

**Test Case 2**: With explicit Startup value
```json
{
  "title": "Full Stack Developer",
  "company_name": "My Startup Inc",
  "company_type": "Startup",
  "location": "San Francisco, CA",
  "salary_min": 100000,
  "salary_max": 150000,
  "skills_required": "Node.js, React",
  "job_type": "Full Time",
  "description": "Join our growing team",
  "education": "Bachelor's Degree"
}
```
**Expected Response**: `company_type: "Startup"` (as specified)

---

**Test Case 3**: With explicit MNC value
```json
{
  "title": "Data Scientist",
  "company_name": "Infosys",
  "company_type": "MNC",
  "location": "Bangalore",
  "salary_min": 80000,
  "salary_max": 120000,
  "skills_required": "Python, SQL, ML",
  "job_type": "Full Time",
  "description": "Work on enterprise projects",
  "education": "Bachelor's Degree"
}
```
**Expected Response**: `company_type: "MNC"` (as specified)

---

### Frontend Testing

#### Test Job Creation Form

1. **Open** `/recruiter/add-job` page
2. **Fill in form fields**:
   - Job Title: "Senior Developer"
   - Company Name: "Google"
   - Company Type: Leave blank (Auto-detect)
   - Location: "Mountain View"
   - Job Type: "Full Time"
   - Salary: "$150,000 - $200,000"
   - Skills: "Python, JavaScript"
   - Description: "Build great products"

3. **Click** "Save & Publish Job"
4. **Verify** job appears in My Jobs with company_type = "MNC"

---

#### Test Manual Selection

1. **Open** `/recruiter/add-job` page
2. **Fill in form fields**:
   - Job Title: "Junior Developer"
   - Company Name: "TechStartup XYZ"
   - Company Type: Select **"Startup"** from dropdown
   - (Fill other required fields)

3. **Click** "Save & Publish Job"
4. **Verify** job is created with company_type = "Startup"

---

### Notification Testing

#### Verify Startup Alert
1. Create a job with company_type = "Startup"
2. Navigate to Job Seeker Dashboard
3. Check Notifications
4. **Expected**: Message includes "🚀 Startup Hiring Alert"

#### Verify MNC Alert
1. Create a job with company_type = "MNC"
2. Navigate to Job Seeker Dashboard
3. Check Notifications
4. **Expected**: Message includes "🏢 MNC Hiring Alert"

---

### Database Testing

#### Verify Column Exists
```sql
-- PostgreSQL
SELECT column_name FROM information_schema.columns 
WHERE table_name='jobs' AND column_name='company_type';

-- SQLite
PRAGMA table_info(jobs);
```

#### Verify Data is Saved
```sql
SELECT id, title, company_name, company_type FROM jobs LIMIT 10;
```

#### Expected Output
```
id  | title                | company_name      | company_type
----|----------------------|-------------------|-------------
1   | Senior Developer     | Google            | MNC
2   | Junior Developer     | XYZ Startup       | Startup
3   | Backend Engineer     | Microsoft         | MNC
```

---

## Test Companies for Each Type

### MNC Test Companies (Should Auto-Detect)
- **Tech**: Google, Microsoft, Apple, Amazon, Meta, Intel, Nvidia
- **Finance**: JPMorgan, Goldman Sachs, Bank of America, Citigroup
- **Consulting**: McKinsey, Bain, Deloitte, PwC, Accenture
- **IT Services**: TCS, Infosys, Wipro, Cognizant, HCL
- **E-commerce**: Walmart, Amazon, Alibaba, eBay

### Startup Test Companies (Should Default)
- XYZ Labs
- My Startup
- TechStartup Inc
- NewVenture.ai
- Innovation Company
- (Any company not in the MNC keywords list)

---

## Regression Testing

### Existing Jobs
1. All existing jobs in database should still be queryable
2. Jobs without company_type should default to "Startup"
3. No breaking changes in job display or API responses

### API Backwards Compatibility
- Old API requests without company_type field should still work
- New field should be optional
- Existing integrations should not break

---

## Edge Cases to Test

1. **Empty Company Name**
   - Input: `company_name: ""`
   - Expected: Auto-detect returns "Startup"

2. **Case Insensitivity**
   - Input: `company_name: "GOOGLE"`
   - Expected: Auto-detect returns "MNC"

3. **Partial Matches**
   - Input: `company_name: "Google Cloud"`
   - Expected: Auto-detect returns "MNC" (contains keyword)

4. **Similar Names**
   - Input: `company_name: "MyGoogle"`
   - Expected: Auto-detect returns "MNC" (keyword match)

5. **Null Value**
   - Input: `company_type: null` in request
   - Expected: Auto-detect based on company_name

6. **Whitespace Handling**
   - Input: `company_name: "  Google  "`
   - Expected: Auto-detect returns "MNC"

---

## Performance Considerations

- Auto-detection function uses case-insensitive keyword matching
- O(n) complexity where n = number of keywords (~100)
- No database calls for detection
- Recommended to cache keywords if extending to 1000+ companies

---

## Troubleshooting

### Issue: company_type always returns "Startup"
**Solution**: Check if `detect_company_type()` is imported correctly and keywords list isn't empty

### Issue: Auto-detection not working
**Possible causes**:
1. Database hasn't been migrated yet - run `python add_company_type_column.py`
2. Function not imported in dashboard.py
3. company_type field not in schema

### Issue: Frontend dropdown shows wrong values
**Solution**: Verify form state includes `company_type: ''` and dropdown options are correct

---

## Automation Testing Template

```python
import pytest
from app.dependencies import detect_company_type
from app.database import get_db
from app import models, schemas

class TestCompanyTypeFeature:
    
    def test_auto_detect_mnc(self):
        assert detect_company_type("Google") == "MNC"
        assert detect_company_type("Microsoft") == "MNC"
    
    def test_auto_detect_startup(self):
        assert detect_company_type("XYZ Labs") == "Startup"
        assert detect_company_type("Unknown Company") == "Startup"
    
    def test_auto_detect_empty(self):
        assert detect_company_type("") == "Startup"
        assert detect_company_type(None) == "Startup"
    
    def test_create_job_with_auto_detect(self):
        # Create job with empty company_type
        # Verify it auto-detects based on company_name
        pass
    
    def test_create_job_with_explicit_type(self):
        # Create job with explicit company_type
        # Verify it uses provided value
        pass
```

---

**Last Updated**: August 15, 2026
