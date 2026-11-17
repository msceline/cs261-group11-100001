package com.team.project.integration;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.team.project.controller.AuthController;
import com.team.project.controller.InvitationController;
import com.team.project.controller.LinkFileController;
import com.team.project.controller.MeetingController;
import com.team.project.controller.MemberController;
import com.team.project.controller.NotificationController;
import com.team.project.controller.ProgressController;
import com.team.project.controller.ProjectController;
import com.team.project.controller.TaskController;
import com.team.project.entity.LinkFile;
import com.team.project.entity.Meeting;
import com.team.project.entity.Notification;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.Task;
import com.team.project.entity.User;
import com.team.project.exception.GlobalExceptionHandler;
import com.team.project.repository.LinkFileRepository;
import com.team.project.repository.MeetingRepository;
import com.team.project.repository.NotificationRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.TaskRepository;
import com.team.project.repository.UserRepository;
import com.team.project.security.JwtFilter;
import com.team.project.security.JwtService;
import com.team.project.service.AuthService;
import com.team.project.service.LinkFileService;
import com.team.project.service.MeetingService;
import com.team.project.service.MemberService;
import com.team.project.service.NotificationService;
import com.team.project.service.ProgressService;
import com.team.project.service.ProjectService;
import com.team.project.service.TaskService;
import com.team.project.service.TuAuthClient;
import com.team.project.service.TuAuthClient.TuStudent;
import com.team.project.service.TuAuthClient.TuUser;
import com.team.project.service.TuStudentService;
import com.team.project.service.UserService;

/**
 * Sprint 2 System Test wiring JwtFilter + GlobalExceptionHandler + all Sprint 1 & Sprint 2
 * controllers/services against unified in-memory stores to verify end-to-end flows, cross-feature
 * interactions (US5, US6, US7), and Sprint 1 regression (US1-US4).
 */
@SuppressWarnings("unchecked")
class Sprint2SystemTest {

    private MockMvc mockMvc;
    private JwtService jwtService;
    private TuAuthClient tuAuthClient;

    private List<User> userStore;
    private List<Project> projectStore;
    private List<ProjectMember> memberStore;
    private List<Task> taskStore;
    private List<Notification> notificationStore;
    private List<Meeting> meetingStore;
    private List<LinkFile> linkFileStore;

    private AtomicInteger nextUserId;
    private AtomicInteger nextProjectId;
    private AtomicInteger nextMemberId;
    private AtomicInteger nextTaskId;
    private AtomicInteger nextNotificationId;
    private AtomicInteger nextMeetingId;
    private AtomicInteger nextLinkId;

    private String bearer(int userId) {
        return "Bearer " + jwtService.generateToken(userId);
    }

