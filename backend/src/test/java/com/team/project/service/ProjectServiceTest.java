package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.project.CreateProjectRequest;
import com.team.project.dto.project.ProjectResponse;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.UserRepository;

/**
 * Fixture: project 1 (host user 1, members 1 and 2), project 2 (host user 2, member 2 only).
 * User 3 is not a member of any project.
 */
class ProjectServiceTest {

    private ProjectRepository projectRepository;
    private ProjectMemberRepository memberRepository;
    private ProjectService projectService;

    private static User user(int id) {
        return new User(id, "660965000" + id, "student", "User " + id, "u" + id + "@x.com", "hash",
                LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    private static Project project(int id, User host) {
        return new Project(id, "Project " + id, "CS261", host, 0, LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    private static ProjectMember member(int id, User user, Project project, String role) {
        return new ProjectMember(id, user, project, role, LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @BeforeEach
    void setUp() {
        User user1 = user(1);
        User user2 = user(2);
        User user3 = user(3);
        Project project1 = project(1, user1);
        Project project2 = project(2, user2);

        projectRepository = mock(ProjectRepository.class);
        memberRepository = mock(ProjectMemberRepository.class);
        UserRepository userRepository = mock(UserRepository.class);

        when(userRepository.getReferenceById(1)).thenReturn(user1);
        when(userRepository.getReferenceById(3)).thenReturn(user3);
        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(projectRepository.findById(2)).thenReturn(Optional.of(project2));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
            Project p = inv.getArgument(0);
            p.setProjectId(10);
            return p;
        });

        when(memberRepository.findByUser_UserId(1)).thenReturn(List.of(member(1, user1, project1, "host")));
        when(memberRepository.findByUser_UserId(2))
                .thenReturn(List.of(member(2, user2, project1, "member"), member(3, user2, project2, "host")));
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(2, 2)).thenReturn(true);

        projectService = new ProjectService(projectRepository, memberRepository, userRepository);
    }

    private static CreateProjectRequest req(String name, String subject) {
        return new CreateProjectRequest(name, subject, LocalDate.of(2026, 2, 1));
    }

    private static HttpStatus statusOf(ResponseStatusException e) {
        return HttpStatus.valueOf(e.getStatusCode().value());
    }

    private void assertBadRequest(int userId, CreateProjectRequest req) {
        assertEquals(HttpStatus.BAD_REQUEST,
                statusOf(assertThrows(ResponseStatusException.class, () -> projectService.create(userId, req))));
    }

    // ---------- create ----------

    @Test
    void createMakesCallerTheHostAndMember() {
        ProjectResponse created = projectService.create(3, req("  My Group ", " CS300 "));

        assertEquals(10, created.projectId());
        assertEquals("My Group", created.projectName());
        assertEquals("CS300", created.subjectCode());
        assertEquals(3, created.hostId());
        assertEquals(0, created.progress());
        assertEquals(LocalDateTime.of(2026, 2, 1, 0, 0), created.createdAt());

        ArgumentCaptor<ProjectMember> saved = ArgumentCaptor.forClass(ProjectMember.class);
        verify(memberRepository).save(saved.capture());
        assertEquals("host", saved.getValue().getRoleInProject());
        assertEquals(3, saved.getValue().getUserId());
        assertEquals(10, saved.getValue().getProjectId());
    }

    @Test
    void createRejectsBlankOrMissingName() {
        assertBadRequest(1, req("   ", "CS261"));
        assertBadRequest(1, req(null, "CS261"));
        assertBadRequest(1, null);
        verify(projectRepository, never()).save(any());
    }

    @Test
    void createRejectsBlankOrMissingSubjectCode() {
        assertBadRequest(1, req("ok", null));
        assertBadRequest(1, req("ok", "   "));
        verify(projectRepository, never()).save(any());
    }

    @Test
    void createAcceptsMissingCreatedAt() {
        ProjectResponse created = projectService.create(1, new CreateProjectRequest("ok", "CS261", null));

        assertEquals("ok", created.projectName());
        assertEquals("CS261", created.subjectCode());
        assertEquals(1, created.hostId());
        assertTrue(created.createdAt() != null);
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void createRejectsTooLongFields() {
        assertBadRequest(1, req("x".repeat(101), "CS261"));
        assertBadRequest(1, req("ok", "x".repeat(21)));
    }

    @Test
    void createAcceptsFieldsAtMaxLength() {
        ProjectResponse created = projectService.create(1,
                req("x".repeat(100), "z".repeat(20)));

        assertEquals(100, created.projectName().length());
    }

    // ---------- list ----------

    @Test
    void listReturnsOnlyProjectsWhereUserIsMember() {
        assertEquals(List.of(1), projectService.listForMember(1).stream().map(ProjectResponse::projectId).toList());
        assertEquals(List.of(1, 2), projectService.listForMember(2).stream().map(ProjectResponse::projectId).toList());
        assertTrue(projectService.listForMember(3).isEmpty());
    }

    // ---------- get ----------

    @Test
    void getReturnsProjectForMember() {
        ProjectResponse project = projectService.get(2, 1);

        assertEquals(1, project.projectId());
        assertEquals(1, project.hostId());
        assertEquals("CS261", project.subjectCode());
    }

    @Test
    void getIsForbiddenForNonMember() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> projectService.get(1, 2));

        assertEquals(HttpStatus.FORBIDDEN, statusOf(e));
    }

    @Test
    void getUnknownProjectIsNotFound() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> projectService.get(1, 999));

        assertEquals(HttpStatus.NOT_FOUND, statusOf(e));
    }
}
