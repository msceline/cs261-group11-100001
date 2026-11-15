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

    /** Returns completed / total as an integer percentage (rounded down), or 0 when total is 0. */
    public static int calculatePercentage(int completedTasks, int totalTasks) {
        if (totalTasks <= 0 || completedTasks <= 0) {
            return 0;
        }
        return (int) ((long) completedTasks * 100 / totalTasks);
    }
}
