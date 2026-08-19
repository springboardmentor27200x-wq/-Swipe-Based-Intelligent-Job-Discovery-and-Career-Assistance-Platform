-- ==========================================
-- SwipeX PostgreSQL Database Schema DDL
-- Role-Based Access Control (RBAC) Foundation
-- ==========================================

-- Create Enum types for Roles and Application Status
CREATE TYPE user_role AS ENUM ('job_seeker', 'recruiter', 'admin');
CREATE TYPE match_status AS ENUM ('swiped_left', 'swiped_right', 'matched', 'interviewing', 'hired', 'rejected');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'job_seeker',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles Table (Holds dynamic info for both Job Seekers and Recruiters)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150),
    title VARCHAR(100), -- E.g. "Senior React Developer" or "HR Director"
    bio TEXT,
    avatar_url VARCHAR(512),
    skills JSONB DEFAULT '[]'::jsonb, -- Array of skills for matching, e.g. ["React", "Python"]
    resume_url VARCHAR(512), -- Uploaded resume URL (used by Job Seekers)
    company_name VARCHAR(150), -- recruiter-specific
    company_website VARCHAR(255), -- recruiter-specific
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Jobs Table (Managed by Recruiters)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    salary_range VARCHAR(100), -- E.g., "$120,000 - $150,000"
    location VARCHAR(100), -- E.g., "San Francisco, CA" or "Remote"
    required_skills JSONB DEFAULT '[]'::jsonb, -- Array of required skills
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Swipes / Application Matches Table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status match_status NOT NULL DEFAULT 'swiped_right',
    seeker_feedback TEXT,
    recruiter_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Unique constraint: a user can only swipe once on a specific job
    CONSTRAINT unique_seeker_job_swipe UNIQUE (seeker_id, job_id)
);

-- Indexes for performance & query optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX idx_matches_seeker ON matches(seeker_id);
CREATE INDEX idx_matches_job ON matches(job_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Auto-update updated_at timestamps function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic update timestamps
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_jobs_modtime BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_matches_modtime BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
