# DATABASE_SCHEMA.md — SwipeX Milestone 4

This is a living reference of every model across Milestones 1–4. It's
generated from the actual Django app registry, so it always reflects what's
really migrated — not an aspirational diagram.

Legend: **PK** primary key · **FK** foreign key · relationships are
Django's default (`on_delete=CASCADE` unless noted).

---

## `apps.users`

### User (custom auth user, `AUTH_USER_MODEL`)
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | Email | unique, used as username |
| password | hashed | |
| first_name, last_name | Char | |
| avatar | Image | optional |
| role | Choice | `job_seeker` \| `recruiter` \| `admin` |
| auth_provider | Choice | `email` \| `google` \| `github` (OAuth2 scaffolding) |
| is_active, is_staff, is_superuser | Bool | Django defaults |
| is_email_verified, is_profile_complete | Bool | |
| date_joined, last_login | DateTime | |

### UserProfile (1:1 → User)
headline, bio, location, phone, website, linkedin, github,
years_of_experience, current_ctc, expected_ctc,
preferred_job_types (JSON list), preferred_locations (JSON list),
open_to_remote, open_to_relocation, created_at, updated_at

### RecruiterProfile (1:1 → User)
company_name, company_size, industry, company_website, designation,
is_verified, created_at, updated_at

---

## `apps.authentication`

### EmailVerificationToken / PasswordResetToken
id (PK), user (FK → User), token, expires_at, is_used, created_at

---

## `apps.jobs`

### Company
id (PK), recruiter (FK → User), name, slug, logo, cover_image,
company_type (`mnc` \| `startup` \| `newly_founded`), industry, description,
website, headquarters, company_size, founded_year, linkedin, twitter,
is_verified, created_at, updated_at

### Skill
id (PK), name (unique), slug, created_at

### Job
id (PK), recruiter (FK → User), company (FK → Company), title, description,
requirements, benefits, salary_min, salary_max, salary_currency,
salary_visible, job_type, work_mode, experience_level, location, openings,
status (`draft`\|`published`\|`closed`), deadline, is_fresher_friendly,
applicant_count, competition_level (`low`\|`medium`\|`high`), created_at,
updated_at, published_at,
**skills_required** (M2M → Skill), **skills_preferred** (M2M → Skill)

### JobApplication
id (PK), job_seeker (FK → User), job (FK → Job),
status (`pending`→`reviewed`→`shortlisted`→`interview_scheduled`→
`interview_completed`→`offered`→`accepted` / `rejected`/`withdrawn`),
**status_history** (JSON list of `{status, changed_at, note?}` — full audit
trail, powers the Milestone 4 status timeline), recruiter_notes, cover_note,
resume_url, applied_at, updated_at

### SwipeHistory
id (PK), job_seeker (FK), job (FK), direction (`left`\|`right`), swiped_at

### SavedJob
id (PK), job_seeker (FK), job (FK), saved_at

### Recommendation
id (PK), job_seeker (FK), job (FK), score (float 0–1), reasons (JSON list),
**explanation** (JSON — *Milestone 4*: `{matched, missing, ats_score,
summary}`), generated_at

---

## `apps.resumes` (Milestone 3)

### Resume
id (PK), user (FK → User), file, original_filename, file_type, file_size,
is_primary, raw_text, parsed_name, parsed_email, parsed_phone,
parsed_skills (JSON list), parsed_technologies (JSON list), parsed_education
(JSON list), parsed_experience (JSON list), parsed_projects (JSON list),
parsed_certifications (JSON list), has_github_link, has_linkedin_link,
parsed_github_url, parsed_linkedin_url, estimated_years_experience,
parse_status (`pending`\|`success`\|`failed`), parse_error, uploaded_at,
updated_at

### ATSScore
id (PK), resume (FK → Resume), job (FK → Job), overall_score, skill_match,
experience_match, keyword_match, education_match, matched_skills (JSON),
missing_skills (JSON), missing_keywords (JSON), suggestions (JSON),
computed_at

---

## `apps.notifications` (Milestone 4 — new)

### Notification
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user | FK → User | recipient |
| title | Char | |
| message | Text | optional |
| type | Choice | `new_job`, `high_match`, `low_competition`, `resume_reminder`, `saved_job_reminder`, `application_status`, `shortlisted`, `interview_scheduled`, `new_application`, `candidate_shortlist_suggestion`, `job_expiration_reminder`, `system` |
| priority | Choice | `low` \| `normal` \| `high` |
| link | Char | frontend deep-link, e.g. `/jobs/<id>` |
| job | FK → Job | optional, nullable |
| application | FK → JobApplication | optional, nullable |
| is_read | Bool | |
| read_at | DateTime | nullable |
| created_at | DateTime | |

Indexes on `(user, is_read)` and `(user, -created_at)` for fast unread-count
and feed queries.

---

## `apps.analytics` (Milestone 4 — new)

### SkillGapSnapshot
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| job_seeker | FK → User | |
| job | FK → Job | nullable — null means "overall profile gap" |
| matched_skills | JSON list | |
| missing_skills | JSON list | |
| priority_skills | JSON list | missing skills ranked by importance |
| learning_suggestions | JSON list | `[{skill, suggestion}]` |
| match_percentage | Float | |
| created_at | DateTime | |

Everything else in Milestone 4's dashboards (application timelines, hiring
funnels, match-score trends, skill distributions) is computed on the fly
from existing Milestone 1–3 tables (`Job`, `JobApplication`, `Recommendation`,
`Resume`, `ATSScore`) — no additional tables were needed for those.

---

## Entity Relationship Summary

```
User ──1:1── UserProfile
User ──1:1── RecruiterProfile
User ──1:N── Company (as recruiter)
User ──1:N── Job (as recruiter)
User ──1:N── JobApplication (as job_seeker)
User ──1:N── SwipeHistory, SavedJob, Recommendation (as job_seeker)
User ──1:N── Resume
User ──1:N── Notification
User ──1:N── SkillGapSnapshot (as job_seeker)

Company ──1:N── Job
Job ──M2M── Skill (required / preferred)
Job ──1:N── JobApplication, SwipeHistory, SavedJob, Recommendation
Job ──1:N── Notification (optional), SkillGapSnapshot (optional)

Resume ──1:N── ATSScore
Job ──1:N── ATSScore

JobApplication ──1:N── Notification (optional)
```
