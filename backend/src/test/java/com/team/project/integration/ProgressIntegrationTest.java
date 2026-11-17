package com.team.project.integration;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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

import com.team.project.controller.ProgressController;
import com.team.project.controller.TaskController;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.Task;
import com.team.project.entity.User;
import com.team.project.exception.GlobalExceptionHandler;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.TaskRepository;
import com.team.project.repository.UserRepository;
import com.team.project.security.JwtFilter;
import com.team.project.security.JwtService;
import com.team.project.service.ProgressService;
import com.team.project.service.TaskService;

/**
 * Integration test wiring JwtFilter -> TaskController / ProgressController -> TaskService / ProgressService
 * against a shared in-memory task store so task mutations immediately reflect in member progress.
 */
class ProgressIntegrationTest {

    private MockMvc mockMvc;
    private JwtService jwtService;
    private List<Task> taskStore;
    private AtomicInteger nextTaskId;

    private User hostUser;
    private User memberA;
    private User memberB;
    private User outsiderUser;
    private Project project1;

    private String bearer(int userId) {
        return "Bearer " + jwtService.generateToken(userId);
    }

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.of(2026, 2, 1, 10, 0);
        hostUser = new User(1, "6609650001", "student", "Somchai Jaidee", "u1@dome.tu.ac.th", "hash", now);
        memberA = new User(2, "6609650002", "student", "Somying Rakdee", "u2@dome.tu.ac.th", "hash", now);
        memberB = new User(3, "6609650003", "student", "Somchart Meesuk", "u3@dome.tu.ac.th", "hash", now);
        outsiderUser = new User(4, "6609650004", "student", "Outsider", "u4@dome.tu.ac.th", "hash", now);
        project1 = new Project(1, "TU-WorkSpace-Group11", "CS261", hostUser, 0, now);

        taskStore = new ArrayList<>();
        nextTaskId = new AtomicInteger(1);
        taskStore.add(new Task(nextTaskId.getAndIncrement(), project1, "Host Done Task", hostUser, "done", now.plusDays(5), null, now));
        taskStore.add(new Task(nextTaskId.getAndIncrement(), project1, "MemberA Done", memberA, "done", now.plusDays(5), null, now));
        taskStore.add(new Task(nextTaskId.getAndIncrement(), project1, "MemberA Doing", memberA, "doing", now.plusDays(6), null, now));
        taskStore.add(new Task(nextTaskId.getAndIncrement(), project1, "MemberA Todo", memberA, "todo", now.plusDays(7), null, now));
        taskStore.add(new Task(nextTaskId.getAndIncrement(), project1, "Unassigned Todo", null, "todo", now.plusDays(8), null, now));

