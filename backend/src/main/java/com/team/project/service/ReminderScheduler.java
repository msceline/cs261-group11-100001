package com.team.project.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.team.project.entity.Task;

@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);
    private static final ZoneId ZONE = ZoneId.of("Asia/Bangkok");
    private static final LocalTime DAILY_REMINDER_TIME = LocalTime.of(9, 0);
    private static final String DONE_STATUS = "done";

    private final TaskService taskService;
    private final NotificationService notificationService;

    private final Set<String> sentEvents = new HashSet<>();
    private LocalDateTime lastCheckAt;

    public ReminderScheduler(TaskService taskService, NotificationService notificationService) {
        this.taskService = taskService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkReminders() {
        LocalDateTime now = LocalDateTime.now(ZONE);
        LocalDateTime previousCheck = lastCheckAt == null ? now.minusMinutes(1) : lastCheckAt;
        lastCheckAt = now;

        for (Task task : taskService.getAllTasks()) {
            LocalDateTime dueDate = task.getDueDate();
            if (dueDate == null || task.getAssignee() == null
                    || DONE_STATUS.equalsIgnoreCase(task.getStatus()) || !now.isBefore(dueDate)) {
                continue;
            }

            LocalDateTime dailyTime = LocalDateTime.of(now.toLocalDate(), DAILY_REMINDER_TIME);
            if (dueDate.isAfter(dailyTime)) {
                sendIfDue(task, "DAILY", dailyTime, previousCheck, now, "Daily task reminder");
            }
            sendIfDue(task, "1_HOUR", dueDate.minusMinutes(60), previousCheck, now, "Task deadline in 1 hour");
            sendIfDue(task, "30_MINUTES", dueDate.minusMinutes(30), previousCheck, now, "Task deadline in 30 minutes");
            sendIfDue(task, "10_MINUTES", dueDate.minusMinutes(10), previousCheck, now, "Task deadline in 10 minutes");
        }
    }

    /** Sends the reminder once, when its time falls inside the window since the previous check. */
    private void sendIfDue(Task task, String eventType, LocalDateTime reminderTime,
                           LocalDateTime previousCheck, LocalDateTime now, String title) {
        if (reminderTime.isBefore(previousCheck) || reminderTime.isAfter(now)) {
            return;
        }
        String eventKey = task.getTaskId() + "_" + eventType + "_" + reminderTime;
        if (!sentEvents.add(eventKey)) {
            return;
        }

        int userId = task.getAssignee().getUserId();
        notificationService.createSystemNotification(title,
                "Task \"" + task.getTitle() + "\" is due on " + task.getDueDate(), "TASK_REMINDER", userId);
        log.info("Reminder {} sent for task {} to user {}", eventType, task.getTaskId(), userId);
    }
}
