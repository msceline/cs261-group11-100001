package com.team.project.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.team.project.controller.LinkFileController;
import com.team.project.entity.LinkFile;
import com.team.project.entity.Project;
import com.team.project.entity.User;
import com.team.project.exception.GlobalExceptionHandler;
import com.team.project.repository.LinkFileRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.security.JwtFilter;
import com.team.project.security.JwtService;
import com.team.project.service.LinkFileService;
import com.team.project.service.UserService;

/**
 * Integration test wiring JwtFilter -> LinkFileController -> Bean Validation / GlobalExceptionHandler
 * -> LinkFileService against a shared in-memory LinkFile store for User Story 5.
 */
class LinkFileIntegrationTest {

    private MockMvc mockMvc;
    private JwtService jwtService;
    private List<LinkFile> linkStore;
    private AtomicInteger nextLinkId;

    private User hostUser;
    private User member1;
    private User member2;
    private User outsiderUser;
    private Project project1;
    private Project project2;

    private String bearer(int userId) {
        return "Bearer " + jwtService.generateToken(userId);
    }

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.of(2026, 2, 1, 10, 0);
        hostUser = new User(1, "6609650001", "student", "Somchai Jaidee", "u1@dome.tu.ac.th", "hash", now);
        member1 = new User(2, "6609650002", "student", "Somying Rakdee", "u2@dome.tu.ac.th", "hash", now);
        member2 = new User(3, "6609650003", "student", "Somchart Meesuk", "u3@dome.tu.ac.th", "hash", now);
        outsiderUser = new User(4, "6609650004", "student", "Outsider", "u4@dome.tu.ac.th", "hash", now);

        project1 = new Project(1, "TU-WorkSpace-Group11", "CS261", hostUser, 0, now);
        project2 = new Project(2, "Campus Event Planner", "CS284", outsiderUser, 0, now);

        linkStore = new ArrayList<>();
        nextLinkId = new AtomicInteger(1);

        ProjectRepository projectRepository = mock(ProjectRepository.class);
        ProjectMemberRepository memberRepository = mock(ProjectMemberRepository.class);
        UserService userService = mock(UserService.class);
        LinkFileRepository linkFileRepository = mock(LinkFileRepository.class);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(projectRepository.findById(2)).thenReturn(Optional.of(project2));

