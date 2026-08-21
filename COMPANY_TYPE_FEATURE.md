# SwipeX Company Type (Startup/MNC) Feature Implementation

## Overview
This feature allows recruiters to specify whether their company is a **Startup** or **MNC** (Multinational Corporation) when posting job listings. If not specified, the system automatically detects the company type based on the company name.

---

## Changes Made

### 1. **Backend Database Model** (`backend/app/models.py`)
- Added `company_type` column to the `Job` table
- Column type: `String` 
- Default value: `"Startup"`
- Nullable: Yes (optional field)

```python
company_type = Column(String, nullable=True, default="Startup")
```

### 2. **API Schemas** (`backend/app/schemas.py`)
- Added `company_type` field to `JobBase` schema
- Type: `Optional[str]`
- This field is now included in all job creation and update requests/responses

```python
class JobBase(BaseModel):
    ...
    company_type: Optional[str] = None
    ...
```

### 3. **Auto-Detection Utility** (`backend/app/dependencies.py`)
- Created `detect_company_type()` function
- Implements intelligent company type detection based on company name
- Recognizes keywords for major companies across multiple sectors:
  - **Tech Giants**: Google, Microsoft, Apple, Amazon, Meta, etc.
  - **Banks**: JPMorgan, Goldman Sachs, Bank of America, etc.
  - **Consulting**: McKinsey, Bain, Deloitte, PWC, Accenture, etc.
  - **E-commerce**: Walmart, Amazon, Alibaba, eBay, Shopify, etc.
  - **Telecom**: Verizon, AT&T, Sprint, Vodafone, Orange, etc.
  - **Automotive**: Tesla, Ford, GM, BMW, Mercedes, Toyota, etc.
  - **Pharma**: Pfizer, Merck, Johnson & Johnson, Roche, etc.
  - **Energy**: Exxon, Shell, Chevron, BP, Saudi Aramco, etc.
  - **Media**: Disney, Netflix, Warner Bros, Sony, etc.

Returns: `"Startup"` (default) or `"MNC"`

### 4. **Job Creation Endpoint** (`backend/app/routers/dashboard.py`)
- Updated `create_job()` function to handle `company_type`
- Logic:
  1. If recruiter provides `company_type`, use it
  2. If not provided, auto-detect using `detect_company_type()`
  3. Store the determined type in the database
- Enhanced notification system:
  - **For Startup**: Sends 🚀 "Startup Hiring Alert"
  - **For MNC**: Sends 🏢 "MNC Hiring Alert"

### 5. **Frontend Form** (`frontend/src/pages/RecruiterAddJob.jsx`)
- Added `company_type` field to the form state
- Added dropdown selector for Company Type:
  - **Auto-detect (Optional)** - Default, triggers server-side detection
  - **Startup** - Manually specify as startup
  - **MNC** - Manually specify as MNC
- Form field positioned after Company Name for easy access
- Optional field - recruiters can leave it blank for auto-detection

Form structure:
```jsx
<select name="company_type" value={form.company_type} onChange={handleChange}>
  <option value="">Auto-detect (Optional)</option>
  <option value="Startup">Startup</option>
  <option value="MNC">MNC</option>
</select>
```

---

## Database Migration

A migration script is provided: `backend/add_company_type_column.py`

To run the migration:
```bash
cd backend
python add_company_type_column.py
```

The migration:
- Checks if `company_type` column already exists
- Adds the column if it's missing
- Sets default value to `"Startup"` for existing records
- Handles both PostgreSQL and SQLite databases

---

## API Request/Response Examples

### Create Job Request
```json
{
  "title": "Senior Frontend Developer",
  "company_name": "Google",
  "company_type": "",  // or "Startup", "MNC", or omitted entirely
  "description": "...",
  "location": "Mountain View, CA",
  "salary_min": 150000,
  "salary_max": 200000,
  "skills_required": "React, TypeScript, JavaScript",
  "job_type": "Full Time",
  "education": "Bachelor's Degree"
}
```

### Create Job Response
```json
{
  "id": 42,
  "company_id": 1,
  "title": "Senior Frontend Developer",
  "company_name": "Google",
  "company_type": "MNC",  // Auto-detected
  "location": "Mountain View, CA",
  "salary_min": 150000,
  "salary_max": 200000,
  "skills_required": "React, TypeScript, JavaScript",
  "job_type": "Full Time",
  "description": "...",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Auto-Detection Examples

| Company Name | Detected Type | Logic |
|---|---|---|
| Google | MNC | Keyword: "google" |
| Apple Inc. | MNC | Keyword: "apple" |
| My Startup | Startup | No keyword match |
| Accenture Solutions | MNC | Keyword: "accenture" (consulting) |
| TechCorp | Startup | No keyword match |
| JPMorgan Chase | MNC | Keyword: "jpmorgan" |
| XYZ Labs | Startup | No known keyword |

---

## Features & Benefits

✅ **Flexible Input**: Recruiters can specify OR auto-detect company type
✅ **Smart Detection**: Recognizes 100+ major companies across multiple sectors
✅ **Fallback Default**: Defaults to "Startup" if no keywords match
✅ **Enhanced Notifications**: Different alert types for Startups vs MNCs
✅ **Future-Ready**: Easy to add more company keywords or modify detection logic
✅ **Database-Agnostic**: Works with both PostgreSQL and SQLite

---

## Files Modified

1. `backend/app/models.py` - Added company_type column
2. `backend/app/schemas.py` - Added company_type field to JobBase
3. `backend/app/dependencies.py` - Added detect_company_type() function
4. `backend/app/routers/dashboard.py` - Updated create_job() endpoint
5. `frontend/src/pages/RecruiterAddJob.jsx` - Added company_type form field

---

## Files Created

1. `backend/add_company_type_column.py` - Database migration script

---

## Testing Recommendations

1. **Manual Testing**:
   - Create job with company_type = "" → Should auto-detect
   - Create job with company_type = "Startup" → Should use provided value
   - Create job with company_type = "MNC" → Should use provided value
   - Test with known companies: Google, Microsoft, XYZ Startup, etc.

2. **Notification Testing**:
   - Verify Startup jobs show 🚀 "Startup Hiring Alert"
   - Verify MNC jobs show 🏢 "MNC Hiring Alert"

3. **Database Testing**:
   - Confirm existing jobs still work (backwards compatible)
   - Confirm new column defaults to "Startup" for old records

---

## Future Enhancements

- Add company size (number of employees) detection
- Allow custom company type categories
- Company type filters in job search
- Analytics dashboard showing Startup vs MNC hiring trends
- User preferences for company type notifications
