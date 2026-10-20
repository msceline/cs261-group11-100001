-- ==============================================================================
-- File: init.sql (Master Seed Script - Sprint 1)
-- Description: รันสคริปต์เพิ่มข้อมูลจำลอง (Mock Data) ครบทุกตารางตาม Schema Sprint 1
-- Target DBMS: Microsoft SQL Server 2022
-- ==============================================================================

USE [master];
GO

PRINT '>>> เริ่มต้นใส่ข้อมูลจำลอง (Mock Data) สำหรับ TU WorkSpace (Sprint 1)...';

-- ------------------------------------------------------------------------------
-- 1. Users (ตารางผู้ใช้)
-- ------------------------------------------------------------------------------
PRINT '1. เพิ่มข้อมูล Users...';

IF NOT EXISTS (SELECT 1 FROM [users] WHERE [tu_id] = '6609650001')
    INSERT INTO [users] ([tu_id], [role], [display_name], [email], [password], [created_at])
    VALUES ('6609650001', 'student', N'Somchai Jaidee', 'somchai.jai@dome.tu.ac.th', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '2026-01-10 09:00:00');

IF NOT EXISTS (SELECT 1 FROM [users] WHERE [tu_id] = '6609650002')
    INSERT INTO [users] ([tu_id], [role], [display_name], [email], [password], [created_at])
    VALUES ('6609650002', 'student', N'Somying Rakdee', 'somying.rak@dome.tu.ac.th', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '2026-01-11 10:30:00');

IF NOT EXISTS (SELECT 1 FROM [users] WHERE [tu_id] = '6609650003')
    INSERT INTO [users] ([tu_id], [role], [display_name], [email], [password], [created_at])
    VALUES ('6609650003', 'student', N'Somchart Meesuk', 'somchart.mee@dome.tu.ac.th', NULL, '2026-01-12 14:15:00');

IF NOT EXISTS (SELECT 1 FROM [users] WHERE [tu_id] = 'T00001')
    INSERT INTO [users] ([tu_id], [role], [display_name], [email], [password], [created_at])
    VALUES ('T00001', 'teacher', N'Dr. Kanya Srichan', 'kanya.sri@tu.ac.th', NULL, '2026-01-05 08:30:00');
GO

-- ------------------------------------------------------------------------------
-- 2. Projects (ตารางโปรเจกต์)
-- ------------------------------------------------------------------------------
PRINT '2. เพิ่มข้อมูล Projects...';

IF NOT EXISTS (SELECT 1 FROM [projects] WHERE [project_name] = N'TU-WorkSpace-Group11')
    INSERT INTO [projects] ([project_name], [subject_id], [host_id], [progress], [created_at])
    VALUES (N'TU-WorkSpace-Group11', 'CS261', 1, 35, '2026-02-01 10:00:00');

IF NOT EXISTS (SELECT 1 FROM [projects] WHERE [project_name] = N'Campus Event Planner')
    INSERT INTO [projects] ([project_name], [subject_id], [host_id], [progress], [created_at])
    VALUES (N'Campus Event Planner', 'CS284', 2, 10, '2026-02-05 13:30:00');

IF NOT EXISTS (SELECT 1 FROM [projects] WHERE [project_name] = N'AI Study Hub')
    INSERT INTO [projects] ([project_name], [subject_id], [host_id], [progress], [created_at])
    VALUES (N'AI Study Hub', 'CS300', 1, 0, '2026-02-10 09:15:00');
GO

-- ------------------------------------------------------------------------------
-- 3. Project Members (ตารางสมาชิกในโปรเจกต์)
-- ------------------------------------------------------------------------------
PRINT '3. เพิ่มข้อมูล Project Members...';

IF NOT EXISTS (SELECT 1 FROM [project_members] WHERE [project_id] = 1 AND [user_id] = 1)
    INSERT INTO [project_members] ([project_id], [user_id], [role_in_project], [joined_at]) VALUES (1, 1, 'host', '2026-02-01 10:00:00');

IF NOT EXISTS (SELECT 1 FROM [project_members] WHERE [project_id] = 1 AND [user_id] = 2)
    INSERT INTO [project_members] ([project_id], [user_id], [role_in_project], [joined_at]) VALUES (1, 2, 'member', '2026-02-01 10:15:00');

IF NOT EXISTS (SELECT 1 FROM [project_members] WHERE [project_id] = 1 AND [user_id] = 3)
    INSERT INTO [project_members] ([project_id], [user_id], [role_in_project], [joined_at]) VALUES (1, 3, 'member', '2026-02-01 10:30:00');

IF NOT EXISTS (SELECT 1 FROM [project_members] WHERE [project_id] = 1 AND [user_id] = 4)
    INSERT INTO [project_members] ([project_id], [user_id], [role_in_project], [joined_at]) VALUES (1, 4, 'visitor', '2026-02-02 08:30:00');

