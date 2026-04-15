-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('CEO', 'Brother / Co-MD', 'Operation Manager', 'HR Manager', 'Branch Manager', 'STAFF', 'INTERN');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Not Started', 'In Progress', 'BLOCKED', 'REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('Waiting for Submission', 'Submitted by Staff', 'Approved by Manager', 'Rejected by Manager', 'Escalated to CEO', 'Completed & Verified');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'Half Day', 'REMOTE');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('OFFICE', 'REMOTE', 'FIELD', 'LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('Annual Leave', 'Sick Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'In Progress', 'REVIEW', 'DELIVERED', 'On Hold', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "PortalMemberStatus" AS ENUM ('ACTIVE', 'Pending Verification', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'Revision Requested', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WalletTxType" AS ENUM ('DEPOSIT', 'Order Payment', 'Commission Credit', 'REFUND', 'PAYOUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('Pending Hold', 'AVAILABLE', 'Paid Out', 'CANCELLED', 'Fraud Hold');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYONEER', 'USDT TRC20', 'BINANCE', 'Bank Transfer', 'CASH');

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "member_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "system_role" "SystemRole" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "branch" TEXT,
    "job_role" TEXT,
    "primary_skill" TEXT,
    "skill_level" TEXT,
    "secondary_skills" TEXT,
    "tools_known" TEXT,
    "years_experience" DOUBLE PRECISION,
    "employment_type" TEXT,
    "salary" DOUBLE PRECISION,
    "email_alt" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "country" TEXT,
    "nid_passport" TEXT,
    "emergency_contact" TEXT,
    "join_date" TIMESTAMP(3),
    "termination_date" TIMESTAMP(3),
    "exit_reason" TEXT,
    "exit_interview_done" BOOLEAN NOT NULL DEFAULT false,
    "portfolio_url" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "certifications" TEXT,
    "tasks_assigned" INTEGER NOT NULL DEFAULT 0,
    "tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "total_tasks_rated" INTEGER NOT NULL DEFAULT 0,
    "average_task_rating" DOUBLE PRECISION,
    "ceo_performance_rating" DOUBLE PRECISION,
    "ceo_rating_note" TEXT,
    "ceo_last_rated_date" TIMESTAMP(3),
    "performance_score" DOUBLE PRECISION,
    "totp_secret" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token" TEXT,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "task_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'Not Started',
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'Waiting for Submission',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "created_by_role" TEXT,
    "assigned_member_id" TEXT,
    "assigned_manager_id" TEXT,
    "assigned_branch" TEXT,
    "assigned_by" TEXT,
    "multiple_assignees" TEXT,
    "related_project" TEXT,
    "related_client" TEXT,
    "task_url" TEXT,
    "start_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_frequency" TEXT,
    "staff_submission_note" TEXT,
    "manager_approved_by" TEXT,
    "manager_approved_date" TIMESTAMP(3),
    "manager_approval_note" TEXT,
    "ceo_verified" BOOLEAN NOT NULL DEFAULT false,
    "ceo_verified_date" TIMESTAMP(3),
    "ceo_work_rating" DOUBLE PRECISION,
    "ceo_rated_date" TIMESTAMP(3),
    "ceo_rating_note" TEXT,
    "attachment_1" TEXT,
    "attachment_2" TEXT,
    "attachment_3" TEXT,
    "attachment_notes" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "project_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'Waiting for Submission',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "project_type" TEXT,
    "service_type" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "client_name" TEXT,
    "client_email" TEXT,
    "project_manager" TEXT,
    "assigned_manager" TEXT,
    "assigned_to" TEXT,
    "assigned_branch" TEXT,
    "multiple_assignees" TEXT,
    "start_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "price" DOUBLE PRECISION,
    "price_bdt" DOUBLE PRECISION,
    "paid_amount" DOUBLE PRECISION,
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "repeat_client" BOOLEAN NOT NULL DEFAULT false,
    "invoice_number" TEXT,
    "contract_url" TEXT,
    "delivery_link" TEXT,
    "feedback" TEXT,
    "ceo_verified" BOOLEAN NOT NULL DEFAULT false,
    "ceo_work_rating" DOUBLE PRECISION,
    "notes" TEXT,
    "created_by_role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "attendance_id" SERIAL NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "work_type" "WorkType" NOT NULL DEFAULT 'OFFICE',
    "staff_system_role" TEXT,
    "leave_type" TEXT,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "hours_worked" DOUBLE PRECISION,
    "overtime_hours" DOUBLE PRECISION DEFAULT 0,
    "approved_by" TEXT,
    "login_ip" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "leave_id" SERIAL NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "staff_system_role" TEXT,
    "branch" TEXT,
    "leave_type" "LeaveType" NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL,
    "annual_leave_balance" INTEGER,
    "sick_leave_balance" INTEGER,
    "total_days_used_year" INTEGER,
    "reason" TEXT,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "report_id" SERIAL NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "submitter_name" TEXT NOT NULL,
    "submitter_role" TEXT,
    "branch" TEXT,
    "report_date" DATE NOT NULL,
    "tasks_completed" TEXT NOT NULL,
    "planned_tomorrow" TEXT NOT NULL,
    "blockers" TEXT,
    "hours_worked" DOUBLE PRECISION NOT NULL,
    "overtime_hours" DOUBLE PRECISION DEFAULT 0,
    "mood" TEXT,
    "related_client" TEXT,
    "login_ip" TEXT,
    "manager_review_note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_ratings" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "system_role" TEXT,
    "branch" TEXT,
    "rated_by" TEXT NOT NULL,
    "review_period" TEXT,
    "review_quarter" TEXT,
    "review_year" INTEGER,
    "overall_rating" DOUBLE PRECISION NOT NULL,
    "task_quality" DOUBLE PRECISION,
    "communication" DOUBLE PRECISION,
    "punctuality" DOUBLE PRECISION,
    "teamwork" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "system_role" TEXT,
    "branch" TEXT,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "base_salary" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION DEFAULT 0,
    "deductions" DOUBLE PRECISION DEFAULT 0,
    "net_salary" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'Pending',
    "payment_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "branch_manager" TEXT,
    "staff_count" INTEGER DEFAULT 0,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "established_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" TEXT,
    "ip_address" TEXT,
    "mac_address" TEXT,
    "os" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "system_role" TEXT,
    "branch" TEXT,
    "registered_date" TIMESTAMP(3),
    "last_active" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "client_name" TEXT,
    "client_email" TEXT,
    "service" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "payment_method" TEXT,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "amount_bdt" DOUBLE PRECISION,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "project_reference" TEXT,
    "invoice_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "amount_bdt" DOUBLE PRECISION,
    "paid_by" TEXT,
    "branch" TEXT,
    "payment_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "expense_date" TIMESTAMP(3) NOT NULL,
    "approved_by" TEXT,
    "receipt_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_revenue" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "total_revenue_usd" DOUBLE PRECISION NOT NULL,
    "total_revenue_bdt" DOUBLE PRECISION,
    "total_expenses_usd" DOUBLE PRECISION,
    "net_profit_usd" DOUBLE PRECISION,
    "client_count" INTEGER,
    "new_clients" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "usd_to_bdt" DOUBLE PRECISION NOT NULL,
    "usd_to_aed" DOUBLE PRECISION,
    "bdt_to_aed" DOUBLE PRECISION,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "lead_id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "country" TEXT,
    "linkedin_url" TEXT,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "service_interested" TEXT,
    "lost_reason" TEXT,
    "budget_usd" DOUBLE PRECISION,
    "estimated_value" DOUBLE PRECISION,
    "lead_score" INTEGER,
    "follow_up_count" INTEGER NOT NULL DEFAULT 0,
    "owner" TEXT,
    "assigned_to" TEXT,
    "last_contact_date" TIMESTAMP(3),
    "next_follow_up_date" TIMESTAMP(3),
    "converted_to_client" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "order_id" SERIAL NOT NULL,
    "client_name" TEXT NOT NULL,
    "service" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "assigned_to" TEXT,
    "branch" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3),
    "delivery_date" TIMESTAMP(3),
    "delivery_link" TEXT,
    "invoice_reference" TEXT,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "total_spent_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "first_order_date" TIMESTAMP(3),
    "last_order_date" TIMESTAMP(3),
    "assigned_manager" TEXT,
    "source" TEXT,
    "linkedin_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "base_price_usd" DOUBLE PRECISION,
    "price_bdt" DOUBLE PRECISION,
    "turnaround_days" INTEGER,
    "short_description" TEXT,
    "full_description" TEXT,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backlink_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "da_range" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "price_per_link" DOUBLE PRECISION NOT NULL,
    "price_x10" DOUBLE PRECISION,
    "price_x50" DOUBLE PRECISION,
    "price_x100" DOUBLE PRECISION,
    "price_x1000" DOUBLE PRECISION,
    "turnaround_days" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backlink_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "domain_id" SERIAL NOT NULL,
    "domain_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "registrar" TEXT,
    "assigned_to" TEXT,
    "expiry_date" TIMESTAMP(3),
    "registration_date" TIMESTAMP(3),
    "annual_renewal_cost" DOUBLE PRECISION,
    "domain_age_years" DOUBLE PRECISION,
    "da_score" INTEGER,
    "dr_score" INTEGER,
    "backlinks_count" INTEGER,
    "indexed_pages" INTEGER,
    "niche" TEXT,
    "hosting_server" TEXT,
    "ssl_status" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "ip_address" TEXT,
    "location" TEXT,
    "os" TEXT,
    "ram_gb" INTEGER,
    "storage_gb" INTEGER,
    "monthly_cost_usd" DOUBLE PRECISION,
    "renewal_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "websites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Live',
    "platform" TEXT,
    "hosted_on" TEXT,
    "domain_linked" TEXT,
    "assigned_manager" TEXT,
    "monthly_traffic" INTEGER,
    "da_score" INTEGER,
    "ssl_status" TEXT,
    "last_updated" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "websites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "branch" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "employment_type" TEXT,
    "salary_min" DOUBLE PRECISION,
    "salary_max" DOUBLE PRECISION,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "applications" INTEGER NOT NULL DEFAULT 0,
    "posted_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "job_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "applicant_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "source" TEXT,
    "applied_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interview_date" TIMESTAMP(3),
    "cv_url" TEXT,
    "portfolio_url" TEXT,
    "experience_years" DOUBLE PRECISION,
    "expected_salary" DOUBLE PRECISION,
    "interviewer_notes" TEXT,
    "rejection_reason" TEXT,
    "offer_salary" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_members" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "country" TEXT,
    "status" "PortalMemberStatus" NOT NULL DEFAULT 'Pending Verification',
    "referral_code" TEXT NOT NULL,
    "referred_by_id" TEXT,
    "wallet_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_referrals" INTEGER NOT NULL DEFAULT 0,
    "total_commission_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token" TEXT,
    "reset_password_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),
    "refresh_token" TEXT,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_orders" (
    "id" TEXT NOT NULL,
    "order_id" SERIAL NOT NULL,
    "member_id" TEXT NOT NULL,
    "member_email" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" TEXT NOT NULL DEFAULT 'Pending',
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requirements" TEXT,
    "delivery_link" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "delivery_date" TIMESTAMP(3),
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "revision_note" TEXT,
    "rating" DOUBLE PRECISION,
    "review_note" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "balance_after_usd" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reference" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proof_url" TEXT,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "earner_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "referred_member_name" TEXT,
    "order_amount_usd" DOUBLE PRECISION NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "commission_amount_usd" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'Pending Hold',
    "hold_release_date" TIMESTAMP(3) NOT NULL,
    "payout_date" TIMESTAMP(3),
    "payout_reference" TEXT,
    "fraud_flag" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "member_email" TEXT NOT NULL,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_details" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requested_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_date" TIMESTAMP(3),
    "processed_by" TEXT,
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcasts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sent_by" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" SERIAL NOT NULL,
    "member_id" TEXT,
    "member_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_replies" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "trigger" TEXT,
    "frequency" TEXT,
    "next_run_date" TIMESTAMP(3),
    "last_run_date" TIMESTAMP(3),
    "last_run_status" TEXT,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "affected_module" TEXT,
    "whatsapp_notify" BOOLEAN NOT NULL DEFAULT false,
    "error_log" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_member_id_key" ON "staff_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_email_key" ON "staff_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_task_id_key" ON "tasks"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_id_key" ON "projects"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_attendance_id_key" ON "attendance"("attendance_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_staff_member_id_date_key" ON "attendance"("staff_member_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_requests_leave_id_key" ON "leave_requests"("leave_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_report_id_key" ON "daily_reports"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_staff_member_id_report_date_key" ON "daily_reports"("staff_member_id", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_staff_member_id_month_year_key" ON "payroll"("staff_member_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "branches_name_key" ON "branches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_revenue_month_year_key" ON "monthly_revenue"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "crm_leads_lead_id_key" ON "crm_leads"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_id_key" ON "sales_orders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_email_key" ON "client_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "backlink_packages_name_key" ON "backlink_packages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "domains_domain_id_key" ON "domains"("domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "domains_domain_name_key" ON "domains"("domain_name");

-- CreateIndex
CREATE UNIQUE INDEX "servers_name_key" ON "servers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "websites_name_key" ON "websites"("name");

-- CreateIndex
CREATE UNIQUE INDEX "portal_members_email_key" ON "portal_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "portal_members_referral_code_key" ON "portal_members"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "portal_orders_order_id_key" ON "portal_orders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "automations_name_key" ON "automations"("name");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_member_id_fkey" FOREIGN KEY ("assigned_member_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_manager_id_fkey" FOREIGN KEY ("assigned_manager_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_ratings" ADD CONSTRAINT "performance_ratings_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_members" ADD CONSTRAINT "portal_members_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "portal_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_orders" ADD CONSTRAINT "portal_orders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "portal_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "portal_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_earner_id_fkey" FOREIGN KEY ("earner_id") REFERENCES "portal_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "portal_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "portal_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