    @BeforeEach
    void setUp() {
        userStore = new ArrayList<>();
        projectStore = new ArrayList<>();
        memberStore = new ArrayList<>();
        taskStore = new ArrayList<>();
        notificationStore = new ArrayList<>();
        meetingStore = new ArrayList<>();
        linkFileStore = new ArrayList<>();

        nextUserId = new AtomicInteger(1);
        nextProjectId = new AtomicInteger(1);
        nextMemberId = new AtomicInteger(1);
        nextTaskId = new AtomicInteger(1);
        nextNotificationId = new AtomicInteger(1);
        nextMeetingId = new AtomicInteger(1);
        nextLinkId = new AtomicInteger(1);

        UserRepository userRepo = mockUserRepo();
        ProjectRepository projectRepo = mockProjectRepo();
        ProjectMemberRepository memberRepo = mockMemberRepo();
        TaskRepository taskRepo = mockTaskRepo();
        NotificationRepository notificationRepo = mockNotificationRepo();
        MeetingRepository meetingRepo = mockMeetingRepo();
        LinkFileRepository linkFileRepo = mockLinkFileRepo();

        jwtService = new JwtService("sprint2-system-test-secret-key-at-least-32-chars", 60);
        tuAuthClient = mock(TuAuthClient.class);

        when(tuAuthClient.verify("6609650001", "valid-pass")).thenReturn(Optional.of(
                new TuUser("6609650001", "Somchai Host", "u1@dome.tu.ac.th", "student")));
        when(tuAuthClient.verify("6609650002", "valid-pass")).thenReturn(Optional.of(
                new TuUser("6609650002", "Somying Member", "u2@dome.tu.ac.th", "student")));
        when(tuAuthClient.findStudent("6609650002")).thenReturn(Optional.of(
                new TuStudent("6609650002", "Somying Member")));
        when(tuAuthClient.findStudent("6609650003")).thenReturn(Optional.of(
                new TuStudent("6609650003", "Somchart Peer")));

        UserService userService = new UserService(userRepo);
        AuthService authService = new AuthService(userService, jwtService, tuAuthClient);
        TuStudentService tuStudentService = new TuStudentService(tuAuthClient, userRepo);
        NotificationService notificationService = new NotificationService(notificationRepo, userRepo, memberRepo);
        ProjectService projectService = new ProjectService(projectRepo, memberRepo, userRepo);
        MemberService memberService = new MemberService(projectRepo, memberRepo, userService, tuStudentService, notificationService);
        TaskService taskService = new TaskService(taskRepo, projectRepo, userRepo, memberRepo, notificationService);
        ProgressService progressService = new ProgressService(projectRepo, memberRepo, taskRepo);
        MeetingService meetingService = new MeetingService(meetingRepo, projectRepo, userRepo, memberRepo);
        LinkFileService linkFileService = new LinkFileService(linkFileRepo, projectRepo, memberRepo, userService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(
                        new AuthController(authService),
                        new ProjectController(projectService),
                        new MemberController(memberService),
                        new InvitationController(memberService),
                        new TaskController(taskService),
                        new NotificationController(notificationService),
                        new ProgressController(progressService),
                        new MeetingController(meetingService),
                        new LinkFileController(linkFileService))
                .addFilters(new JwtFilter(jwtService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void fullSprint2EndToEndWorkspaceLifecycleWithSprint1Regression() throws Exception {
        // 1. US2 (Regression): Host and Member A log in through AuthController and receive JWTs.
        String hostLoginJson = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"6609650001\",\"password\":\"valid-pass\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.tu_id").value("6609650001"))
                .andReturn().getResponse().getContentAsString();
        String hostBearer = "Bearer " + jsonString(hostLoginJson, "token");
        int hostId = jsonInt(hostLoginJson, "userId");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"6609650001\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me").header("Authorization", hostBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Somchai Host"));

        String memberLoginJson = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"6609650002\",\"password\":\"valid-pass\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String memberBearer = "Bearer " + jsonString(memberLoginJson, "token");
        int memberId = jsonInt(memberLoginJson, "userId");

        // 2. US1 (Regression): Host creates Workspace and invites Member A.
        String projectJson = mockMvc.perform(post("/api/projects")
                        .header("Authorization", hostBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectName\":\"CS261 Sprint 2 Demo\",\"subjectCode\":\"CS261\",\"dueDate\":\"2026-12-20\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectName").value("CS261 Sprint 2 Demo"))
                .andReturn().getResponse().getContentAsString();
        int projectId = jsonInt(projectJson, "projectId");

        mockMvc.perform(post("/api/projects/" + projectId + "/members")
                        .header("Authorization", hostBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"6609650002\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending"));

        // Pending invitation cannot access workspace progress, meetings, or links yet (403).
        mockMvc.perform(get("/api/projects/" + projectId + "/progress").header("Authorization", memberBearer))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/meetings").param("projectId", String.valueOf(projectId)).header("Authorization", memberBearer))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/projects/" + projectId + "/linkfiles").header("Authorization", memberBearer))
                .andExpect(status().isForbidden());

        // 3. US4 (Regression): Member A sees invitation + notification, accepts, and Host is notified.
        mockMvc.perform(get("/api/invitations").header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        String notifJson = mockMvc.perform(get("/api/notifications/user/" + memberId)
                        .header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("invite"))
                .andReturn().getResponse().getContentAsString();
        int notifId = jsonInt(notifJson, "id");

        mockMvc.perform(get("/api/notifications/user/" + memberId).header("Authorization", hostBearer))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/notifications/" + notifId + "/read").header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true));

        mockMvc.perform(post("/api/projects/" + projectId + "/members/accept").header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("accepted"));

        // 4. US3 + US7 + DEF-U7-01: Tasks created -> Member A updates own task status -> Progress reflects immediately.
        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", hostBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + projectId + ",\"taskTitle\":\"Host Init\",\"assigneeId\":" + hostId + ",\"status\":\"done\"}"))
                .andExpect(status().isCreated());
        String t2Json = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", hostBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + projectId + ",\"taskTitle\":\"Implement UI\",\"assigneeId\":" + memberId + ",\"status\":\"doing\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int task2Id = jsonInt(t2Json, "taskId");
        String t3Json = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", hostBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + projectId + ",\"taskTitle\":\"Write Tests\",\"assigneeId\":" + memberId + ",\"status\":\"todo\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int task3Id = jsonInt(t3Json, "taskId");

