package com.team.project.dto.progress;

import java.util.List;

/** Overall project progress and per-member breakdown. */
public record ProjectProgressResponse(int projectId,
                                      int projectProgress,
                                      int totalTasks,
                                      int completedTasks,
                                      List<MemberProgressResponse> members) {

    public static ProjectProgressResponse of(int projectId, int totalTasks, int completedTasks,
                                             List<MemberProgressResponse> members) {
        return new ProjectProgressResponse(
                projectId,
                calculatePercentage(completedTasks, totalTasks),
                totalTasks,
                completedTasks,
                members
        );
    }

    /** Returns completed / total as an integer percentage (rounded to nearest integer), or 0 when total is 0. */
    public static int calculatePercentage(long completedTasks, long totalTasks) {
        if (totalTasks <= 0 || completedTasks <= 0) {
            return 0;
        }
        return (int) Math.round((completedTasks * 100.0) / totalTasks);
    }
}
