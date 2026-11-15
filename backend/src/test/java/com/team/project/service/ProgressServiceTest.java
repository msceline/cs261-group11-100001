package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.progress.MemberProgressResponse;
import com.team.project.dto.progress.ProjectProgressResponse;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.Task;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.TaskRepository;

class ProgressServiceTest {

    private ProjectRepository projectRepository;
    private ProjectMemberRepository memberRepository;
    private TaskRepository taskRepository;
    private ProgressService progressService;

    private User user1;
    private User user2;
    private Project project1;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.of(2026, 1, 1, 0, 0);
        user1 = new User(1, "6609650001", "student", "User 1", "u1@x.com", "hash", now);
        user2 = new User(2, "6609650002", "student", "User 2", "u2@x.com", "hash", now);
        project1 = new Project(1, "P1", "CS261", user1, 0, now);

        projectRepository = mock(ProjectRepository.class);
        memberRepository = mock(ProjectMemberRepository.class);
        taskRepository = mock(TaskRepository.class);
        progressService = new ProgressService(projectRepository, memberRepository, taskRepository);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2)).thenReturn(true);
        when(memberRepository.findByProject_ProjectId(1)).thenReturn(List.of(
                new ProjectMember(1, user1, project1, "host", now),
                new ProjectMember(2, user2, project1, "member", now)
        ));
    }

    private Task task(int id, User assignee, String status) {
        return new Task(id, project1, "Task " + id, assignee, status, now.plusDays(1), null, now);
    }

    @Test
    void getProjectProgressCalculatesMemberAndProjectPercentages() {
        when(taskRepository.findByProject_ProjectId(1)).thenReturn(List.of(
                task(1, user1, "done"),
                task(2, user1, "done"),
                task(3, user2, "done"),
                task(4, user2, "doing"),
                task(5, user2, "todo")
        ));

        ProjectProgressResponse res = progressService.getProjectProgress(1, 1);

        assertEquals(1, res.projectId());
        assertEquals(5, res.totalTasks());
        assertEquals(3, res.completedTasks());
        assertEquals(60, res.projectProgress());
        assertEquals(2, res.members().size());

        MemberProgressResponse m1 = res.members().get(0);
        assertEquals(1, m1.userId());
        assertEquals("6609650001", m1.tu_id());
        assertEquals("User 1", m1.displayName());
        assertEquals("host", m1.roleInProject());
        assertEquals(2, m1.totalTasks());
        assertEquals(2, m1.completedTasks());
        assertEquals(100, m1.progressPercentage());

        MemberProgressResponse m2 = res.members().get(1);
        assertEquals(2, m2.userId());
        assertEquals("member", m2.roleInProject());
        assertEquals(3, m2.totalTasks());
        assertEquals(1, m2.completedTasks());
        assertEquals(33, m2.progressPercentage());
    }

    @Test
    void getProjectProgressReturnsZeroForMemberAndProjectWithNoTasks() {
        when(taskRepository.findByProject_ProjectId(1)).thenReturn(List.of());

        ProjectProgressResponse res = progressService.getProjectProgress(2, 1);

        assertEquals(0, res.totalTasks());
        assertEquals(0, res.completedTasks());
        assertEquals(0, res.projectProgress());
        assertEquals(2, res.members().size());
        assertEquals(0, res.members().get(0).progressPercentage());
        assertEquals(0, res.members().get(1).progressPercentage());
    }

    @Test
    void getProjectProgressIgnoresUnassignedTasksInMemberCounts() {
        when(taskRepository.findByProject_ProjectId(1)).thenReturn(List.of(
                task(1, null, "done"),
                task(2, null, "todo"),
                task(3, user1, "done")
        ));

        ProjectProgressResponse res = progressService.getProjectProgress(1, 1);

        assertEquals(3, res.totalTasks());
        assertEquals(2, res.completedTasks());
        assertEquals(66, res.projectProgress());
        assertEquals(1, res.members().get(0).totalTasks());
        assertEquals(1, res.members().get(0).completedTasks());
        assertEquals(100, res.members().get(0).progressPercentage());
        assertEquals(0, res.members().get(1).totalTasks());
        assertEquals(0, res.members().get(1).progressPercentage());
    }

    @Test
    void getProjectProgressThrows403ForNonMember() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 3)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> progressService.getProjectProgress(3, 1));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void getProjectProgressThrows404WhenProjectNotFound() {
        when(projectRepository.findById(999)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> progressService.getProjectProgress(1, 999));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }
}