        ProjectRepository projectRepository = mock(ProjectRepository.class);
        ProjectMemberRepository memberRepository = mock(ProjectMemberRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        TaskRepository taskRepository = mock(TaskRepository.class);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        for (User u : List.of(hostUser, memberA, memberB, outsiderUser)) {
            when(userRepository.findById(u.getUserId())).thenReturn(Optional.of(u));
        }

        List<ProjectMember> memberships = List.of(
                new ProjectMember(1, hostUser, project1, "host", now),
                new ProjectMember(2, memberA, project1, "member", now),
                new ProjectMember(3, memberB, project1, "member", now)
        );
        when(memberRepository.findByProject_ProjectId(1)).thenReturn(memberships);
        for (ProjectMember pm : memberships) {
            int uid = pm.getUserId();
            when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, uid)).thenReturn(true);
            when(memberRepository.findByProject_ProjectIdAndUser_UserId(1, uid)).thenReturn(Optional.of(pm));
            when(memberRepository.findByUser_UserId(uid)).thenReturn(List.of(pm));
        }
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, outsiderUser.getUserId())).thenReturn(false);

        when(taskRepository.findByProject_ProjectId(1)).thenAnswer(inv -> List.copyOf(taskStore));
        when(taskRepository.findById(anyInt())).thenAnswer(inv -> {
            int id = inv.getArgument(0);
            return taskStore.stream().filter(t -> t.getTaskId().equals(id)).findFirst();
        });
        when(taskRepository.countByProject_ProjectId(1)).thenAnswer(inv -> (long) taskStore.size());
        when(taskRepository.countByProject_ProjectIdAndStatus(eq(1), any())).thenAnswer(inv -> {
            String status = inv.getArgument(1);
            return taskStore.stream().filter(t -> status.equalsIgnoreCase(t.getStatus())).count();
        });
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            if (t.getTaskId() == null) {
                t.setTaskId(nextTaskId.getAndIncrement());
                taskStore.add(t);
            }
            return t;
        });
        doAnswer(inv -> {
            Task t = inv.getArgument(0);
            taskStore.removeIf(existing -> existing.getTaskId().equals(t.getTaskId()));
            return null;
        }).when(taskRepository).delete(any(Task.class));

        jwtService = new JwtService("integration-test-secret-key-at-least-32-chars", 3600);
        JwtFilter jwtFilter = new JwtFilter(jwtService);
        TaskService taskService = new TaskService(taskRepository, projectRepository, userRepository, memberRepository, null);
        ProgressService progressService = new ProgressService(projectRepository, memberRepository, taskRepository);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new TaskController(taskService), new ProgressController(progressService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(jwtFilter)
                .build();
    }

    @Test
    void memberViewsProjectAndMemberProgressAcrossStatusesAndZeroTasks() throws Exception {
        mockMvc.perform(get("/api/projects/1/progress")
                        .header("Authorization", bearer(memberA.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.totalTasks").value(5))
                .andExpect(jsonPath("$.completedTasks").value(2))
                .andExpect(jsonPath("$.projectProgress").value(40))
                .andExpect(jsonPath("$.members.length()").value(3))
                .andExpect(jsonPath("$.members[0].displayName").value("Somchai Jaidee"))
                .andExpect(jsonPath("$.members[0].progressPercentage").value(100))
                .andExpect(jsonPath("$.members[1].displayName").value("Somying Rakdee"))
                .andExpect(jsonPath("$.members[1].totalTasks").value(3))
                .andExpect(jsonPath("$.members[1].completedTasks").value(1))
                .andExpect(jsonPath("$.members[1].progressPercentage").value(33))
                .andExpect(jsonPath("$.members[2].displayName").value("Somchart Meesuk"))
                .andExpect(jsonPath("$.members[2].totalTasks").value(0))
                .andExpect(jsonPath("$.members[2].completedTasks").value(0))
                .andExpect(jsonPath("$.members[2].progressPercentage").value(0));
    }

    @Test
    void updatingCreatingAndDeletingTasksUpdatesProgressInRealTime() throws Exception {
        // US7 TC2: Change MemberA's "doing" task (#3) to "done" -> 2/3 = 67%
        mockMvc.perform(patch("/api/tasks/3")
                        .header("Authorization", bearer(hostUser.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"done\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"));

        mockMvc.perform(get("/api/projects/1/progress")
                        .header("Authorization", bearer(memberA.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedTasks").value(3))
                .andExpect(jsonPath("$.projectProgress").value(60))
                .andExpect(jsonPath("$.members[1].completedTasks").value(2))
                .andExpect(jsonPath("$.members[1].progressPercentage").value(67));

        // US7 TC5: Complete MemberA's final task (#4) -> 3/3 = 100%
        mockMvc.perform(patch("/api/tasks/4")
                        .header("Authorization", bearer(hostUser.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"done\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/projects/1/progress")
                        .header("Authorization", bearer(hostUser.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedTasks").value(4))
                .andExpect(jsonPath("$.projectProgress").value(80))
                .andExpect(jsonPath("$.members[1].completedTasks").value(3))
                .andExpect(jsonPath("$.members[1].progressPercentage").value(100));

        // Assign a new todo task to MemberB (still 0%) then delete it as host
        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", bearer(hostUser.getUserId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":1,\"taskTitle\":\"New Task for MemberB\",\"assigneeId\":3,\"status\":\"todo\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.taskId").value(6));

        mockMvc.perform(get("/api/projects/1/progress")
                        .header("Authorization", bearer(memberB.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(6))
                .andExpect(jsonPath("$.members[2].totalTasks").value(1))
                .andExpect(jsonPath("$.members[2].completedTasks").value(0))
                .andExpect(jsonPath("$.members[2].progressPercentage").value(0));

        mockMvc.perform(delete("/api/tasks/6")
                        .header("Authorization", bearer(hostUser.getUserId())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/1/progress")
                        .header("Authorization", bearer(memberB.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(5))
                .andExpect(jsonPath("$.members[2].totalTasks").value(0))
                .andExpect(jsonPath("$.members[2].progressPercentage").value(0));
    }

    @Test
    void nonMemberReceives403WithoutLinkfileMessageAndUnauthenticatedGets401() throws Exception {
        // US7 TC3: Non-member tries to view another workspace's progress
        mockMvc.perform(get("/api/projects/1/progress")
                        .header("Authorization", bearer(outsiderUser.getUserId())))
                .andExpect(status().isForbidden())
                .andExpect(content().string(not(containsString("linkfile"))));

        // Unauthenticated request blocked by JwtFilter
        mockMvc.perform(get("/api/projects/1/progress"))
                .andExpect(status().isUnauthorized());
    }
}
