package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.member.AddMemberRequest;
import com.team.project.dto.member.MemberResponse;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.UserRepository;

/**
 * Fixture: project 1 (host user 1, member user 2), project 2 (host user 2).
 * User 3 exists but is not in any project.
 */
class MemberServiceTest {

    private ProjectMemberRepository memberRepository;
    private MemberService memberService;

    private static User user(int id) {
        return new User(id, "660965000" + id, "student", "User " + id, "u" + id + "@x.com", "hash",
                LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @BeforeEach
    void setUp() {
        User user1 = user(1);
        User user2 = user(2);
        User user3 = user(3);
        Project project1 = new Project(1, "P1", "CS261", user1, 0, null);
        Project project2 = new Project(2, "P2", "CS284", user2, 0, null);
        LocalDateTime now = LocalDateTime.of(2026, 1, 1, 0, 0);

        ProjectRepository projectRepository = mock(ProjectRepository.class);
        memberRepository = mock(ProjectMemberRepository.class);
        UserRepository userRepository = mock(UserRepository.class);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(projectRepository.findById(2)).thenReturn(Optional.of(project2));
        for (User u : new User[] {user1, user2, user3}) {
            when(userRepository.findById(u.getUserId())).thenReturn(Optional.of(u));
        }

        when(memberRepository.findByProject_ProjectId(1)).thenReturn(List.of(
                new ProjectMember(1, user1, project1, "host", now),
                new ProjectMember(2, user2, project1, "member", now)));
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(2, 2)).thenReturn(true);
        when(memberRepository.save(any(ProjectMember.class))).thenAnswer(inv -> {
            ProjectMember m = inv.getArgument(0);
            m.setId(100);
            return m;
        });

        memberService = new MemberService(projectRepository, memberRepository, new UserService(userRepository));
    }

    private static HttpStatus statusOf(ResponseStatusException e) {
        return HttpStatus.valueOf(e.getStatusCode().value());
    }

    private void assertAddFails(HttpStatus expected, int userId, int projectId, AddMemberRequest req) {
        assertEquals(expected, statusOf(assertThrows(ResponseStatusException.class,
                () -> memberService.add(userId, projectId, req))));
        verify(memberRepository, never()).save(any());
    }

    // ---------- list ----------

    @Test
    void listShowsMembersWithTheirRoleInProject() {
        List<MemberResponse> members = memberService.list(2, 1);

        assertEquals(List.of(1, 2), members.stream().map(MemberResponse::userId).toList());
        assertEquals(List.of("host", "member"), members.stream().map(MemberResponse::roleInProject).toList());
        assertEquals("6609650001", members.get(0).studentId());
    }

    @Test
    void listIsForbiddenForNonMember() {
        assertEquals(HttpStatus.FORBIDDEN,
                statusOf(assertThrows(ResponseStatusException.class, () -> memberService.list(1, 2))));
    }

    @Test
    void listUnknownProjectIsNotFound() {
        assertEquals(HttpStatus.NOT_FOUND,
                statusOf(assertThrows(ResponseStatusException.class, () -> memberService.list(1, 999))));
    }

    // ---------- add ----------

    @Test
    void hostCanAddUserAsMember() {
        MemberResponse added = memberService.add(2, 2, new AddMemberRequest(1));

        assertEquals(100, added.id());
        assertEquals(1, added.userId());
        assertEquals(2, added.projectId());
        assertEquals("member", added.roleInProject());

        ArgumentCaptor<ProjectMember> saved = ArgumentCaptor.forClass(ProjectMember.class);
        verify(memberRepository).save(saved.capture());
        assertEquals(1, saved.getValue().getUserId());
        assertEquals(2, saved.getValue().getProjectId());
    }

    @Test
    void nonHostCannotAddMember() {
        assertAddFails(HttpStatus.FORBIDDEN, 2, 1, new AddMemberRequest(3));
    }

    @Test
    void addRejectsUnknownUserDuplicateAndMissingId() {
        assertAddFails(HttpStatus.NOT_FOUND, 1, 1, new AddMemberRequest(999));
        assertAddFails(HttpStatus.CONFLICT, 1, 1, new AddMemberRequest(2));
        assertAddFails(HttpStatus.BAD_REQUEST, 1, 1, new AddMemberRequest(null));
        assertAddFails(HttpStatus.BAD_REQUEST, 1, 1, null);
    }

    @Test
    void addToUnknownProjectIsNotFound() {
        assertAddFails(HttpStatus.NOT_FOUND, 1, 999, new AddMemberRequest(2));
    }
}
