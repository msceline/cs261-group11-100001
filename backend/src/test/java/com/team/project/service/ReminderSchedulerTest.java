package com.team.project.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.team.project.entity.Task;
import com.team.project.entity.User;

/**
 * The first check looks back one minute, so a task due in 10 minutes minus 30 seconds
 * has its "10 minutes" reminder time inside that window.
 */
class ReminderSchedulerTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Bangkok");

    private TaskService taskService;
    private NotificationService notificationService;
    private ReminderScheduler scheduler;
    private User assignee;

    @BeforeEach
    void setUp() {
        assignee = new User(2, "6609650002", "student", "Two", "t@x.com", "hash", null);
        taskService = mock(TaskService.class);
        notificationService = mock(NotificationService.class);
        scheduler = new ReminderScheduler(taskService, notificationService);
    }

    private static Task task(int id, User assignee, String status, LocalDateTime dueDate) {
        return new Task(id, null, "Report", assignee, status, dueDate, null, null);
    }

    private static LocalDateTime tenMinuteReminderDue() {
        return LocalDateTime.now(ZONE).plusMinutes(10).minusSeconds(30);
    }

    private void runWith(Task... tasks) {
        when(taskService.getAllTasks()).thenReturn(List.of(tasks));
        scheduler.checkReminders();
    }

    @Test
    void sendsTenMinuteReminderToAssignee() {
        runWith(task(1, assignee, "todo", tenMinuteReminderDue()));

        verify(notificationService).createSystemNotification(
                eq("Task deadline in 10 minutes"), contains("Report"), eq("TASK_REMINDER"), eq(2));
    }

    @Test
    void doesNotSendSameReminderTwice() {
        when(taskService.getAllTasks()).thenReturn(List.of(task(1, assignee, "todo", tenMinuteReminderDue())));

        scheduler.checkReminders();
        scheduler.checkReminders();

        verify(notificationService, times(1)).createSystemNotification(anyString(), anyString(), anyString(), anyInt());
    }

    @Test
    void skipsDoneTasks() {
        runWith(task(1, assignee, "done", tenMinuteReminderDue()));

        verify(notificationService, never()).createSystemNotification(any(), any(), any(), anyInt());
    }

    @Test
    void skipsTasksWithoutAssigneeOrDueDate() {
        runWith(task(1, null, "todo", tenMinuteReminderDue()), task(2, assignee, "todo", null));

        verify(notificationService, never()).createSystemNotification(any(), any(), any(), anyInt());
    }

    @Test
    void skipsOverdueTasks() {
        runWith(task(1, assignee, "todo", LocalDateTime.now(ZONE).minusHours(1)));

        verify(notificationService, never()).createSystemNotification(any(), any(), any(), anyInt());
    }

    @Test
    void skipsTasksDueFarInTheFuture() {
        runWith(task(1, assignee, "todo", LocalDateTime.now(ZONE).plusDays(7).withHour(18)));

        verify(notificationService, never()).createSystemNotification(any(), any(), any(), anyInt());
    }
}
