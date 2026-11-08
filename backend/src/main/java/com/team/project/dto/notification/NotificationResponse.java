package com.team.project.dto.notification;

import java.time.LocalDateTime;

import com.team.project.entity.Notification;

public record NotificationResponse(int id, int userId, String title, String message, String type,
                                   boolean isRead, LocalDateTime createdAt) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getUser().getUserId(), n.getTitle(), n.getMessage(),
                n.getType(), n.getIsRead(), n.getCreatedAt());
    }
}
