package com.team.project.dto.project;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.team.project.entity.Project;

public record ProjectResponse(int projectId, String projectName, String subjectCode,
                              int hostId, int progress, LocalDateTime createdAt, LocalDate dueDate) {

    public ProjectResponse(int projectId, String projectName, String subjectCode,
                           int hostId, int progress, LocalDateTime createdAt) {
        this(projectId, projectName, subjectCode, hostId, progress, createdAt, null);
    }

    public static ProjectResponse from(Project p) {
        return new ProjectResponse(p.getProjectId(), p.getProjectName(),
                p.getSubjectId(), p.getHost().getUserId(), p.getProgress(), p.getCreatedAt(), p.getDueDate());
    }
}
