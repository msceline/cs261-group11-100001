-- ==============================================================================
-- File: project.sql
-- Description: โครงสร้างตาราง projects และข้อมูลจำลอง (Sprint 1)
-- Target DBMS: Microsoft SQL Server 2022
-- ==============================================================================

USE [master];
GO

-- ==============================================================================
-- [ส่วนที่ 1] โครงสร้างตาราง (DDL Reference)
-- ==============================================================================
/*
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='projects' AND xtype='U')
BEGIN
    CREATE TABLE [projects] (
        [project_id] INT IDENTITY(1,1) PRIMARY KEY,
        [project_name] NVARCHAR(100) NOT NULL,          -- ชื่อกลุ่มโปรเจกต์
        [subject_id] VARCHAR(20) NOT NULL,              -- รหัสวิชา (เช่น CS261)
        [host_id] INT NOT NULL,                         -- FK เชื่อมกับ users.user_id
        [progress] INT NOT NULL DEFAULT 0,              -- ความคืบหน้า ค่าเริ่มต้น 0
        [created_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Project_Host FOREIGN KEY ([host_id]) REFERENCES [users]([user_id])
    );
END
GO
*/

-- ==============================================================================
-- [ส่วนที่ 2] ข้อมูลเริ่มต้นจำลอง (Mock / Seed Data)
-- ==============================================================================

IF NOT EXISTS (SELECT 1 FROM [projects] WHERE [project_name] = N'TU-WorkSpace-Group11')
BEGIN
    INSERT INTO [projects] ([project_name], [subject_id], [host_id], [progress], [created_at])
    VALUES (
        N'TU-WorkSpace-Group11',
        'CS261',
        1,
        35,
        '2026-02-01 10:00:00'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [projects] WHERE [project_name] = N'Campus Event Planner')
BEGIN
    INSERT INTO [projects] ([project_name], [subject_id], [host_id], [progress], [created_at])
    VALUES (
        N'Campus Event Planner',
        'CS284',
        2,
        10,
        '2026-02-05 13:30:00'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [projects] WHERE [project_name] = N'AI Study Hub')
BEGIN
    INSERT INTO [projects] ([project_name], [subject_id], [host_id], [progress], [created_at])
    VALUES (
        N'AI Study Hub',
        'CS300',
        1,
        0,
        '2026-02-10 09:15:00'
    );
END
GO

-- ==============================================================================
-- [ส่วนที่ 3] ตรวจสอบข้อมูล (รวม Join กับตาราง users)
-- ==============================================================================
SELECT 
    p.[project_id],
    p.[project_name],
    p.[subject_id],
    u.[display_name] AS host_name,
    p.[progress] AS [progress_percent],
    p.[created_at]
FROM [projects] p
JOIN [users] u ON p.[host_id] = u.[user_id];
GO
