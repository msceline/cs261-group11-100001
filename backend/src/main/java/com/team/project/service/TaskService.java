package com.team.project.service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.task.CreateTaskRequest;
import com.team.project.entity.Project;
import com.team.project.entity.Task;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.TaskRepository;
import com.team.project.repository.UserRepository;

/** Members of a project can read, create and edit its tasks. */
@Service
public class TaskService {

    private static final String DONE = "done";
    private static final Set<String> STATUSES = Set.of("todo", "doing", DONE);

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository memberRepository;
    private final NotificationService notificationService;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
                       UserRepository userRepository, ProjectMemberRepository memberRepository,
                       NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.notificationService = notificationService;
    }

    /** Tasks of every project the user belongs to. */
    public List<Task> listForMember(int userId) {
        return memberRepository.findByUser_UserId(userId).stream()
                .flatMap(m -> taskRepository.findByProject_ProjectId(m.getProjectId()).stream())
                .toList();
    }

    /** Every task of every project. Not permission-checked: for background jobs only, never for API responses. */
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(int userId, int taskId) {
        Optional<Task> task = taskRepository.findById(taskId);
        task.ifPresent(t -> requireMember(userId, t.getProject().getProjectId()));
        return task;
    }

    public Task createTask(int userId, CreateTaskRequest req) {
        if (req == null || req.projectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId is required");
        }
        Project project = projectRepository.findById(req.projectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        requireMember(userId, project.getProjectId());
        Task task = new Task();
        task.setProject(project);
        applyCreate(task, req);
        Task saved = taskRepository.save(task);
        refreshProgress(project);
        if (notificationService != null && saved.getAssignee() != null
                && !saved.getAssignee().getUserId().equals(userId)) {
            notificationService.createSystemNotification(
                    "คุณได้รับมอบหมายงานใหม่",
                    "คุณได้รับมอบหมายงาน \"" + saved.getTitle() + "\" ในโปรเจกต์ \"" + project.getProjectName() + "\"",
                    "task_assigned",
                    saved.getAssignee().getUserId());
        }
        return saved;
    }

    /** Updates the editable fields of an existing task; empty when the task does not exist. */
    public Optional<Task> updateTask(int userId, int taskId, CreateTaskRequest req) {
        return taskRepository.findById(taskId).map(task -> {
            requireMember(userId, task.getProject().getProjectId());
            Integer oldAssigneeId = task.getAssignee() != null ? task.getAssignee().getUserId() : null;
            applyUpdate(task, req);
            Task saved = taskRepository.save(task);
            refreshProgress(task.getProject());
            Integer newAssigneeId = saved.getAssignee() != null ? saved.getAssignee().getUserId() : null;
            if (notificationService != null && newAssigneeId != null
                    && !newAssigneeId.equals(oldAssigneeId)
                    && !newAssigneeId.equals(userId)) {
                notificationService.createSystemNotification(
                        "คุณได้รับมอบหมายงานใหม่",
                        "คุณได้รับมอบหมายงาน \"" + saved.getTitle() + "\" ในโปรเจกต์ \"" + task.getProject().getProjectName() + "\"",
                        "task_assigned",
                        newAssigneeId);
            }
            return saved;
        });
    }

    /** Project progress = done tasks / all tasks * 100 (rounded down), recalculated whenever a task changes. */
    private void refreshProgress(Project project) {
        long total = taskRepository.countByProject_ProjectId(project.getProjectId());
        long done = taskRepository.countByProject_ProjectIdAndStatus(project.getProjectId(), DONE);
        project.setProgress(total == 0 ? 0 : (int) (done * 100 / total));
        projectRepository.save(project);
    }

    private void requireMember(int userId, int projectId) {
        memberRepository.findByProject_ProjectIdAndUser_UserId(projectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not a member of this project"));
    }

    private void applyCreate(Task task, CreateTaskRequest req) {
        String title = req.taskTitle() == null ? "" : req.taskTitle().trim();
        if (title.isEmpty() || title.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "taskTitle must be 1-200 characters");
        }
        task.setTitle(title);
        task.setTaskDescription(req.taskDescription());
        task.setDueDate(req.dueDate());
        if (req.status() != null) {
            if (!STATUSES.contains(req.status())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be todo, doing or done");
            }
            task.setStatus(req.status());
        }
        task.setAssignee(req.assigneeId() == null ? null : findAssignee(task.getProject(), req.assigneeId()));
    }

    private void applyUpdate(Task task, CreateTaskRequest req) {
        if (req == null) return;

        if (req.taskTitle() != null) {
            String title = req.taskTitle().trim();
            if (title.isEmpty() || title.length() > 200) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "taskTitle must be 1-200 characters");
            }
            task.setTitle(title);
        }
        if (req.taskDescription() != null) {
            task.setTaskDescription(req.taskDescription());
        }
        if (req.dueDate() != null) {
            task.setDueDate(req.dueDate());
        }
        if (req.status() != null) {
            if (!STATUSES.contains(req.status())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be todo, doing or done");
            }
            task.setStatus(req.status());
        }
        if (req.assigneeId() != null) {
            if (req.assigneeId() <= 0) {
                task.setAssignee(null);
            } else {
                task.setAssignee(findAssignee(task.getProject(), req.assigneeId()));
            }
        }
    }

    private User findAssignee(Project project, int assigneeId) {
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));
        if (!memberRepository.existsByProject_ProjectIdAndUser_UserId(project.getProjectId(), assigneeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignee must be a member of the project");
        }
        return assignee;
    }
}
