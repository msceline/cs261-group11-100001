package com.team.project.dto.progress;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.User;

/** Per-member task progress summary within a project. */
public record MemberProgressResponse(int userId,
                                     @JsonProperty("tu_id") String tu_id,
                                     String displayName,
                                     String roleInProject,
                                     int totalTasks,
                                     int completedTasks,
                                     int progressPercentage) {

    public static MemberProgressResponse from(ProjectMember member, User user, int totalTasks, int completedTasks) {
        return new MemberProgressResponse(
                user.getUserId(),
                user.getTu_id(),
                user.getDisplayName(),
                member.getRoleInProject(),
                totalTasks,
                completedTasks,
                ProjectProgressResponse.calculatePercentage(completedTasks, totalTasks)
        );
    }
}