IF NOT EXISTS (SELECT 1 FROM [project_members] WHERE [project_id] = 2 AND [user_id] = 2)
    INSERT INTO [project_members] ([project_id], [user_id], [role_in_project], [joined_at]) VALUES (2, 2, 'host', '2026-02-05 13:30:00');

IF NOT EXISTS (SELECT 1 FROM [project_members] WHERE [project_id] = 2 AND [user_id] = 1)
    INSERT INTO [project_members] ([project_id], [user_id], [role_in_project], [joined_at]) VALUES (2, 1, 'member', '2026-02-05 14:00:00');
GO

-- ------------------------------------------------------------------------------
-- 4. Tasks (ตารางงาน/ภารกิจ)
-- ------------------------------------------------------------------------------
PRINT '4. เพิ่มข้อมูล Tasks...';

IF NOT EXISTS (SELECT 1 FROM [tasks] WHERE [title] = N'ออกแบบ ER Diagram และ Schema')
    INSERT INTO [tasks] ([project_id], [title], [assignee_id], [status], [due_date], [task_description], [created_at])
    VALUES (1, N'ออกแบบ ER Diagram และ Schema', 1, 'done', '2026-02-15 23:59:00', N'กำหนดตาราง users, projects, project_members, tasks, notifications', '2026-02-02 09:00:00');

IF NOT EXISTS (SELECT 1 FROM [tasks] WHERE [title] = N'พัฒนาระบบ Authentication และ JWT')
    INSERT INTO [tasks] ([project_id], [title], [assignee_id], [status], [due_date], [task_description], [created_at])
    VALUES (1, N'พัฒนาระบบ Authentication และ JWT', 2, 'doing', '2026-02-20 23:59:00', N'เชื่อมต่อระบบ Login และสร้าง Token สำหรับตรวจสอบสิทธิ์', '2026-02-05 10:00:00');

IF NOT EXISTS (SELECT 1 FROM [tasks] WHERE [title] = N'สร้างหน้า Dashboard แสดงรายการงาน')
    INSERT INTO [tasks] ([project_id], [title], [assignee_id], [status], [due_date], [task_description], [created_at])
    VALUES (1, N'สร้างหน้า Dashboard แสดงรายการงาน', 3, 'todo', '2026-02-28 23:59:00', N'ทำหน้า UI สำหรับดู Kanban Board ของแต่ละโปรเจกต์', '2026-02-06 11:30:00');

IF NOT EXISTS (SELECT 1 FROM [tasks] WHERE [title] = N'เตรียมสไลด์นำเสนอ Sprint 1')
    INSERT INTO [tasks] ([project_id], [title], [assignee_id], [status], [due_date], [task_description], [created_at])
    VALUES (1, N'เตรียมสไลด์นำเสนอ Sprint 1', NULL, 'todo', '2026-03-01 12:00:00', N'สรุปภาพรวมความคืบหน้าของ Sprint 1 เพื่อนำเสนออาจารย์', '2026-02-07 14:00:00');
GO

-- ------------------------------------------------------------------------------
-- 5. Notifications (ตารางการแจ้งเตือน)
-- ------------------------------------------------------------------------------
PRINT '5. เพิ่มข้อมูล Notifications...';

IF NOT EXISTS (SELECT 1 FROM [notifications] WHERE [user_id] = 2 AND [title] = N'คุณได้รับมอบหมายงานใหม่')
    INSERT INTO [notifications] ([user_id], [title], [message], [type], [is_read], [created_at])
    VALUES (2, N'คุณได้รับมอบหมายงานใหม่', N'Somchai ได้มอบหมายงาน "พัฒนาระบบ Authentication และ JWT" ให้คุณ', 'task_assigned', 0, '2026-02-05 10:05:00');

IF NOT EXISTS (SELECT 1 FROM [notifications] WHERE [user_id] = 3 AND [title] = N'คำเชิญเข้าร่วมกลุ่มโปรเจกต์')
    INSERT INTO [notifications] ([user_id], [title], [message], [type], [is_read], [created_at])
    VALUES (3, N'คำเชิญเข้าร่วมกลุ่มโปรเจกต์', N'คุณได้รับคำเชิญให้เข้าร่วมกลุ่มโปรเจกต์ "TU-WorkSpace-Group11"', 'invite', 1, '2026-02-01 10:30:00');

IF NOT EXISTS (SELECT 1 FROM [notifications] WHERE [user_id] = 4 AND [title] = N'การเข้าตรวจเยี่ยมโปรเจกต์')
    INSERT INTO [notifications] ([user_id], [title], [message], [type], [is_read], [created_at])
    VALUES (4, N'การเข้าตรวจเยี่ยมโปรเจกต์', N'คุณได้รับสิทธิ์เข้าดู (visitor) ในโปรเจกต์ "TU-WorkSpace-Group11"', 'invite', 0, '2026-02-02 08:35:00');
GO

PRINT '>>> ใส่ข้อมูลจำลอง (Mock Data) ครบทุกตารางตาม Schema Sprint 1 เรียบร้อยแล้ว!';
GO
