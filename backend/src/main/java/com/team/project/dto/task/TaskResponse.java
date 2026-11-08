package com.team.project.dto.task;

import java.time.LocalDateTime;

import com.team.project.entity.Task;

public record TaskResponse(int taskId, int projectId, String taskTitle, String taskDescription,
                           Integer assigneeId, String status, LocalDateTime dueDate) {

    public static TaskResponse from(Task t) {
        Integer assigneeId = t.getAssignee() == null ? null : t.getAssignee().getUserId();
        return new TaskResponse(t.getTaskId(), t.getProject().getProjectId(), t.getTitle(),
                t.getTaskDescription(), assigneeId, t.getStatus(), t.getDueDate());
    }
}
