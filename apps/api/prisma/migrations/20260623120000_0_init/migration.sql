-- CreateTable
CREATE TABLE `staff_members` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `system_role` ENUM('CEO', 'Brother / Co-MD', 'Operation Manager', 'HR Manager', 'Branch Manager', 'STAFF', 'INTERN') NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `job_role` VARCHAR(191) NULL,
    `primary_skill` VARCHAR(191) NULL,
    `skill_level` VARCHAR(191) NULL,
    `secondary_skills` VARCHAR(191) NULL,
    `tools_known` VARCHAR(191) NULL,
    `years_experience` DOUBLE NULL,
    `employment_type` VARCHAR(191) NULL,
    `salary` DOUBLE NULL,
    `email_alt` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `nid_passport` VARCHAR(191) NULL,
    `emergency_contact` VARCHAR(191) NULL,
    `join_date` DATETIME(3) NULL,
    `termination_date` DATETIME(3) NULL,
    `exit_reason` VARCHAR(191) NULL,
    `exit_interview_done` BOOLEAN NOT NULL DEFAULT false,
    `portfolio_url` VARCHAR(191) NULL,
    `linkedin_url` VARCHAR(191) NULL,
    `github_url` VARCHAR(191) NULL,
    `certifications` VARCHAR(191) NULL,
    `tasks_assigned` INTEGER NOT NULL DEFAULT 0,
    `tasks_completed` INTEGER NOT NULL DEFAULT 0,
    `total_tasks_rated` INTEGER NOT NULL DEFAULT 0,
    `average_task_rating` DOUBLE NULL,
    `ceo_performance_rating` DOUBLE NULL,
    `ceo_rating_note` VARCHAR(191) NULL,
    `ceo_last_rated_date` DATETIME(3) NULL,
    `performance_score` DOUBLE NULL,
    `totp_secret` VARCHAR(191) NULL,
    `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
    `refresh_token` VARCHAR(191) NULL,
    `last_login_at` DATETIME(3) NULL,
    `last_login_ip` VARCHAR(191) NULL,
    `preferred_currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `avatar_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_members_member_id_key`(`member_id`),
    UNIQUE INDEX `staff_members_email_key`(`email`),
    INDEX `staff_members_branch_id_idx`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_documents` (
    `id` VARCHAR(191) NOT NULL,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `document_type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `thumbnail_url` VARCHAR(191) NULL,
    `issue_date` DATETIME(3) NULL,
    `expiry_date` DATETIME(3) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_by` VARCHAR(191) NULL,
    `verified_at` DATETIME(3) NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `staff_documents_staff_member_id_idx`(`staff_member_id`),
    INDEX `staff_documents_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('CEO', 'Brother / Co-MD', 'Operation Manager', 'HR Manager', 'Branch Manager', 'STAFF', 'INTERN') NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `allowed` BOOLEAN NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `role_permissions_role_key_key`(`role`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `task_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('Not Started', 'In Progress', 'BLOCKED', 'REVIEW', 'DONE') NOT NULL DEFAULT 'Not Started',
    `approval_status` ENUM('Waiting for Submission', 'Submitted by Staff', 'Approved by Manager', 'Rejected by Manager', 'Escalated to CEO', 'Completed & Verified') NOT NULL DEFAULT 'Waiting for Submission',
    `priority` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    `category` VARCHAR(191) NULL,
    `created_by_role` VARCHAR(191) NULL,
    `assigned_member_id` VARCHAR(191) NULL,
    `assigned_manager_id` VARCHAR(191) NULL,
    `assigned_branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `assigned_by` VARCHAR(191) NULL,
    `multiple_assignees` VARCHAR(191) NULL,
    `related_project` VARCHAR(191) NULL,
    `related_project_id` VARCHAR(191) NULL,
    `related_client` VARCHAR(191) NULL,
    `task_url` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `completed_date` DATETIME(3) NULL,
    `estimated_hours` DOUBLE NULL,
    `actual_hours` DOUBLE NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `is_recurring` BOOLEAN NOT NULL DEFAULT false,
    `recurring_frequency` VARCHAR(191) NULL,
    `staff_submission_note` VARCHAR(191) NULL,
    `manager_approved_by` VARCHAR(191) NULL,
    `manager_approved_date` DATETIME(3) NULL,
    `manager_approval_note` VARCHAR(191) NULL,
    `ceo_verified` BOOLEAN NOT NULL DEFAULT false,
    `ceo_verified_date` DATETIME(3) NULL,
    `ceo_work_rating` DOUBLE NULL,
    `ceo_rated_date` DATETIME(3) NULL,
    `ceo_rating_note` VARCHAR(191) NULL,
    `attachment_1` VARCHAR(191) NULL,
    `attachment_2` VARCHAR(191) NULL,
    `attachment_3` VARCHAR(191) NULL,
    `attachment_notes` VARCHAR(191) NULL,
    `task_attachments` JSON NULL,
    `progress_updated_at` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tasks_task_id_key`(`task_id`),
    INDEX `tasks_related_project_id_idx`(`related_project_id`),
    INDEX `tasks_branch_id_idx`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_comments` (
    `id` VARCHAR(191) NOT NULL,
    `task_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `author_name` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'In Progress', 'REVIEW', 'DELIVERED', 'On Hold', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `approval_status` ENUM('Waiting for Submission', 'Submitted by Staff', 'Approved by Manager', 'Rejected by Manager', 'Escalated to CEO', 'Completed & Verified') NOT NULL DEFAULT 'Waiting for Submission',
    `priority` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    `project_type` VARCHAR(191) NULL,
    `service_type` VARCHAR(191) NULL,
    `payment_status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `client_name` VARCHAR(191) NULL,
    `client_email` VARCHAR(191) NULL,
    `project_manager` VARCHAR(191) NULL,
    `assigned_manager` VARCHAR(191) NULL,
    `assigned_to` VARCHAR(191) NULL,
    `assigned_branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `multiple_assignees` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `price` DOUBLE NULL,
    `price_bdt` DOUBLE NULL,
    `paid_amount` DOUBLE NULL,
    `estimated_hours` DOUBLE NULL,
    `actual_hours` DOUBLE NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `repeat_client` BOOLEAN NOT NULL DEFAULT false,
    `invoice_number` VARCHAR(191) NULL,
    `contract_url` VARCHAR(191) NULL,
    `delivery_link` VARCHAR(191) NULL,
    `feedback` VARCHAR(191) NULL,
    `ceo_verified` BOOLEAN NOT NULL DEFAULT false,
    `ceo_work_rating` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `created_by_role` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_project_id_key`(`project_id`),
    INDEX `projects_branch_id_idx`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `attendance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'Half Day', 'REMOTE') NOT NULL,
    `work_type` ENUM('OFFICE', 'REMOTE', 'FIELD', 'LEAVE', 'HOLIDAY') NOT NULL DEFAULT 'OFFICE',
    `staff_system_role` VARCHAR(191) NULL,
    `leave_type` VARCHAR(191) NULL,
    `check_in_time` DATETIME(3) NULL,
    `check_out_time` DATETIME(3) NULL,
    `hours_worked` DOUBLE NULL,
    `overtime_hours` DOUBLE NULL DEFAULT 0,
    `approved_by` VARCHAR(191) NULL,
    `login_ip` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `attendance_attendance_id_key`(`attendance_id`),
    INDEX `attendance_branch_id_idx`(`branch_id`),
    UNIQUE INDEX `attendance_staff_member_id_date_key`(`staff_member_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(191) NOT NULL,
    `leave_id` INTEGER NOT NULL AUTO_INCREMENT,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `staff_name` VARCHAR(191) NOT NULL,
    `staff_system_role` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `leave_type` ENUM('Annual Leave', 'Sick Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `total_days` INTEGER NOT NULL,
    `annual_leave_balance` INTEGER NULL,
    `sick_leave_balance` INTEGER NULL,
    `total_days_used_year` INTEGER NULL,
    `reason` VARCHAR(191) NULL,
    `approved_by` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leave_requests_leave_id_key`(`leave_id`),
    INDEX `leave_requests_branch_id_idx`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_reports` (
    `id` VARCHAR(191) NOT NULL,
    `report_id` INTEGER NOT NULL AUTO_INCREMENT,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `submitter_name` VARCHAR(191) NOT NULL,
    `submitter_role` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `report_date` DATE NOT NULL,
    `tasks_completed` VARCHAR(191) NOT NULL,
    `planned_tomorrow` VARCHAR(191) NOT NULL,
    `blockers` VARCHAR(191) NULL,
    `hours_worked` DOUBLE NOT NULL,
    `overtime_hours` DOUBLE NULL DEFAULT 0,
    `mood` VARCHAR(191) NULL,
    `related_client` VARCHAR(191) NULL,
    `login_ip` VARCHAR(191) NULL,
    `manager_review_note` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Submitted',
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `daily_reports_report_id_key`(`report_id`),
    INDEX `daily_reports_branch_id_idx`(`branch_id`),
    UNIQUE INDEX `daily_reports_staff_member_id_report_date_key`(`staff_member_id`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_ratings` (
    `id` VARCHAR(191) NOT NULL,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `staff_name` VARCHAR(191) NOT NULL,
    `system_role` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `rated_by` VARCHAR(191) NOT NULL,
    `review_period` VARCHAR(191) NULL,
    `review_quarter` VARCHAR(191) NULL,
    `review_year` INTEGER NULL,
    `overall_rating` DOUBLE NOT NULL,
    `task_quality` DOUBLE NULL,
    `communication` DOUBLE NULL,
    `punctuality` DOUBLE NULL,
    `teamwork` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `performance_ratings_branch_id_idx`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll` (
    `id` VARCHAR(191) NOT NULL,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `staff_name` VARCHAR(191) NOT NULL,
    `system_role` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `branch_id` VARCHAR(191) NULL,
    `month` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `base_salary` DOUBLE NOT NULL,
    `bonus` DOUBLE NULL DEFAULT 0,
    `deductions` DOUBLE NULL DEFAULT 0,
    `net_salary` DOUBLE NOT NULL,
    `payment_method` VARCHAR(191) NULL,
    `payment_status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `payment_date` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payroll_branch_id_idx`(`branch_id`),
    UNIQUE INDEX `payroll_staff_member_id_month_year_key`(`staff_member_id`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `branch_manager` VARCHAR(191) NULL,
    `staff_count` INTEGER NULL DEFAULT 0,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `established_date` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `branches_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
    `id` VARCHAR(191) NOT NULL,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `device_name` VARCHAR(191) NOT NULL,
    `device_type` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `mac_address` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `system_role` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `registered_date` DATETIME(3) NULL,
    `last_active` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_number` VARCHAR(191) NOT NULL,
    `client_name` VARCHAR(191) NULL,
    `client_email` VARCHAR(191) NULL,
    `service` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Draft',
    `payment_method` VARCHAR(191) NULL,
    `amount_usd` DOUBLE NOT NULL,
    `amount_bdt` DOUBLE NULL,
    `issue_date` DATETIME(3) NOT NULL,
    `due_date` DATETIME(3) NULL,
    `paid_date` DATETIME(3) NULL,
    `project_reference` VARCHAR(191) NULL,
    `invoice_url` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `portal_member_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_invoice_number_key`(`invoice_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `amount_usd` DOUBLE NOT NULL,
    `amount_bdt` DOUBLE NULL,
    `paid_by` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `payment_method` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `expense_date` DATETIME(3) NOT NULL,
    `approved_by` VARCHAR(191) NULL,
    `receipt_url` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_revenue` (
    `id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `total_revenue_usd` DOUBLE NOT NULL,
    `total_revenue_bdt` DOUBLE NULL,
    `total_expenses_usd` DOUBLE NULL,
    `net_profit_usd` DOUBLE NULL,
    `client_count` INTEGER NULL,
    `new_clients` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `monthly_revenue_month_year_key`(`month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exchange_rates` (
    `id` VARCHAR(191) NOT NULL,
    `usd_to_bdt` DOUBLE NOT NULL,
    `usd_to_aed` DOUBLE NULL,
    `bdt_to_aed` DOUBLE NULL,
    `effective_date` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `branch_id` VARCHAR(191) NULL,
    `created_by_id` VARCHAR(191) NULL,
    `updated_by_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_leads` (
    `id` VARCHAR(191) NOT NULL,
    `lead_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company` VARCHAR(191) NOT NULL,
    `contact_name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `linkedin_url` VARCHAR(191) NULL,
    `stage` ENUM('NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
    `source` VARCHAR(191) NULL,
    `service_interested` VARCHAR(191) NULL,
    `lost_reason` VARCHAR(191) NULL,
    `budget_usd` DOUBLE NULL,
    `estimated_value` DOUBLE NULL,
    `lead_score` INTEGER NULL,
    `follow_up_count` INTEGER NOT NULL DEFAULT 0,
    `owner` VARCHAR(191) NULL,
    `assigned_to` VARCHAR(191) NULL,
    `last_contact_date` DATETIME(3) NULL,
    `next_follow_up_date` DATETIME(3) NULL,
    `converted_to_client` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `crm_leads_lead_id_key`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_name` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'New',
    `payment_status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `amount_usd` DOUBLE NOT NULL,
    `assigned_to` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `order_date` DATETIME(3) NOT NULL,
    `deadline` DATETIME(3) NULL,
    `delivery_date` DATETIME(3) NULL,
    `delivery_link` VARCHAR(191) NULL,
    `invoice_reference` VARCHAR(191) NULL,
    `revision_count` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sales_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `client_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `total_spent_usd` DOUBLE NOT NULL DEFAULT 0,
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `first_order_date` DATETIME(3) NULL,
    `last_order_date` DATETIME(3) NULL,
    `assigned_manager` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `linkedin_url` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `client_accounts_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `base_price_usd` DOUBLE NULL,
    `price_bdt` DOUBLE NULL,
    `turnaround_days` INTEGER NULL,
    `short_description` VARCHAR(191) NULL,
    `full_description` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NULL,
    `meta_title` VARCHAR(191) NULL,
    `meta_description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `services_name_key`(`name`),
    UNIQUE INDEX `services_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_plans` (
    `id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price_usd` DOUBLE NOT NULL,
    `price_bdt` DOUBLE NULL,
    `delivery_days` INTEGER NULL,
    `features` JSON NOT NULL,
    `is_popular` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_plans_service_id_display_order_idx`(`service_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_segments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `params` JSON NOT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `client_segments_name_key`(`name`),
    INDEX `client_segments_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backlink_packages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `da_range` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `price_per_link` DOUBLE NOT NULL,
    `price_x10` DOUBLE NULL,
    `price_x50` DOUBLE NULL,
    `price_x100` DOUBLE NULL,
    `price_x1000` DOUBLE NULL,
    `turnaround_days` INTEGER NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `backlink_packages_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domains` (
    `id` VARCHAR(191) NOT NULL,
    `domain_id` INTEGER NOT NULL AUTO_INCREMENT,
    `domain_name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `lifecycle_status` VARCHAR(191) NOT NULL DEFAULT 'INCOMPLETE',
    `registrar` VARCHAR(191) NULL,
    `assigned_to` VARCHAR(191) NULL,
    `assigned_staff_id` VARCHAR(191) NULL,
    `expiry_date` DATETIME(3) NULL,
    `registration_date` DATETIME(3) NULL,
    `annual_renewal_cost` DOUBLE NULL,
    `domain_age_years` DOUBLE NULL,
    `da_score` INTEGER NULL,
    `dr_score` INTEGER NULL,
    `backlinks_count` INTEGER NULL,
    `indexed_pages` INTEGER NULL,
    `monthly_traffic` INTEGER NULL,
    `niche` VARCHAR(191) NULL,
    `hosting_server` VARCHAR(191) NULL,
    `ssl_status` VARCHAR(191) NULL,
    `nameservers` VARCHAR(191) NULL,
    `dns_records` VARCHAR(191) NULL,
    `whois_privacy` BOOLEAN NOT NULL DEFAULT false,
    `adsense_connected` BOOLEAN NOT NULL DEFAULT false,
    `adsense_publisher_id` VARCHAR(191) NULL,
    `analytics_id` VARCHAR(191) NULL,
    `search_console_verified` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `portal_member_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `domains_domain_id_key`(`domain_id`),
    UNIQUE INDEX `domains_domain_name_key`(`domain_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `ip_address` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `ram_gb` INTEGER NULL,
    `storage_gb` INTEGER NULL,
    `monthly_cost_usd` DOUBLE NULL,
    `renewal_date` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `servers_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `websites` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Live',
    `platform` VARCHAR(191) NULL,
    `cms` VARCHAR(191) NULL,
    `programming_lang` VARCHAR(191) NULL,
    `framework` VARCHAR(191) NULL,
    `hosted_on` VARCHAR(191) NULL,
    `domain_linked` VARCHAR(191) NULL,
    `domain_id` VARCHAR(191) NULL,
    `server_id` VARCHAR(191) NULL,
    `assigned_manager` VARCHAR(191) NULL,
    `assigned_staff_id` VARCHAR(191) NULL,
    `monthly_traffic` INTEGER NULL,
    `da_score` INTEGER NULL,
    `ssl_status` VARCHAR(191) NULL,
    `adsense_connected` BOOLEAN NOT NULL DEFAULT false,
    `adsense_earnings` DOUBLE NULL,
    `analytics_id` VARCHAR(191) NULL,
    `uptime_percent` DOUBLE NULL,
    `avg_load_time` DOUBLE NULL,
    `last_updated` DATETIME(3) NULL,
    `renewal_date` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `portal_member_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `websites_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_positions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Open',
    `employment_type` VARCHAR(191) NULL,
    `salary_min` DOUBLE NULL,
    `salary_max` DOUBLE NULL,
    `openings` INTEGER NOT NULL DEFAULT 1,
    `applications` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `posted_date` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `job_description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` VARCHAR(191) NOT NULL,
    `position_id` VARCHAR(191) NOT NULL,
    `applicant_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'New',
    `source` VARCHAR(191) NULL,
    `applied_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hired_date` DATETIME(3) NULL,
    `interview_date` DATETIME(3) NULL,
    `cv_url` VARCHAR(191) NULL,
    `portfolio_url` VARCHAR(191) NULL,
    `experience_years` DOUBLE NULL,
    `expected_salary` DOUBLE NULL,
    `interviewer_notes` VARCHAR(191) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `offer_salary` DOUBLE NULL,
    `score` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portal_members` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `avatar_url` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'Pending Verification', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'Pending Verification',
    `referral_code` VARCHAR(191) NOT NULL,
    `referred_by_id` VARCHAR(191) NULL,
    `wallet_balance` DOUBLE NOT NULL DEFAULT 0,
    `total_deposited` DOUBLE NOT NULL DEFAULT 0,
    `total_spent` DOUBLE NOT NULL DEFAULT 0,
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `total_referrals` INTEGER NOT NULL DEFAULT 0,
    `total_commission_earned` DOUBLE NOT NULL DEFAULT 0,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verify_token` VARCHAR(191) NULL,
    `reset_password_token` VARCHAR(191) NULL,
    `reset_token_expiry` DATETIME(3) NULL,
    `refresh_token` VARCHAR(191) NULL,
    `registration_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_date` DATETIME(3) NULL,
    `company_name` VARCHAR(191) NULL,
    `vat_id` VARCHAR(191) NULL,
    `company_website` VARCHAR(191) NULL,
    `industry` VARCHAR(191) NULL,
    `address_line_1` VARCHAR(191) NULL,
    `address_line_2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `zip` VARCHAR(191) NULL,
    `address_country` VARCHAR(191) NULL,
    `telegram` VARCHAR(191) NULL,
    `skype` VARCHAR(191) NULL,
    `preferred_contact` VARCHAR(191) NULL,
    `preferences` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `portal_members_email_key`(`email`),
    UNIQUE INDEX `portal_members_referral_code_key`(`referral_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portal_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` VARCHAR(191) NOT NULL,
    `member_email` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'DELIVERED', 'Revision Requested', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `payment_status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `amount_usd` DOUBLE NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `requirements` VARCHAR(191) NULL,
    `delivery_link` VARCHAR(191) NULL,
    `order_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deadline` DATETIME(3) NULL,
    `delivery_date` DATETIME(3) NULL,
    `revision_count` INTEGER NOT NULL DEFAULT 0,
    `revision_note` VARCHAR(191) NULL,
    `rating` DOUBLE NULL,
    `review_note` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `portal_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'Order Payment', 'Commission Credit', 'REFUND', 'PAYOUT', 'ADJUSTMENT') NOT NULL,
    `amount_usd` DOUBLE NOT NULL,
    `balance_after_usd` DOUBLE NOT NULL,
    `payment_method` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `reference` VARCHAR(191) NULL,
    `transaction_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `proof_url` VARCHAR(191) NULL,
    `approved_by` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commissions` (
    `id` VARCHAR(191) NOT NULL,
    `earner_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `referred_member_name` VARCHAR(191) NULL,
    `order_amount_usd` DOUBLE NOT NULL,
    `commission_rate` DOUBLE NOT NULL DEFAULT 0.20,
    `commission_amount_usd` DOUBLE NOT NULL,
    `status` ENUM('Pending Hold', 'AVAILABLE', 'Paid Out', 'CANCELLED', 'Fraud Hold') NOT NULL DEFAULT 'Pending Hold',
    `hold_release_date` DATETIME(3) NOT NULL,
    `payout_date` DATETIME(3) NULL,
    `payout_reference` VARCHAR(191) NULL,
    `fraud_flag` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payout_requests` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `member_email` VARCHAR(191) NOT NULL,
    `amount_usd` DOUBLE NOT NULL,
    `payment_method` ENUM('PAYONEER', 'USDT TRC20', 'BINANCE', 'Bank Transfer', 'CASH') NOT NULL,
    `payment_details` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requested_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_date` DATETIME(3) NULL,
    `processed_by` VARCHAR(191) NULL,
    `transaction_id` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apk_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `portal_member_id` VARCHAR(191) NOT NULL,
    `app_name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(191) NOT NULL DEFAULT 'free',
    `status` VARCHAR(191) NOT NULL DEFAULT 'queued',
    `apk_size_mb` DOUBLE NULL,
    `download_url` VARCHAR(191) NULL,
    `error_message` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `apk_jobs_portal_member_id_idx`(`portal_member_id`),
    INDEX `apk_jobs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portal_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `portal_member_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `user_agent` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `device_type` VARCHAR(191) NULL,
    `browser_name` VARCHAR(191) NULL,
    `os_name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_activity_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,

    INDEX `portal_sessions_portal_member_id_idx`(`portal_member_id`),
    INDEX `portal_sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portal_login_logs` (
    `id` VARCHAR(191) NOT NULL,
    `portal_member_id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `device_type` VARCHAR(191) NULL,
    `browser_name` VARCHAR(191) NULL,
    `os_name` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    `failure_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `portal_login_logs_portal_member_id_idx`(`portal_member_id`),
    INDEX `portal_login_logs_created_at_idx`(`created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `recipient_id` VARCHAR(191) NOT NULL,
    `recipient_type` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `metadata` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broadcasts` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `sent_by` VARCHAR(191) NOT NULL,
    `audience` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `is_urgent` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `ticket_number` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` VARCHAR(191) NULL,
    `member_email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Open',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'Medium',
    `assigned_to` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `support_tickets_ticket_number_key`(`ticket_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_replies` (
    `id` VARCHAR(191) NOT NULL,
    `ticket_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `author_name` VARCHAR(191) NOT NULL,
    `author_type` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `trigger` VARCHAR(191) NULL,
    `frequency` VARCHAR(191) NULL,
    `next_run_date` DATETIME(3) NULL,
    `last_run_date` DATETIME(3) NULL,
    `last_run_status` VARCHAR(191) NULL,
    `run_count` INTEGER NOT NULL DEFAULT 0,
    `affected_module` VARCHAR(191) NULL,
    `whatsapp_notify` BOOLEAN NOT NULL DEFAULT false,
    `error_log` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `automations_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plugins` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `current_version` VARCHAR(191) NOT NULL DEFAULT '1.0.0',
    `created_by_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plugins_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plugin_versions` (
    `id` VARCHAR(191) NOT NULL,
    `plugin_id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `changelog` VARCHAR(191) NULL,
    `php_file_content` TEXT NOT NULL,
    `is_latest` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `published_by_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `plugin_versions_plugin_id_version_key`(`plugin_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_keys` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `key_hash` VARCHAR(191) NOT NULL,
    `key_prefix` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'plugin_download',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by_id` VARCHAR(191) NOT NULL,
    `last_used_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `api_keys_key_hash_key`(`key_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plugin_activations` (
    `id` VARCHAR(191) NOT NULL,
    `plugin_id` VARCHAR(191) NOT NULL,
    `activated_by_type` VARCHAR(191) NOT NULL,
    `activated_by_id` VARCHAR(191) NOT NULL,
    `activated_by_name` VARCHAR(191) NULL,
    `site_url` VARCHAR(191) NOT NULL,
    `site_title` VARCHAR(191) NULL,
    `activated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_ping_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `plugin_activations_plugin_id_site_url_key`(`plugin_id`, `site_url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vigi_nvr_integrations` (
    `id` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `host` VARCHAR(191) NOT NULL,
    `port` INTEGER NOT NULL DEFAULT 20443,
    `username` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `password_encrypted` VARCHAR(191) NOT NULL,
    `tls_allow_insecure` BOOLEAN NOT NULL DEFAULT false,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `last_sync_at` DATETIME(3) NULL,
    `last_error` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vigi_nvr_integrations_branch_id_key`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camera_devices` (
    `id` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `branch_name` VARCHAR(191) NULL,
    `label` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `stream_url` VARCHAR(191) NULL,
    `rtsp_url` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'online',
    `resolution` VARCHAR(191) NULL DEFAULT '1080p',
    `fps` INTEGER NULL DEFAULT 25,
    `angle` VARCHAR(191) NULL,
    `has_audio` BOOLEAN NOT NULL DEFAULT false,
    `has_motion_detect` BOOLEAN NOT NULL DEFAULT true,
    `nvr_device` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `vigi_integration_id` VARCHAR(191) NULL,
    `vigi_channel` INTEGER NULL,
    `vigi_sync_key` VARCHAR(191) NULL,
    `last_ping_at` DATETIME(3) NULL,
    `last_motion_at` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `camera_devices_vigi_sync_key_key`(`vigi_sync_key`),
    INDEX `camera_devices_branch_id_idx`(`branch_id`),
    INDEX `camera_devices_vigi_integration_id_idx`(`vigi_integration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tool_runs` (
    `id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `tool_type` ENUM('SERP_TOP_100', 'DOMAIN_METRICS', 'BACKLINKS', 'KEYWORDS', 'FAVICON_ZIP') NOT NULL,
    `query_label` VARCHAR(2000) NOT NULL,
    `meta` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tool_runs_staff_id_created_at_idx`(`staff_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `workspace_id` VARCHAR(191) NULL,
    `use_case` ENUM('BLOG', 'SEO_BRIEF', 'TASK', 'REPORT', 'CHAT') NOT NULL,
    `title` VARCHAR(191) NULL,
    `provider` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `total_tokens` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ai_conversations_staff_id_created_at_idx`(`staff_id`, `created_at` DESC),
    INDEX `ai_conversations_workspace_id_created_at_idx`(`workspace_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `tokens_used` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_messages_conversation_id_idx`(`conversation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_usage` (
    `id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `input_tokens` INTEGER NOT NULL,
    `output_tokens` INTEGER NOT NULL,
    `use_case` ENUM('BLOG', 'SEO_BRIEF', 'TASK', 'REPORT', 'CHAT') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_usage_staff_id_created_at_idx`(`staff_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'string',
    `group` VARCHAR(191) NOT NULL DEFAULT 'general',
    `label` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actor_id` VARCHAR(191) NULL,
    `actor_role` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource_kind` VARCHAR(191) NOT NULL,
    `resource_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `system_audit_logs_resource_kind_resource_id_idx`(`resource_kind`, `resource_id`),
    INDEX `system_audit_logs_client_id_idx`(`client_id`),
    INDEX `system_audit_logs_actor_id_idx`(`actor_id`),
    INDEX `system_audit_logs_action_idx`(`action`),
    INDEX `system_audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspaces` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `context_notes` VARCHAR(191) NULL,
    `todos` VARCHAR(191) NULL,
    `conversation_id` VARCHAR(191) NULL,
    `github_repo_url` VARCHAR(191) NULL,
    `github_branch` VARCHAR(191) NULL,
    `ssh_enabled` BOOLEAN NOT NULL DEFAULT false,
    `settings` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `workspaces_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspace_skills` (
    `id` VARCHAR(191) NOT NULL,
    `workspace_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `content` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'custom',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `workspace_skills_workspace_id_idx`(`workspace_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `github_connections` (
    `id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `access_token` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `github_connections_staff_id_key`(`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `integration_connections` (
    `id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `access_token` VARCHAR(191) NOT NULL,
    `refresh_token` VARCHAR(191) NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `metadata` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `integration_connections_staff_id_idx`(`staff_id`),
    UNIQUE INDEX `integration_connections_staff_id_provider_key`(`staff_id`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspace_files` (
    `id` VARCHAR(191) NOT NULL,
    `workspace_id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `is_directory` BOOLEAN NOT NULL DEFAULT false,
    `mime_type` VARCHAR(191) NULL,
    `size` INTEGER NOT NULL DEFAULT 0,
    `content` VARCHAR(191) NULL,
    `storage_key` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `workspace_files_workspace_id_idx`(`workspace_id`),
    UNIQUE INDEX `workspace_files_workspace_id_path_key`(`workspace_id`, `path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `staff_member_id` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `email_accounts_address_key`(`address`),
    INDEX `email_accounts_staff_member_id_idx`(`staff_member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_messages` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `body_text` VARCHAR(191) NULL,
    `thread_id` VARCHAR(191) NULL,
    `in_reply_to_id` VARCHAR(191) NULL,
    `resend_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `is_read` BOOLEAN NOT NULL DEFAULT true,
    `is_starred` BOOLEAN NOT NULL DEFAULT false,
    `is_draft` BOOLEAN NOT NULL DEFAULT false,
    `folder` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_messages_account_id_idx`(`account_id`),
    INDEX `email_messages_thread_id_idx`(`thread_id`),
    INDEX `email_messages_folder_idx`(`folder`),
    INDEX `email_messages_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_recipients` (
    `id` VARCHAR(191) NOT NULL,
    `message_id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'to',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `is_starred` BOOLEAN NOT NULL DEFAULT false,
    `folder` VARCHAR(191) NOT NULL DEFAULT 'inbox',

    INDEX `email_recipients_message_id_idx`(`message_id`),
    INDEX `email_recipients_account_id_idx`(`account_id`),
    INDEX `email_recipients_address_idx`(`address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `message_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `storage_key` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,

    INDEX `email_attachments_message_id_idx`(`message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `staff_members` ADD CONSTRAINT `staff_members_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_documents` ADD CONSTRAINT `staff_documents_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assigned_member_id_fkey` FOREIGN KEY (`assigned_member_id`) REFERENCES `staff_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assigned_manager_id_fkey` FOREIGN KEY (`assigned_manager_id`) REFERENCES `staff_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_related_project_id_fkey` FOREIGN KEY (`related_project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_ratings` ADD CONSTRAINT `performance_ratings_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_ratings` ADD CONSTRAINT `performance_ratings_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_portal_member_id_fkey` FOREIGN KEY (`portal_member_id`) REFERENCES `portal_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `staff_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `staff_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_plans` ADD CONSTRAINT `service_plans_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domains` ADD CONSTRAINT `domains_portal_member_id_fkey` FOREIGN KEY (`portal_member_id`) REFERENCES `portal_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `websites` ADD CONSTRAINT `websites_portal_member_id_fkey` FOREIGN KEY (`portal_member_id`) REFERENCES `portal_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_position_id_fkey` FOREIGN KEY (`position_id`) REFERENCES `job_positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portal_members` ADD CONSTRAINT `portal_members_referred_by_id_fkey` FOREIGN KEY (`referred_by_id`) REFERENCES `portal_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portal_orders` ADD CONSTRAINT `portal_orders_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_earner_id_fkey` FOREIGN KEY (`earner_id`) REFERENCES `portal_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `portal_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_requests` ADD CONSTRAINT `payout_requests_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apk_jobs` ADD CONSTRAINT `apk_jobs_portal_member_id_fkey` FOREIGN KEY (`portal_member_id`) REFERENCES `portal_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portal_sessions` ADD CONSTRAINT `portal_sessions_portal_member_id_fkey` FOREIGN KEY (`portal_member_id`) REFERENCES `portal_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portal_login_logs` ADD CONSTRAINT `portal_login_logs_portal_member_id_fkey` FOREIGN KEY (`portal_member_id`) REFERENCES `portal_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_replies` ADD CONSTRAINT `ticket_replies_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plugin_versions` ADD CONSTRAINT `plugin_versions_plugin_id_fkey` FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plugin_activations` ADD CONSTRAINT `plugin_activations_plugin_id_fkey` FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vigi_nvr_integrations` ADD CONSTRAINT `vigi_nvr_integrations_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camera_devices` ADD CONSTRAINT `camera_devices_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camera_devices` ADD CONSTRAINT `camera_devices_vigi_integration_id_fkey` FOREIGN KEY (`vigi_integration_id`) REFERENCES `vigi_nvr_integrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_runs` ADD CONSTRAINT `tool_runs_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_conversations` ADD CONSTRAINT `ai_conversations_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_messages` ADD CONSTRAINT `ai_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_skills` ADD CONSTRAINT `workspace_skills_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_files` ADD CONSTRAINT `workspace_files_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_accounts` ADD CONSTRAINT `email_accounts_staff_member_id_fkey` FOREIGN KEY (`staff_member_id`) REFERENCES `staff_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `email_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_recipients` ADD CONSTRAINT `email_recipients_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `email_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_recipients` ADD CONSTRAINT `email_recipients_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `email_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_attachments` ADD CONSTRAINT `email_attachments_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `email_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

