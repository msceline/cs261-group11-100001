package com.team.project.dto.member;

import com.team.project.entity.Project;

/** A pending invitation to join a project. */
public record InvitationResponse(int projectId, String projectName, String subjectCode, int hostId) {

    public static InvitationResponse from(Project p) {
        return new InvitationResponse(p.getProjectId(), p.getProjectName(), p.getSubjectId(),
                p.getHost().getUserId());
    }
}
