package com.team.project.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.project.CreateProjectRequest;
import com.team.project.dto.project.ProjectResponse;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.UserRepository;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository memberRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    /** The caller becomes the host and is added as a member with role "host". */
    public ProjectResponse create(int userId, CreateProjectRequest req) {
        if (req == null) throw bad("Request body is required");
        String name = req.projectName() == null ? "" : req.projectName().trim();
        if (name.isEmpty() || name.length() > 100) throw bad("projectName must be 1-100 characters");
        String subject = req.subjectCode() == null ? "" : req.subjectCode().trim();
        if (subject.isEmpty() || subject.length() > 20) throw bad("subjectCode must be 1-20 characters");
        User host = userRepository.getReferenceById(userId);
        LocalDateTime createdAt = req.createdAt() != null ? req.createdAt().atStartOfDay() : LocalDateTime.now();
        Project project = projectRepository.save(
                new Project(null, name, subject, host, 0, createdAt));
        memberRepository.save(new ProjectMember(null, host, project, "host", null));
        return ProjectResponse.from(project);
    }

    public List<ProjectResponse> listForMember(int userId) {
        return memberRepository.findByUser_UserId(userId).stream()
                .map(m -> projectRepository.findById(m.getProjectId()))
                .flatMap(java.util.Optional::stream)
                .map(ProjectResponse::from)
                .toList();
    }

    /** Members only. */
    public ProjectResponse get(int userId, int projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        if (!memberRepository.existsByProject_ProjectIdAndUser_UserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project");
        }
        return ProjectResponse.from(project);
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
