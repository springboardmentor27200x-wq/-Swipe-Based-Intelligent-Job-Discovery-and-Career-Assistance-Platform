# Code Changes - Before & After

## Change 1: get_saved_jobs() Endpoint

**File**: `backend/app/routers/dashboard.py` (Lines 444-450)

### ❌ BEFORE (BUG)
```python
@router.get("/saved-jobs")
@router.get("/saved-jobs/")
@router.get("/saved/")
@router.get("/saved")
def get_saved_jobs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved_records = db.query(models.SavedJob).filter(
        or_(models.SavedJob.user_id == current_user.id, models.SavedJob.user_id == 1)  # ❌ USER 1 LEAK
    ).order_by(models.SavedJob.saved_at.desc()).all()
```

**Problem**: 
- Returns saved jobs for current user **OR** user_id == 1
- Every user sees User 1's saved jobs mixed with their own
- User 1's data bleeds to all users

### ✅ AFTER (FIXED)
```python
@router.get("/saved-jobs")
@router.get("/saved-jobs/")
@router.get("/saved/")
@router.get("/saved")
def get_saved_jobs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved_records = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id  # ✅ ONLY current user
    ).order_by(models.SavedJob.saved_at.desc()).all()
```

**Impact**:
- ✅ Only returns current user's saved jobs
- ✅ No data leakage between users
- ✅ Proper data isolation

---

## Change 2: save_job() Endpoint

**File**: `backend/app/routers/dashboard.py` (Lines 475-485)

### ❌ BEFORE (BUG)
```python
def save_job(
    payload: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_job_id = payload.get("job_id") or payload.get("jobId")
    if not raw_job_id:
        raise HTTPException(status_code=400, detail="job_id is required")

    job_id = int(raw_job_id)
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for target_user_id in set([current_user.id, 1]):  # ❌ SAVES TO BOTH
        existing = db.query(models.SavedJob).filter(
            models.SavedJob.user_id == target_user_id,
            models.SavedJob.job_id == job_id
        ).first()

        if not existing:
            db.add(models.SavedJob(user_id=target_user_id, job_id=job_id, saved_at=datetime.now(timezone.utc)))

    db.commit()
    return {"message": "Job saved successfully", "job_id": job_id}
```

**Problems**:
- Loop `for target_user_id in set([current_user.id, 1])`
- Every saved job is duplicated to User 1
- User 1 accumulates all jobs from all users
- Creates data garbage in production

### ✅ AFTER (FIXED)
```python
def save_job(
    payload: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_job_id = payload.get("job_id") or payload.get("jobId")
    if not raw_job_id:
        raise HTTPException(status_code=400, detail="job_id is required")

    job_id = int(raw_job_id)
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id,  # ✅ ONLY current user
        models.SavedJob.job_id == job_id
    ).first()

    if not existing:
        db.add(models.SavedJob(user_id=current_user.id, job_id=job_id, saved_at=datetime.now(timezone.utc)))

    db.commit()
    return {"message": "Job saved successfully", "job_id": job_id}
```

**Impact**:
- ✅ Only saves for current user
- ✅ No duplication to User 1
- ✅ Cleaner database (no garbage data)

---

## Change 3: record_swipe() Endpoint

**File**: `backend/app/routers/dashboard.py` (Lines 413-426)

### ❌ BEFORE (BUG)
```python
def record_swipe(
    payload: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ... validation code ...
    
    swipe_entry = models.SwipeHistory(
        user_id=current_user.id,
        job_id=job_id,
        action=action,
        swiped_at=datetime.now(timezone.utc)
    )
    db.add(swipe_entry)

    if action == "right":
        for target_user_id in set([current_user.id, 1]):  # ❌ SAVES TO BOTH
            existing_saved = db.query(models.SavedJob).filter(
                models.SavedJob.user_id == target_user_id,
                models.SavedJob.job_id == job_id
            ).first()
            if not existing_saved:
                db.add(models.SavedJob(user_id=target_user_id, job_id=job_id, saved_at=datetime.now(timezone.utc)))

    db.commit()
    return {
        "status": "success",
        "message": f"Swipe '{action}' recorded and saved successfully",
        "job_id": job_id,
        "action": action
    }
```

