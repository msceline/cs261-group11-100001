package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.entity.Notification;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.User;
import com.team.project.repository.NotificationRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.UserRepository;

/** Fixture: users 1 and 2 share project 1; user 3 exists but shares no project; user 999 does not exist. */
class NotificationServiceTest {

    private NotificationRepository notificationRepository;
    private NotificationService notificationService;
    private User user2;

    private static User user(int id) {
        return new User(id, "660965000" + id, "student", "User " + id, "u" + id + "@x.com", "hash", null);
    }

    @BeforeEach
    void setUp() {
        User user1 = user(1);
        user2 = user(2);
        User user3 = user(3);
        Project project1 = new Project(1, "P1", "CS261", user1, 0, null);

        notificationRepository = mock(NotificationRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ProjectMemberRepository memberRepository = mock(ProjectMemberRepository.class);

        for (User u : new User[] {user1, user2, user3}) {
            when(userRepository.existsById(u.getUserId())).thenReturn(true);
            when(userRepository.getReferenceById(u.getUserId())).thenReturn(u);
        }
        when(memberRepository.findByUser_UserId(1))
                .thenReturn(List.of(new ProjectMember(1, user1, project1, "host", null)));
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2)).thenReturn(true);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        notificationService = new NotificationService(notificationRepository, userRepository, memberRepository);
    }

    private void assertCreateFails(HttpStatus expected, int senderId, String title, int userId) {
        assertEquals(expected, HttpStatus.valueOf(assertThrows(ResponseStatusException.class,
                () -> notificationService.createNotification(senderId, title, "Message", "invite", userId))
                .getStatusCode().value()));
        verify(notificationRepository, never()).save(any());
    }

    // ---------- create ----------

    @Test
    void systemNotificationIsSavedUnreadForUser() {
        Notification created = notificationService.createSystemNotification("Title", "Message", "TASK_REMINDER", 2);

        assertEquals("Title", created.getTitle());
        assertEquals("Message", created.getMessage());
        assertEquals("TASK_REMINDER", created.getType());
        assertEquals(user2, created.getUser());
        assertFalse(created.getIsRead());
    }

    @Test
    void userCanNotifyPeopleSharingAProject() {
        Notification created = notificationService.createNotification(1, " Title ", "Message", "invite", 2);

        assertEquals("Title", created.getTitle());
        assertEquals(user2, created.getUser());
        assertFalse(created.getIsRead());
    }

    @Test
    void userCanNotifyThemselves() {
        assertEquals(1, notificationService.createNotification(1, "Title", "Message", "note", 1)
                .getUser().getUserId());
    }

    @Test
    void createIsForbiddenForUsersSharingNoProject() {
        assertCreateFails(HttpStatus.FORBIDDEN, 1, "Title", 3);
    }

    @Test
    void createRejectsUnknownRecipientAndInvalidText() {
        assertCreateFails(HttpStatus.NOT_FOUND, 1, "Title", 999);
        assertCreateFails(HttpStatus.BAD_REQUEST, 1, "  ", 2);
        assertCreateFails(HttpStatus.BAD_REQUEST, 1, null, 2);
        assertCreateFails(HttpStatus.BAD_REQUEST, 1, "x".repeat(151), 2);
    }

    // ---------- read ----------

    @Test
    void userReadsOwnNotificationsNewestFirst() {
        Notification newer = new Notification(2, user2, "New", "m", "t", false, LocalDateTime.of(2026, 2, 1, 0, 0));
        Notification older = new Notification(1, user2, "Old", "m", "t", true, LocalDateTime.of(2026, 1, 1, 0, 0));
        when(notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(2)).thenReturn(List.of(newer, older));

        assertEquals(List.of(newer, older), notificationService.getNotificationsByUserId(2, 2));
    }

    @Test
    void userCannotReadSomeoneElsesNotifications() {
        assertEquals(HttpStatus.FORBIDDEN, HttpStatus.valueOf(assertThrows(ResponseStatusException.class,
                () -> notificationService.getNotificationsByUserId(1, 2)).getStatusCode().value()));
    }

    @Test
    void getByIdReturnsOwnNotificationOrEmpty() {
        Notification n = new Notification(1, user2, "T", "m", "t", false, null);
        when(notificationRepository.findById(1)).thenReturn(Optional.of(n));

        assertEquals(n, notificationService.getNotificationById(2, 1).orElseThrow());
        assertTrue(notificationService.getNotificationById(2, 999).isEmpty());
    }

    @Test
    void getByIdIsForbiddenForOtherUsers() {
        Notification n = new Notification(1, user2, "T", "m", "t", false, null);
        when(notificationRepository.findById(1)).thenReturn(Optional.of(n));

        assertEquals(HttpStatus.FORBIDDEN, HttpStatus.valueOf(assertThrows(ResponseStatusException.class,
                () -> notificationService.getNotificationById(1, 1)).getStatusCode().value()));
    }

    // ---------- markAsRead ----------

    @Test
    void markAsReadUpdatesNotificationToRead() {
        Notification n = new Notification(1, user2, "T", "m", "t", false, null);
        when(notificationRepository.findById(1)).thenReturn(Optional.of(n));

        Notification updated = notificationService.markAsRead(2, 1);

        assertTrue(updated.getIsRead());
        verify(notificationRepository).save(n);
    }

    @Test
    void markAsReadIsForbiddenForOtherUser() {
        Notification n = new Notification(1, user2, "T", "m", "t", false, null);
        when(notificationRepository.findById(1)).thenReturn(Optional.of(n));

        assertEquals(HttpStatus.FORBIDDEN, HttpStatus.valueOf(assertThrows(ResponseStatusException.class,
                () -> notificationService.markAsRead(1, 1)).getStatusCode().value()));
    }

    @Test
    void markAsReadUnknownReturnsNotFound() {
        when(notificationRepository.findById(999)).thenReturn(Optional.empty());

        assertEquals(HttpStatus.NOT_FOUND, HttpStatus.valueOf(assertThrows(ResponseStatusException.class,
                () -> notificationService.markAsRead(2, 999)).getStatusCode().value()));
    }
}
