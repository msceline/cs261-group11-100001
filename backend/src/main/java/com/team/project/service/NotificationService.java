package com.team.project.service;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.entity.Notification;
import com.team.project.repository.NotificationRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.UserRepository;

/** Users read only their own notifications and can notify only people they share a project with. */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository memberRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository,
                               ProjectMemberRepository memberRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    /** Sent by the system itself (e.g. reminders): no permission check. */
    public Notification createSystemNotification(String title, String message, String type, int userId) {
        Notification notification = new Notification(
                null, userRepository.getReferenceById(userId), title, message, type, false, null);
        return notificationRepository.save(notification);
    }

    /** Sent on behalf of a user: the recipient must exist and share a project with the sender. */
    public Notification createNotification(int senderId, String title, String message, String type, int userId) {
        requireLength(title, 150, "notificationTitle");
        requireLength(message, 500, "notificationMessage");
        requireLength(type, 50, "type");
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        if (senderId != userId && !shareProject(senderId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not share a project with this user");
        }
        return createSystemNotification(title.trim(), message.trim(), type.trim(), userId);
    }

    public List<Notification> getNotificationsByUserId(int requesterId, int userId) {
        if (requesterId != userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only read your own notifications");
        }
        return notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Notification> getNotificationById(int requesterId, int id) {
        Optional<Notification> notification = notificationRepository.findById(id);
        if (notification.isPresent() && notification.get().getUser().getUserId() != requesterId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only read your own notifications");
        }
        return notification;
    }

    /** Marks a notification as read. Only the owner can mark their own notification. */
    public Notification markAsRead(int requesterId, int id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (notification.getUser().getUserId() != requesterId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own notifications");
        }
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    private boolean shareProject(int userId, int otherUserId) {
        return memberRepository.findByUser_UserId(userId).stream()
                .anyMatch(m -> memberRepository.existsByProject_ProjectIdAndUser_UserId(m.getProjectId(), otherUserId));
    }

    private static void requireLength(String value, int max, String field) {
        if (value == null || value.isBlank() || value.trim().length() > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be 1-" + max + " characters");
        }
    }
}