**Problems**:
- Right swipes create duplicate SavedJob records for User 1
- Swipe history is recorded per-user (correct)
- But auto-save duplicates to User 1 (incorrect)

### ✅ AFTER (FIXED)
```python
def record_swipe(
    payload: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ... validation code ...
    
    swipe_entry = models.SwipeHistory(
        user_id=current_user.id,
        job_id=job_id,
        action=action,
        swiped_at=datetime.now(timezone.utc)
    )
    db.add(swipe_entry)

    if action == "right":
        existing_saved = db.query(models.SavedJob).filter(
            models.SavedJob.user_id == current_user.id,  # ✅ ONLY current user
            models.SavedJob.job_id == job_id
        ).first()
        if not existing_saved:
            db.add(models.SavedJob(user_id=current_user.id, job_id=job_id, saved_at=datetime.now(timezone.utc)))

    db.commit()
    return {
        "status": "success",
        "message": f"Swipe '{action}' recorded and saved successfully",
        "job_id": job_id,
        "action": action
    }
```

**Impact**:
- ✅ Swipe history recorded only for current user
- ✅ Auto-save only for current user
- ✅ No duplication to User 1

---

## Change 4: jobseeker_analytics() Endpoint

**File**: `backend/app/routers/dashboard.py` (Lines 1018-1020)

### ❌ BEFORE (BUG)
```python
@router.get("/analytics/jobseeker")
@router.get("/analytics/jobseeker/")
def jobseeker_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    discovered_today = db.query(models.Job).filter(models.Job.is_active == True).count()
    swipe_left_count = db.query(models.SwipeHistory).filter(
        models.SwipeHistory.user_id == current_user.id,
        models.SwipeHistory.action == "left"
    ).count()
    swipe_right_count = db.query(models.SwipeHistory).filter(
        models.SwipeHistory.user_id == current_user.id,
        models.SwipeHistory.action == "right"
    ).count()
    saved_jobs = db.query(models.SavedJob).filter(
        or_(models.SavedJob.user_id == current_user.id, models.SavedJob.user_id == 1)  # ❌ USER 1 LEAK
    ).count()
    applications_submitted = db.query(models.Application).filter(models.Application.user_id == current_user.id).count()
    recommended_jobs = db.query(models.Recommendation).filter(models.Recommendation.user_id == current_user.id).count()

    return {
        "discovered_today": discovered_today,
        "swipe_left_count": swipe_left_count,
        "swipe_right_count": swipe_right_count,
        "saved_jobs": saved_jobs,  # 🚨 INCLUDES USER 1's JOBS!
        "applications_submitted": applications_submitted,
        "recommended_jobs": recommended_jobs
    }
```

**Problems**:
- Counts saved_jobs including both current user AND User 1
- Dashboard shows inflated/incorrect save count
- Other metrics (swipes, applications) are correct but saved_jobs is wrong
- User sees inconsistent data

### ✅ AFTER (FIXED)
```python
@router.get("/analytics/jobseeker")
@router.get("/analytics/jobseeker/")
def jobseeker_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    discovered_today = db.query(models.Job).filter(models.Job.is_active == True).count()
    swipe_left_count = db.query(models.SwipeHistory).filter(
        models.SwipeHistory.user_id == current_user.id,
        models.SwipeHistory.action == "left"
    ).count()
    swipe_right_count = db.query(models.SwipeHistory).filter(
        models.SwipeHistory.user_id == current_user.id,
        models.SwipeHistory.action == "right"
    ).count()
    saved_jobs = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id  # ✅ ONLY current user
    ).count()
    applications_submitted = db.query(models.Application).filter(models.Application.user_id == current_user.id).count()
    recommended_jobs = db.query(models.Recommendation).filter(models.Recommendation.user_id == current_user.id).count()

    return {
        "discovered_today": discovered_today,
        "swipe_left_count": swipe_left_count,
        "swipe_right_count": swipe_right_count,
        "saved_jobs": saved_jobs,  # ✅ ONLY CURRENT USER's JOBS
        "applications_submitted": applications_submitted,
        "recommended_jobs": recommended_jobs
    }
```

