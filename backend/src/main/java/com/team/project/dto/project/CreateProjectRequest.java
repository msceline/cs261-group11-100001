package com.team.project.dto.project;

import java.time.LocalDate;

/** createdAt is the date picked from the calendar (yyyy-MM-dd), or null for current date/time. */
public record CreateProjectRequest(String projectName, String subjectCode, LocalDate createdAt, LocalDate dueDate) {
    public CreateProjectRequest(String projectName, String subjectCode, LocalDate createdAt) {
        this(projectName, subjectCode, createdAt, null);
    }
}