        // Cross-feature US3 -> US4 check: Member A received "task_assigned" notifications.
        mockMvc.perform(get("/api/notifications/user/" + memberId).header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("task_assigned"));

        mockMvc.perform(get("/api/projects/" + projectId + "/progress").header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectProgress").value(33))
                .andExpect(jsonPath("$.members[1].progressPercentage").value(0));

        // DEF-U7-01 verification: assignee Member A updates own task status without being Host.
        mockMvc.perform(patch("/api/tasks/" + task2Id)
                        .header("Authorization", memberBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"done\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"));

        mockMvc.perform(get("/api/projects/" + projectId + "/progress").header("Authorization", hostBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectProgress").value(67))
                .andExpect(jsonPath("$.completedTasks").value(2))
                .andExpect(jsonPath("$.members[1].progressPercentage").value(50));

        // Member A finishes final task -> 100% progress.
        mockMvc.perform(patch("/api/tasks/" + task3Id)
                        .header("Authorization", memberBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"done\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/projects/" + projectId + "/progress").header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectProgress").value(100))
                .andExpect(jsonPath("$.members[1].progressPercentage").value(100));

        // 5. US6: Host schedules a meeting; Member A lists & reads it; Host updates meeting details.
        OffsetDateTime futureMeeting = OffsetDateTime.now(ZoneOffset.UTC).plusDays(3).withNano(0);
        String meetingJson = mockMvc.perform(post("/api/meetings")
                        .header("Authorization", hostBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + projectId + ",\"meetingTopic\":\"Sprint 2 Demo Prep\","
                                + "\"meetingDate\":\"" + futureMeeting + "\","
                                + "\"meetingDescription\":\"Agenda: Review US5-7\","
                                + "\"meetingLink\":\"https://meet.google.com/abc-defg-hij\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andReturn().getResponse().getContentAsString();
        int meetingId = jsonInt(meetingJson, "meetingId");

        mockMvc.perform(get("/api/meetings").param("projectId", String.valueOf(projectId)).header("Authorization", memberBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].meetingTopic").value("Sprint 2 Demo Prep"));

        mockMvc.perform(patch("/api/meetings/" + meetingId)
                        .header("Authorization", hostBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"meetingLink\":\"LC2-305\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingLink").value("LC2-305"));

        // 6. US5: Member A uploads a link; Host views it; Member A edits and deletes it.
        String linkJson = mockMvc.perform(post("/api/projects/" + projectId + "/linkfiles")
                        .header("Authorization", memberBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"linkName\":\"System Test Sheet\",\"linkUrl\":\"https://docs.google.com/spreadsheets/d/1\",\"description\":\"Sprint 2\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.uploaderId").value(memberId))
                .andReturn().getResponse().getContentAsString();
        int linkId = jsonInt(linkJson, "linkFileId");

        mockMvc.perform(get("/api/projects/" + projectId + "/linkfiles").header("Authorization", hostBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].linkName").value("System Test Sheet"));

        mockMvc.perform(put("/api/projects/" + projectId + "/linkfiles/" + linkId)
                        .header("Authorization", memberBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"linkName\":\"Final Test Sheet\",\"linkUrl\":\"https://docs.google.com/spreadsheets/d/2\",\"description\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linkName").value("Final Test Sheet"));

        mockMvc.perform(delete("/api/projects/" + projectId + "/linkfiles/" + linkId).header("Authorization", memberBearer))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/" + projectId + "/linkfiles").header("Authorization", hostBearer))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void meetingLifecycleValidationAuthorizationAndConcurrencyAcrossMembers() throws Exception {
        User host = seedUser("6609650011", "Host User");
        User memberA = seedUser("6609650012", "Member A");
        User memberB = seedUser("6609650013", "Member B");
        User outsider = seedUser("6609650014", "Outsider");
        Project p1 = seedProject("Meeting System WS", "CS261", host);
        seedAcceptedMember(p1, memberA, "member");
        seedAcceptedMember(p1, memberB, "member");

        OffsetDateTime future = OffsetDateTime.now(ZoneOffset.UTC).plusDays(2).withNano(0);
        String exact500Loc = "A".repeat(500);

        // US6 TC1 (P) & DEF-U6-01 (500-char location accepted)
        String createdJson = mockMvc.perform(post("/api/meetings")
                        .header("Authorization", bearer(host.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + p1.getProjectId() + ",\"meetingTopic\":\"Architecture Sync\","
                                + "\"meetingDate\":\"" + future + "\",\"meetingLink\":\"" + exact500Loc + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.meetingLink").value(exact500Loc))
                .andReturn().getResponse().getContentAsString();
        int meetingId = jsonInt(createdJson, "meetingId");

        // US6 TC2 & TC5: multiple workspace members read same meeting details simultaneously; outsider gets 403.
        mockMvc.perform(get("/api/meetings/" + meetingId).header("Authorization", bearer(memberA.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingTopic").value("Architecture Sync"));
        mockMvc.perform(get("/api/meetings/" + meetingId).header("Authorization", bearer(memberB.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingTopic").value("Architecture Sync"));
        mockMvc.perform(get("/api/meetings/" + meetingId).header("Authorization", bearer(outsider.getUserId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/meetings/" + meetingId))
                .andExpect(status().isUnauthorized());

        // US6 TC3 & TC4 (N): blank topic, past date, malformed date, oversized location >500.
        mockMvc.perform(post("/api/meetings")
                        .header("Authorization", bearer(host.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + p1.getProjectId() + ",\"meetingTopic\":\"   \",\"meetingDate\":\"" + future + "\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/meetings")
                        .header("Authorization", bearer(host.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + p1.getProjectId() + ",\"meetingTopic\":\"Past Meeting\",\"meetingDate\":\"2020-01-01T10:00:00Z\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/meetings")
                        .header("Authorization", bearer(host.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + p1.getProjectId() + ",\"meetingTopic\":\"Bad Date\",\"meetingDate\":\"not-a-date\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/meetings")
                        .header("Authorization", bearer(host.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + p1.getProjectId() + ",\"meetingTopic\":\"Too Long Loc\",\"meetingDate\":\"" + future + "\",\"meetingLink\":\"" + "B".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest());

        // Non-host member cannot create, update, or cancel meetings (403).
        mockMvc.perform(post("/api/meetings")
                        .header("Authorization", bearer(memberA.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":" + p1.getProjectId() + ",\"meetingTopic\":\"Member Try\",\"meetingDate\":\"" + future + "\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/meetings/" + meetingId).header("Authorization", bearer(memberA.getUserId())))
                .andExpect(status().isForbidden());

        // Host soft-cancels meeting -> 200 CANCELLED; editing or cancelling again returns 409 Conflict.
        mockMvc.perform(delete("/api/meetings/" + meetingId).header("Authorization", bearer(host.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        mockMvc.perform(patch("/api/meetings/" + meetingId)
                        .header("Authorization", bearer(host.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"meetingTopic\":\"Cannot Edit\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(delete("/api/meetings/" + meetingId).header("Authorization", bearer(host.getUserId())))
                .andExpect(status().isConflict());
    }

    @Test
    void crossWorkspaceIsolationAndMissingResourceSemanticsAcrossSprint2Features() throws Exception {
        User ws1Host = seedUser("6609650021", "WS1 Host");
        User ws2Host = seedUser("6609650022", "WS2 Host");
        Project ws1 = seedProject("Workspace 1", "CS261", ws1Host);
        Project ws2 = seedProject("Workspace 2", "CS262", ws2Host);

        LinkFile linkInWs1 = new LinkFile(nextLinkId.getAndIncrement(), "WS1 Doc", "https://example.com/1", "Secret", ws1, ws1Host, LocalDateTime.now());
        linkFileStore.add(linkInWs1);

        // WS2 user cannot access WS1 progress, meetings, linkfiles, or notifications of WS1 user.
        mockMvc.perform(get("/api/projects/" + ws1.getProjectId() + "/progress").header("Authorization", bearer(ws2Host.getUserId())))
                .andExpect(status().isForbidden())
                .andExpect(content().string(not(containsString("linkfile"))));
        mockMvc.perform(get("/api/meetings").param("projectId", String.valueOf(ws1.getProjectId())).header("Authorization", bearer(ws2Host.getUserId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/projects/" + ws1.getProjectId() + "/linkfiles").header("Authorization", bearer(ws2Host.getUserId())))
                .andExpect(status().isForbidden());

        // Missing projectId returns 404 consistently across Sprint 2 endpoints (incl. DEF-U5-02 fix).
        mockMvc.perform(get("/api/projects/999/progress").header("Authorization", bearer(ws1Host.getUserId())))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/projects/999/linkfiles").header("Authorization", bearer(ws1Host.getUserId())))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/projects/999/linkfiles/" + linkInWs1.getLinkFileId()).header("Authorization", bearer(ws1Host.getUserId())))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/meetings")
                        .header("Authorization", bearer(ws1Host.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":999,\"meetingTopic\":\"Missing\",\"meetingDate\":\"" + OffsetDateTime.now(ZoneOffset.UTC).plusDays(1) + "\"}"))
                .andExpect(status().isNotFound());
        // Own workspace 2 works normally.
        mockMvc.perform(get("/api/projects/" + ws2.getProjectId() + "/progress").header("Authorization", bearer(ws2Host.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectProgress").value(0));
    }

    private User seedUser(String tuId, String name) {
        User u = new User(nextUserId.getAndIncrement(), tuId, "student", name, tuId + "@dome.tu.ac.th", "hash", LocalDateTime.now());
        userStore.add(u);
        return u;
    }

    private Project seedProject(String name, String code, User host) {
        Project p = new Project(nextProjectId.getAndIncrement(), name, code, host, 0, LocalDateTime.now());
        projectStore.add(p);
        seedAcceptedMember(p, host, "host");
        return p;
    }

    private void seedAcceptedMember(Project p, User u, String role) {
        memberStore.add(new ProjectMember(nextMemberId.getAndIncrement(), u, p, role, ProjectMember.STATUS_ACCEPTED, LocalDateTime.now()));
    }

    private UserRepository mockUserRepo() {
        UserRepository repo = mock(UserRepository.class);
        when(repo.findById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return userStore.stream().filter(u -> u.getUserId().equals(id)).findFirst();
        });
        when(repo.getReferenceById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return userStore.stream().filter(u -> u.getUserId().equals(id)).findFirst().orElse(null);
        });
        when(repo.findByTu_id(anyString())).thenAnswer(inv -> {
            String tuId = inv.getArgument(0);
            return userStore.stream().filter(u -> u.getTu_id().equals(tuId)).findFirst();
        });
        when(repo.existsById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return userStore.stream().anyMatch(u -> u.getUserId().equals(id));
        });
        when(repo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getUserId() == null) {
                u.setUserId(nextUserId.getAndIncrement());
                userStore.add(u);
            }
            return u;
        });
        return repo;
    }

    private ProjectRepository mockProjectRepo() {
        ProjectRepository repo = mock(ProjectRepository.class);
        when(repo.findById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return projectStore.stream().filter(p -> p.getProjectId().equals(id)).findFirst();
        });
        when(repo.save(any(Project.class))).thenAnswer(inv -> {
            Project p = inv.getArgument(0);
            if (p.getProjectId() == null) {
                p = new Project(nextProjectId.getAndIncrement(), p.getProjectName(), p.getSubjectId(),
                        p.getHost(), p.getProgress(), p.getCreatedAt(), p.getDueDate());
                projectStore.add(p);
            }
            return p;
        });
        return repo;
    }

    private ProjectMemberRepository mockMemberRepo() {
        ProjectMemberRepository repo = mock(ProjectMemberRepository.class);
        when(repo.findByProject_ProjectId(anyInt())).thenAnswer(inv -> {
            int pid = inv.getArgument(0);
            return memberStore.stream().filter(m -> m.getProjectId() == pid).toList();
        });
        when(repo.findByUser_UserId(anyInt())).thenAnswer(inv -> {
            int uid = inv.getArgument(0);
            return memberStore.stream()
                    .filter(m -> m.getUserId() == uid && ProjectMember.STATUS_ACCEPTED.equals(m.getStatus()))
                    .toList();
        });
        when(repo.findByUser_UserIdAndStatus(anyInt(), anyString())).thenAnswer(inv -> {
            int uid = inv.getArgument(0);
            String st = inv.getArgument(1);
            return memberStore.stream()
                    .filter(m -> m.getUserId() == uid && st.equals(m.getStatus()))
                    .toList();
        });
        when(repo.findByProject_ProjectIdAndUser_UserId(anyInt(), anyInt())).thenAnswer(inv -> {
            int pid = inv.getArgument(0);
            int uid = inv.getArgument(1);
            return memberStore.stream()
                    .filter(m -> m.getProjectId() == pid && m.getUserId() == uid && ProjectMember.STATUS_ACCEPTED.equals(m.getStatus()))
                    .findFirst();
        });
        when(repo.existsByProject_ProjectIdAndUser_UserId(anyInt(), anyInt())).thenAnswer(inv -> {
            int pid = inv.getArgument(0);
            int uid = inv.getArgument(1);
            return memberStore.stream()
                    .anyMatch(m -> m.getProjectId() == pid && m.getUserId() == uid && ProjectMember.STATUS_ACCEPTED.equals(m.getStatus()));
        });
        when(repo.findAnyStatus(anyInt(), anyInt())).thenAnswer(inv -> {
            int pid = inv.getArgument(0);
            int uid = inv.getArgument(1);
            return memberStore.stream()
                    .filter(m -> m.getProjectId() == pid && m.getUserId() == uid)
                    .findFirst();
        });
        when(repo.save(any(ProjectMember.class))).thenAnswer(inv -> {
            ProjectMember m = inv.getArgument(0);
            if (m.getId() == null) {
                m = new ProjectMember(nextMemberId.getAndIncrement(), m.getUser(), m.getProject(),
                        m.getRoleInProject(), m.getStatus(), LocalDateTime.now());
                memberStore.add(m);
            }
            return m;
        });
        doAnswer(inv -> {
            ProjectMember m = inv.getArgument(0);
            memberStore.removeIf(x -> x.getId().equals(m.getId()));
            return null;
        }).when(repo).delete(any(ProjectMember.class));
        return repo;
    }

    private TaskRepository mockTaskRepo() {
        TaskRepository repo = mock(TaskRepository.class);
        when(repo.findByProject_ProjectId(anyInt())).thenAnswer(inv -> {
            int pid = inv.getArgument(0);
            return taskStore.stream().filter(t -> t.getProject().getProjectId().equals(pid)).toList();
        });
        when(repo.findById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return taskStore.stream().filter(t -> t.getTaskId().equals(id)).findFirst();
        });
        when(repo.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            if (t.getTaskId() == null) {
                t = new Task(nextTaskId.getAndIncrement(), t.getProject(), t.getTitle(), t.getAssignee(),
                        t.getStatus(), t.getDueDate(), t.getTaskDescription(), LocalDateTime.now());
                taskStore.add(t);
            }
            return t;
        });
        return repo;
    }

    private NotificationRepository mockNotificationRepo() {
        NotificationRepository repo = mock(NotificationRepository.class);
        when(repo.findByUser_UserIdOrderByCreatedAtDesc(anyInt())).thenAnswer(inv -> {
            int uid = inv.getArgument(0);
            return notificationStore.stream()
                    .filter(n -> n.getUser().getUserId().equals(uid))
                    .sorted(Comparator.comparing(Notification::getId).reversed())
                    .toList();
        });
        when(repo.findById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return notificationStore.stream().filter(n -> n.getId().equals(id)).findFirst();
        });
        when(repo.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            if (n.getId() == null) {
                n = new Notification(nextNotificationId.getAndIncrement(), n.getUser(), n.getTitle(),
                        n.getMessage(), n.getType(), n.getIsRead(), LocalDateTime.now());
                notificationStore.add(n);
            }
            return n;
        });
        return repo;
    }

    private MeetingRepository mockMeetingRepo() {
        MeetingRepository repo = mock(MeetingRepository.class);
        when(repo.findById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return meetingStore.stream().filter(m -> m.getMeetingId().equals(id)).findFirst();
        });
        when(repo.findAll(any(Specification.class), any(Sort.class))).thenAnswer(inv -> List.copyOf(meetingStore));
        when(repo.findAll(any(Specification.class), any(Pageable.class)))
                .thenAnswer(inv -> new PageImpl<>(List.copyOf(meetingStore)));
        when(repo.save(any(Meeting.class))).thenAnswer(inv -> {
            Meeting m = inv.getArgument(0);
            if (m.getMeetingId() == null) {
                LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
                m = new Meeting(nextMeetingId.getAndIncrement(), m.getProject(), m.getCreatedBy(),
                        m.getMeetingTopic(), m.getMeetingDescription(), m.getMeetingDate(),
                        m.getMeetingLink(), m.getStatus(), m.getCancelledAt(), nowUtc, nowUtc);
                meetingStore.add(m);
            }
            return m;
        });
        return repo;
    }

    private LinkFileRepository mockLinkFileRepo() {
        LinkFileRepository repo = mock(LinkFileRepository.class);
        when(repo.findByProject_ProjectId(anyInt())).thenAnswer(inv -> {
            int pid = inv.getArgument(0);
            return linkFileStore.stream()
                    .filter(l -> l.getProject().getProjectId().equals(pid))
                    .sorted(Comparator.comparing(LinkFile::getLinkFileId).reversed())
                    .toList();
        });
        when(repo.findByLinkFileIdAndProject_ProjectId(anyInt(), anyInt())).thenAnswer(inv -> {
            int lid = inv.getArgument(0);
            int pid = inv.getArgument(1);
            return linkFileStore.stream()
                    .filter(l -> l.getLinkFileId().equals(lid) && l.getProject().getProjectId().equals(pid))
                    .findFirst();
        });
        when(repo.save(any(LinkFile.class))).thenAnswer(inv -> {
            LinkFile l = inv.getArgument(0);
            if (l.getLinkFileId() == null) {
                l = new LinkFile(nextLinkId.getAndIncrement(), l.getLinkName(), l.getLinkUrl(),
                        l.getDescription(), l.getProject(), l.getUploader(), LocalDateTime.now());
                linkFileStore.add(l);
            }
            return l;
        });
        doAnswer(inv -> {
            LinkFile l = inv.getArgument(0);
            linkFileStore.removeIf(x -> x.getLinkFileId().equals(l.getLinkFileId()));
            return null;
        }).when(repo).delete(any(LinkFile.class));
        return repo;
    }

    private static String jsonString(String json, String key) {
        Matcher m = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
        if (!m.find()) throw new IllegalStateException("Missing string key '" + key + "' in: " + json);
        return m.group(1);
    }

    private static int jsonInt(String json, String key) {
        Matcher m = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(\\d+)").matcher(json);
        if (!m.find()) throw new IllegalStateException("Missing int key '" + key + "' in: " + json);
        return Integer.parseInt(m.group(1));
    }
}