        for (User u : List.of(hostUser, member1, member2, outsiderUser)) {
            when(userService.findById(u.getUserId())).thenReturn(Optional.of(u));
        }

        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, hostUser.getUserId())).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, member1.getUserId())).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, member2.getUserId())).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, outsiderUser.getUserId())).thenReturn(false);

        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(2, outsiderUser.getUserId())).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(2, member1.getUserId())).thenReturn(false);

        when(linkFileRepository.findByProject_ProjectId(anyInt())).thenAnswer(inv -> {
            int pid = inv.getArgument(0);
            return linkStore.stream()
                    .filter(lf -> lf.getProject().getProjectId().equals(pid))
                    .toList();
        });
        when(linkFileRepository.findByLinkFileIdAndProject_ProjectId(anyInt(), anyInt())).thenAnswer(inv -> {
            int lid = inv.getArgument(0);
            int pid = inv.getArgument(1);
            return linkStore.stream()
                    .filter(lf -> lf.getLinkFileId().equals(lid) && lf.getProject().getProjectId().equals(pid))
                    .findFirst();
        });
        when(linkFileRepository.save(any(LinkFile.class))).thenAnswer(inv -> {
            LinkFile lf = inv.getArgument(0);
            if (lf.getLinkFileId() == null) {
                lf.setLinkFileId(nextLinkId.getAndIncrement());
                if (lf.getCreatedAt() == null) {
                    lf.setCreatedAt(LocalDateTime.now());
                }
                linkStore.add(lf);
            }
            return lf;
        });
        doAnswer(inv -> {
            LinkFile lf = inv.getArgument(0);
            linkStore.removeIf(existing -> existing.getLinkFileId().equals(lf.getLinkFileId()));
            return null;
        }).when(linkFileRepository).delete(any(LinkFile.class));

        jwtService = new JwtService("integration-test-secret-key-at-least-32-chars", 3600);
        JwtFilter jwtFilter = new JwtFilter(jwtService);
        LinkFileService linkFileService = new LinkFileService(
                linkFileRepository, projectRepository, memberRepository, userService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new LinkFileController(linkFileService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(jwtFilter)
                .build();
    }

    @Test
    void uploadViewAndIsolateLinksAcrossMembersAndWorkspaces() throws Exception {
        // US5 TC1: Member 1 uploads a valid document link into Workspace 1
        mockMvc.perform(post("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(member1.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "linkName": "  Sprint 2 API Spec  ",
                                  "linkUrl": "https://drive.google.com/file/d/example-doc-1/view",
                                  "description": "Backend API documentation"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.linkFileId").value(1))
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.linkName").value("Sprint 2 API Spec"))
                .andExpect(jsonPath("$.linkUrl").value("https://drive.google.com/file/d/example-doc-1/view"))
                .andExpect(jsonPath("$.uploaderId").value(member1.getUserId()))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());

        // Outsider uploads a link in Workspace 2 (should remain isolated from Workspace 1)
        mockMvc.perform(post("/api/projects/2/linkfiles")
                        .header("Authorization", bearer(outsiderUser.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "linkName": "Workspace 2 Doc",
                                  "linkUrl": "https://docs.google.com/document/d/ws2/edit"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value(2));

        // US5 TC2: Member 2 in Workspace 1 views list and details of Member 1's link
        mockMvc.perform(get("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(member2.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].linkName").value("Sprint 2 API Spec"))
                .andExpect(jsonPath("$[0].uploaderId").value(member1.getUserId()));

        mockMvc.perform(get("/api/projects/1/linkfiles/1")
                        .header("Authorization", bearer(member2.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linkUrl").value("https://drive.google.com/file/d/example-doc-1/view"));
    }

    @Test
    void nonMemberAndUnauthenticatedUsersAreBlockedFromWorkspaceLinks() throws Exception {
        // Seed 1 link in Workspace 1 by Host
        mockMvc.perform(post("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(hostUser.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "linkName": "Architecture PDF",
                                  "linkUrl": "https://example.com/arch.pdf"
                                }
                                """))
                .andExpect(status().isCreated());

        // US5 TC3: Outsider cannot list, view, upload, update, or delete links in Workspace 1
        mockMvc.perform(get("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(outsiderUser.getUserId())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        mockMvc.perform(get("/api/projects/1/linkfiles/1")
                        .header("Authorization", bearer(outsiderUser.getUserId())))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(outsiderUser.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"linkName\":\"Hack\",\"linkUrl\":\"https://example.com/hack\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/projects/1/linkfiles/1")
                        .header("Authorization", bearer(outsiderUser.getUserId())))
                .andExpect(status().isForbidden());

        // Unauthenticated request blocked by JwtFilter
        mockMvc.perform(get("/api/projects/1/linkfiles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void uploaderCanEditAndDeleteOwnLinkWhileOtherMembersCannot() throws Exception {
        // Member 1 uploads a link
        mockMvc.perform(post("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(member1.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "linkName": "Draft Spec",
                                  "linkUrl": "https://example.com/v1"
                                }
                                """))
                .andExpect(status().isCreated());

        // Non-uploader (Member 2) cannot edit or delete Member 1's link
        mockMvc.perform(put("/api/projects/1/linkfiles/1")
                        .header("Authorization", bearer(member2.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"linkName\":\"Hijack\",\"linkUrl\":\"https://example.com/v2\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/projects/1/linkfiles/1")
                        .header("Authorization", bearer(member2.getUserId())))
                .andExpect(status().isForbidden());

        // US5 TC4: Uploader (Member 1) updates their own link
        mockMvc.perform(put("/api/projects/1/linkfiles/1")
                        .header("Authorization", bearer(member1.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "linkName": "Final Spec",
                                  "linkUrl": "https://example.com/v2",
                                  "description": "Updated link"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linkName").value("Final Spec"))
                .andExpect(jsonPath("$.linkUrl").value("https://example.com/v2"));

        // US5 TC4: Uploader deletes their own link -> list becomes empty
        mockMvc.perform(delete("/api/projects/1/linkfiles/1")
                        .header("Authorization", bearer(member1.getUserId())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(member1.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void validationRejectsInvalidUrlsAndMissingProjectReturns404() throws Exception {
        // Invalid URL (non-http/https scheme and malformed text)
        mockMvc.perform(post("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(member1.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"linkName\":\"Bad Link\",\"linkUrl\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("Invalid link URL"));

        // Blank linkName
        mockMvc.perform(post("/api/projects/1/linkfiles")
                        .header("Authorization", bearer(member1.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"linkName\":\"   \",\"linkUrl\":\"https://example.com/ok\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));

        // Missing project returns 404 PROJECT_NOT_FOUND consistently across list/get/update/delete
        mockMvc.perform(get("/api/projects/999/linkfiles")
                        .header("Authorization", bearer(member1.getUserId())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("PROJECT_NOT_FOUND"));

        mockMvc.perform(get("/api/projects/999/linkfiles/1")
                        .header("Authorization", bearer(member1.getUserId())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("PROJECT_NOT_FOUND"));

        mockMvc.perform(delete("/api/projects/999/linkfiles/1")
                        .header("Authorization", bearer(member1.getUserId())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("PROJECT_NOT_FOUND"));
    }
}
