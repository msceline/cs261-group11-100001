package com.team.project.dto.task;

import java.time.LocalDateTime;

/** assigneeId and status are optional; status defaults to "todo". projectId is ignored when updating. */
public record CreateTaskRequest(int projectId, String taskTitle, String taskDescription,
                                Integer assigneeId, String status, LocalDateTime dueDate) {}
