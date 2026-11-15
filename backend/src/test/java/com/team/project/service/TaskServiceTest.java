package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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

import com.team.project.dto.task.CreateTaskRequest;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.Task;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.TaskRepository;
import com.team.project.repository.UserRepository;

/**
 * Fixture: project 1 has user 1 (host), user 2 and user 4 (members).
 * User 3 exists but is not in the project; project 999 and user 999 do not exist.
 */
class TaskServiceTest {

    private static final LocalDateTime DUE = LocalDateTime.of(2026, 12, 1, 10, 0);

    private TaskRepository taskRepository;
    private NotificationService notificationService;
    private TaskService taskService;
    private Project project1;
    private User user2;

    private static User user(int id) {
        return new User(id, "660965000" + id, "student", "User " + id, "u" + id + "@x.com", "hash", null);
    }

    @BeforeEach
    void setUp() {
        User user1 = user(1);
        user2 = user(2);
        User user3 = user(3);
        User user4 = user(4);
        project1 = new Project(1, "P1", "CS261", user1, 0, null);

        taskRepository = mock(TaskRepository.class);
        ProjectRepository projectRepository = mock(ProjectRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ProjectMemberRepository memberRepository = mock(ProjectMemberRepository.class);
        notificationService = mock(NotificationService.class);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        for (User u : new User[] {user1, user2, user3, user4}) {
            when(userRepository.findById(u.getUserId())).thenReturn(Optional.of(u));
        }
        ProjectMember host = new ProjectMember(1, user1, project1, "host", null);
        ProjectMember member = new ProjectMember(2, user2, project1, "member", null);
        ProjectMember member4 = new ProjectMember(3, user4, project1, "member", null);
        when(memberRepository.findByProject_ProjectIdAndUser_UserId(1, 1)).thenReturn(Optional.of(host));
        when(memberRepository.findByProject_ProjectIdAndUser_UserId(1, 2)).thenReturn(Optional.of(member));
        when(memberRepository.findByProject_ProjectIdAndUser_UserId(1, 4)).thenReturn(Optional.of(member4));
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 4)).thenReturn(true);
        when(memberRepository.findByUser_UserId(2)).thenReturn(List.of(member));

        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        taskService = new TaskService(taskRepository, projectRepository, userRepository, memberRepository,
                notificationService);
    }

    private static HttpStatus statusOf(ResponseStatusException e) {
        return HttpStatus.valueOf(e.getStatusCode().value());
    }

    private void assertCreateFails(HttpStatus expected, int userId, CreateTaskRequest req) {
        assertEquals(expected,
                statusOf(assertThrows(ResponseStatusException.class, () -> taskService.createTask(userId, req))));
        verify(taskRepository, never()).save(any());
    }

    private Task storedTask(int id) {
        Task task = new Task(id, project1, "Old", null, "todo", null, null, null);
        when(taskRepository.findById(id)).thenReturn(Optional.of(task));
        return task;
    }

    // ---------- create ----------

    @Test
    void createBuildsTaskWithProjectAndAssignee() {
        Task task = taskService.createTask(1, new CreateTaskRequest(1, "  Write report ", "details", 2, "doing", DUE));

        assertEquals("Write report", task.getTitle());
        assertEquals("details", task.getTaskDescription());
        assertEquals("doing", task.getStatus());
        assertEquals(DUE, task.getDueDate());
        assertEquals(project1, task.getProject());
        assertEquals(user2, task.getAssignee());
        verify(notificationService).createSystemNotification(any(), any(), org.mockito.ArgumentMatchers.eq("task_assigned"), org.mockito.ArgumentMatchers.eq(2));
    }

    @Test
    void createWithoutAssigneeOrStatusUsesDefaults() {
        Task task = taskService.createTask(2, new CreateTaskRequest(1, "Task", null, null, null, null));

        assertNull(task.getAssignee());
        assertNull(task.getDueDate());
        assertEquals("todo", task.getStatus());
    }

    @Test
    void createRejectsUnknownProjectAndAssignee() {
        assertCreateFails(HttpStatus.NOT_FOUND, 1, new CreateTaskRequest(999, "Task", null, null, null, null));
        assertCreateFails(HttpStatus.NOT_FOUND, 1, new CreateTaskRequest(1, "Task", null, 999, null, null));
    }

    @Test
    void createRejectsAssigneeWhoIsNotInTheProject() {
        assertCreateFails(HttpStatus.BAD_REQUEST, 1, new CreateTaskRequest(1, "Task", null, 3, null, null));
    }

    @Test
    void createIsForbiddenForNonMember() {
        assertCreateFails(HttpStatus.FORBIDDEN, 3, new CreateTaskRequest(1, "Task", null, null, null, null));
    }

    @Test
    void createRejectsBlankMissingOrTooLongTitle() {
        assertCreateFails(HttpStatus.BAD_REQUEST, 1, new CreateTaskRequest(1, "   ", null, null, null, null));
        assertCreateFails(HttpStatus.BAD_REQUEST, 1, new CreateTaskRequest(1, null, null, null, null, null));
        assertCreateFails(HttpStatus.BAD_REQUEST,
                1, new CreateTaskRequest(1, "x".repeat(201), null, null, null, null));
    }

    // ---------- read ----------

    @Test
    void listReturnsTasksOfTheUsersProjectsOnly() {
        Task task = new Task(5, project1, "T", null, "todo", null, null, null);
        when(taskRepository.findByProject_ProjectId(1)).thenReturn(List.of(task));

        assertEquals(List.of(task), taskService.listForMember(2));
        assertTrue(taskService.listForMember(3).isEmpty());
    }

    @Test
    void getByIdReturnsTaskForMembers() {
        Task task = storedTask(5);

        assertEquals(task, taskService.getTaskById(2, 5).orElseThrow());
        assertEquals(task, taskService.getTaskById(4, 5).orElseThrow());
        assertTrue(taskService.getTaskById(2, 999).isEmpty());
    }

    @Test
    void getByIdIsForbiddenForNonMember() {
        storedTask(5);

        assertEquals(HttpStatus.FORBIDDEN,
                statusOf(assertThrows(ResponseStatusException.class, () -> taskService.getTaskById(3, 5))));
    }

    // ---------- update ----------

    @Test
    void updateChangesEditableFields() {
        storedTask(5);

        Task updated = taskService.updateTask(2, 5, new CreateTaskRequest(1, "New", "desc", 2, "done", DUE))
                .orElseThrow();

        assertEquals("New", updated.getTitle());
        assertEquals("desc", updated.getTaskDescription());
        assertEquals("done", updated.getStatus());
        assertEquals(user2, updated.getAssignee());
        assertEquals(DUE, updated.getDueDate());
        assertEquals(project1, updated.getProject());
    }

    @Test
    void updatePartialFieldsKeepsExistingValues() {
        Task existing = storedTask(5);
        existing.setStatus("doing");
        existing.setAssignee(user2);
        existing.setDueDate(DUE);
        existing.setTaskDescription("existing description");

        Task updated = taskService.updateTask(1, 5, new CreateTaskRequest(1, null, null, null, "done", null))
                .orElseThrow();

        assertEquals("Old", updated.getTitle());
        assertEquals("existing description", updated.getTaskDescription());
        assertEquals("done", updated.getStatus());
        assertEquals(user2, updated.getAssignee());
        assertEquals(DUE, updated.getDueDate());
    }

    @Test
    void updateCanClearAssigneeWithZeroOrNegative() {
        Task existing = storedTask(5);
        existing.setAssignee(user2);

        Task updated = taskService.updateTask(1, 5, new CreateTaskRequest(1, null, null, 0, null, null))
                .orElseThrow();

        assertNull(updated.getAssignee());
    }

    @Test
    void updateAssigneeTriggersNotification() {
        Task existing = storedTask(5);
        existing.setAssignee(null);

        taskService.updateTask(1, 5, new CreateTaskRequest(1, null, null, 2, null, null));

        verify(notificationService).createSystemNotification(any(), any(), org.mockito.ArgumentMatchers.eq("task_assigned"), org.mockito.ArgumentMatchers.eq(2));
    }

    @Test
    void updateIsForbiddenForNonMember() {
        storedTask(5);
        CreateTaskRequest req = new CreateTaskRequest(1, "New", null, null, null, null);

        assertEquals(HttpStatus.FORBIDDEN,
                statusOf(assertThrows(ResponseStatusException.class, () -> taskService.updateTask(3, 5, req))));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void updateUnknownTaskReturnsEmpty() {
        assertTrue(taskService.updateTask(1, 999, new CreateTaskRequest(1, "T", null, null, null, null)).isEmpty());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void updateRejectsBlankTitle() {
        storedTask(5);

        assertThrows(ResponseStatusException.class,
                () -> taskService.updateTask(1, 5, new CreateTaskRequest(1, " ", null, null, null, null)));
        verify(taskRepository, never()).save(any());
    }

    // ---------- progress ----------

    @Test
    void updatingStatusRecalculatesProjectProgress() {
        storedTask(5);
        when(taskRepository.countByProject_ProjectId(1)).thenReturn(3L);
        when(taskRepository.countByProject_ProjectIdAndStatus(1, "done")).thenReturn(1L);

        taskService.updateTask(2, 5, new CreateTaskRequest(1, "T", null, null, "done", null));

        assertEquals(33, project1.getProgress());
    }

    @Test
    void creatingTaskRecalculatesProjectProgress() {
        when(taskRepository.countByProject_ProjectId(1)).thenReturn(2L);
        when(taskRepository.countByProject_ProjectIdAndStatus(1, "done")).thenReturn(2L);

        taskService.createTask(1, new CreateTaskRequest(1, "T", null, null, "done", null));

        assertEquals(100, project1.getProgress());
    }

    @Test
    void progressIsZeroWhenProjectHasNoTasks() {
        project1.setProgress(50);
        storedTask(5);

        taskService.updateTask(2, 5, new CreateTaskRequest(1, "T", null, null, "todo", null));

        assertEquals(0, project1.getProgress());
    }

    @Test
    void unknownStatusIsRejected() {
        assertCreateFails(HttpStatus.BAD_REQUEST, 1, new CreateTaskRequest(1, "T", null, null, "finished", null));
    }
}