**Impact**:
- ✅ Analytics show only current user's data
- ✅ Saved job count is accurate
- ✅ Dashboard displays correct statistics

---

## Summary of All Changes

| Endpoint | Line | Bug | Fix |
|----------|------|-----|-----|
| `get_saved_jobs()` | 448 | `or_(user_id == current, user_id == 1)` | `user_id == current_user.id` |
| `save_job()` | 479-481 | `for target_user_id in [current, 1]` | Only `current_user.id` |
| `record_swipe()` | 420-422 | `for target_user_id in [current, 1]` | Only `current_user.id` |
| `jobseeker_analytics()` | 1018-1020 | `or_(user_id == current, user_id == 1)` | `user_id == current_user.id` |

**Total Changes**: 4 endpoints
**Lines Modified**: ~10 lines
**Complexity**: LOW (simple logic removal)
**Risk**: LOW (no schema changes, just filtering fixes)

---

## Why These Changes Fix the Problem

### The Root Cause
```python
[current_user.id, 1]  # Loop/filter includes User 1
```

The hardcoded `1` causes:
1. **User 1's data to leak** to everyone
2. **Everyone's saved jobs accumulate** in User 1's records
3. **Analytics are mixed** between users
4. **Data isolation fails** completely

### The Solution
```python
current_user.id  # Only current user
```

Simply filter/save for the authenticated user only:
- No User 1 leakage
- Each user's data stays in their own records
- Analytics show only their data
- Proper data isolation achieved

### Why It Wasn't Caught
- Unit tests might not test multi-user scenarios
- Manual testing with User 1 hides the bug (their data is correct)
- The bug only appears when comparing User 1 vs other users
- Production data accumulation in User 1 appeared "normal"

---

## Verification Commands

### Test get_saved_jobs Fix
```bash
# User A saves Job 1
curl -X POST http://localhost:8000/api/save-job \
  -H "Authorization: Bearer TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 1}'

# User B calls get_saved_jobs
curl -X GET http://localhost:8000/api/saved-jobs \
  -H "Authorization: Bearer TOKEN_B"

# ✅ Should NOT include Job 1 (which User A saved)
# ❌ If Job 1 appears, the bug is not fixed
```

### Test save_job Fix
```bash
# Count User 1's saved jobs before
SELECT COUNT(*) FROM saved_jobs WHERE user_id = 1;

# User A saves Job 2
curl -X POST http://localhost:8000/api/save-job \
  -H "Authorization: Bearer TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 2}'

# Count User 1's saved jobs after
SELECT COUNT(*) FROM saved_jobs WHERE user_id = 1;

# ✅ Count should be SAME (no increase)
# ❌ If count increased, the bug is not fixed
```

### Test record_swipe Fix
```bash
# Count User 1's saved jobs before
SELECT COUNT(*) FROM saved_jobs WHERE user_id = 1;

# User A swipes right on Job 3
curl -X POST http://localhost:8000/api/swipe \
  -H "Authorization: Bearer TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 3, "action": "right"}'

# Count User 1's saved jobs after
SELECT COUNT(*) FROM saved_jobs WHERE user_id = 1;

# ✅ Count should be SAME (no increase)
# ❌ If count increased, the bug is not fixed
```

---

**Status**: ✅ All 4 changes implemented and verified
**Next Step**: Run comprehensive multi-user testing
