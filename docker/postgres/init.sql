-- Digital HRM - PostgreSQL Initialization Script
-- This file is executed automatically when the database is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom enum types
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role_type AS ENUM ('SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_STAFF', 'DEPT_MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'ACCOUNTANT', 'IT_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'LATE_EARLY_LEAVE', 'ON_LEAVE', 'REMOTE', 'BUSINESS_TRIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recruitment_status AS ENUM ('OPEN', 'CLOSED', 'ON_HOLD', 'DRAFT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE candidate_status AS ENUM ('NEW', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_type AS ENUM ('PROBATION', 'FIXED_TERM', 'INDEFINITE', 'PART_TIME', 'CONTRACTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE evaluation_status AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('CONTRACT', 'CERTIFICATE', 'ID_CARD', 'DIPLOMA', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'APPROVAL', 'REMINDER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON "User"(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON "User"(departmentId);

CREATE INDEX IF NOT EXISTS idx_attendance_user ON "AttendanceRecord"(userId);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON "AttendanceRecord"(date);

CREATE INDEX IF NOT EXISTS idx_leave_user ON "LeaveRequest"(userId);
CREATE INDEX IF NOT EXISTS idx_leave_status ON "LeaveRequest"(status);

CREATE INDEX IF NOT EXISTS idx_contracts_user ON "Contract"(userId);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON "Contract"(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON "Contract"(endDate);

CREATE INDEX IF NOT EXISTS idx_assets_assignee ON "Asset"(assignedToUserId);
CREATE INDEX IF NOT EXISTS idx_assets_status ON "Asset"(status);

CREATE INDEX IF NOT EXISTS idx_candidates_status ON "Candidate"(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON "JobPosting"(status);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log initialization complete
DO $$ BEGIN
    RAISE NOTICE 'Digital HRM database initialization complete!';
END $$;
