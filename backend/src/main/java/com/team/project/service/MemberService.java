package com.team.project.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.member.AddMemberRequest;
import com.team.project.dto.member.MemberResponse;
import com.team.project.entity.Project;
import com.team.project.entity.ProjectMember;
import com.team.project.entity.User;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;

@Service
public class MemberService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserService userService;

    public MemberService(ProjectRepository projectRepository, ProjectMemberRepository memberRepository,
                         UserService userService) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.userService = userService;
    }

    /** Members only. */
    public List<MemberResponse> list(int userId, int projectId) {
        findProject(projectId);
        if (!memberRepository.existsByProject_ProjectIdAndUser_UserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project");
        }
        return memberRepository.findByProject_ProjectId(projectId).stream()
                .flatMap(m -> userService.findById(m.getUserId()).map(u -> MemberResponse.from(m, u)).stream())
                .toList();
    }

    /** Host only. The added user always becomes a "member". */
    public MemberResponse add(int userId, int projectId, AddMemberRequest req) {
        Project project = findProject(projectId);
        if (!project.getHost().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can add members");
        }
        if (req == null || req.tuId() == null || req.tuId().isBlank()) throw bad("tuId is required");
        User user = userService.findByStudentId(req.tuId().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (memberRepository.existsByProject_ProjectIdAndUser_UserId(projectId, user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a member");
        }
        return MemberResponse.from(memberRepository.save(new ProjectMember(null, user, project, "member", null)), user);
    }

    private Project findProject(int projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
