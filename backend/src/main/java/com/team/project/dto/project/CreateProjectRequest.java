package com.team.project.dto.project;

import java.time.LocalDate;

/** createdAt is the date picked from the calendar (yyyy-MM-dd). */
public record CreateProjectRequest(String projectName, String subjectCode, LocalDate createdAt) {}
