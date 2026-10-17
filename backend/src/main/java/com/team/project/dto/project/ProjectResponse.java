package com.team.project.dto.project;

import java.time.LocalDateTime;

import com.team.project.entity.Project;

public record ProjectResponse(int projectId, String projectName, String subjectCode,
                              int hostId, int progress, LocalDateTime createdAt) {

    public static ProjectResponse from(Project p) {
        return new ProjectResponse(p.getProjectId(), p.getProjectName(),
                p.getSubjectId(), p.getHost().getUserId(), p.getProgress(), p.getCreatedAt());
    }
}
