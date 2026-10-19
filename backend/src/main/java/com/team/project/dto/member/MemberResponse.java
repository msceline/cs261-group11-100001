package com.team.project.dto.member;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.User;

public record MemberResponse(int id,
                             int projectId,
                             int userId,
                             String roleInProject,
                             @JsonProperty("tu_id") String tu_id,
                             String displayName) {

    public static MemberResponse from(ProjectMember m, User u) {
        return new MemberResponse(m.getId(), m.getProjectId(), m.getUserId(), m.getRoleInProject(),
                u.getTu_id(), u.getDisplayName());
    }

    public String tuId() {
        return tu_id;
    }

    public String studentId() {
        return tu_id;
    }
}
