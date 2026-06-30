-- Phase 1 (management/admin): additive query indexes only.
-- Safe migration: no table/column drops or type changes.

-- staff_members
CREATE INDEX `staff_members_status_created_at_idx` ON `staff_members`(`status`, `created_at`);
CREATE INDEX `staff_members_branch_id_status_idx` ON `staff_members`(`branch_id`, `status`);
CREATE INDEX `staff_members_system_role_status_idx` ON `staff_members`(`system_role`, `status`);

-- tasks
CREATE INDEX `tasks_assigned_member_id_priority_deadline_idx` ON `tasks`(`assigned_member_id`, `priority`, `deadline`);
CREATE INDEX `tasks_status_priority_deadline_idx` ON `tasks`(`status`, `priority`, `deadline`);
CREATE INDEX `tasks_approval_status_updated_at_idx` ON `tasks`(`approval_status`, `updated_at`);

-- attendance
CREATE INDEX `attendance_branch_id_date_idx` ON `attendance`(`branch_id`, `date`);
CREATE INDEX `attendance_status_date_idx` ON `attendance`(`status`, `date`);

-- leave_requests
CREATE INDEX `leave_requests_staff_member_id_created_at_idx` ON `leave_requests`(`staff_member_id`, `created_at`);
CREATE INDEX `leave_requests_status_created_at_idx` ON `leave_requests`(`status`, `created_at`);

-- daily_reports
CREATE INDEX `daily_reports_branch_id_report_date_idx` ON `daily_reports`(`branch_id`, `report_date`);
CREATE INDEX `daily_reports_status_report_date_idx` ON `daily_reports`(`status`, `report_date`);

-- payroll
CREATE INDEX `payroll_year_month_idx` ON `payroll`(`year`, `month`);
CREATE INDEX `payroll_branch_id_year_month_idx` ON `payroll`(`branch_id`, `year`, `month`);

-- crm_leads
CREATE INDEX `crm_leads_stage_idx` ON `crm_leads`(`stage`);
CREATE INDEX `crm_leads_updated_at_idx` ON `crm_leads`(`updated_at`);

-- sales_orders
CREATE INDEX `sales_orders_created_at_idx` ON `sales_orders`(`created_at`);
CREATE INDEX `sales_orders_status_created_at_idx` ON `sales_orders`(`status`, `created_at`);

-- portal_members (shared table used by management admin overview)
CREATE INDEX `portal_members_status_idx` ON `portal_members`(`status`);
CREATE INDEX `portal_members_created_at_idx` ON `portal_members`(`created_at`);
CREATE INDEX `portal_members_registration_date_idx` ON `portal_members`(`registration_date`);

-- portal_orders (shared table used by management admin orders/overview)
CREATE INDEX `portal_orders_status_idx` ON `portal_orders`(`status`);
CREATE INDEX `portal_orders_order_date_idx` ON `portal_orders`(`order_date`);
CREATE INDEX `portal_orders_member_id_order_date_idx` ON `portal_orders`(`member_id`, `order_date`);

-- support_tickets
CREATE INDEX `support_tickets_status_updated_at_idx` ON `support_tickets`(`status`, `updated_at`);
