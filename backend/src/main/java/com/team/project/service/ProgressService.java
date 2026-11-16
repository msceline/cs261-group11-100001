package com.team.project.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.progress.MemberProgressResponse;
import com.team.project.dto.progress.ProjectProgressResponse;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.Task;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.TaskRepository;

/** Computes overall and per-member task completion progress within a project. */
@Service
public class ProgressService {

    private static final String DONE = "done";

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final TaskRepository taskRepository;

    public ProgressService(ProjectRepository projectRepository,
                           ProjectMemberRepository memberRepository,
                           TaskRepository taskRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
    }

    /** Returns project-wide and per-member task progress for members of the given project. */
    @Transactional(readOnly = true)
    public ProjectProgressResponse getProjectProgress(int userId, int projectId) {
        if (projectRepository.findById(projectId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
        if (!memberRepository.existsByProject_ProjectIdAndUser_UserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project");
        }

        List<ProjectMember> members = memberRepository.findByProject_ProjectId(projectId);
        List<Task> tasks = taskRepository.findByProject_ProjectId(projectId);

        int totalProjectTasks = tasks.size();
        int completedProjectTasks = 0;
        Map<Integer, int[]> countsByUserId = new HashMap<>();

        for (Task task : tasks) {
            boolean isDone = DONE.equalsIgnoreCase(task.getStatus());
            if (isDone) {
                completedProjectTasks++;
            }
            User assignee = task.getAssignee();
            if (assignee != null && assignee.getUserId() != null) {
                int[] counts = countsByUserId.computeIfAbsent(assignee.getUserId(), k -> new int[2]);
                counts[0]++;
                if (isDone) {
                    counts[1]++;
                }
            }
        }

        List<MemberProgressResponse> memberProgress = members.stream()
                .filter(m -> m.getUser() != null && m.getUser().getUserId() != null)
                .map(m -> {
                    User user = m.getUser();
                    int[] counts = countsByUserId.getOrDefault(user.getUserId(), new int[2]);
                    return MemberProgressResponse.from(m, user, counts[0], counts[1]);
                })
                .toList();

        return ProjectProgressResponse.of(projectId, totalProjectTasks, completedProjectTasks, memberProgress);
    }
}
