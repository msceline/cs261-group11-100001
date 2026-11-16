package com.team.project.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.member.AddMemberRequest;
import com.team.project.dto.member.InvitationResponse;
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
    private final TuStudentService tuStudentService;
    private final NotificationService notificationService;

    public MemberService(ProjectRepository projectRepository, ProjectMemberRepository memberRepository,
                         UserService userService, TuStudentService tuStudentService,
                         NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.userService = userService;
        this.tuStudentService = tuStudentService;
        this.notificationService = notificationService;
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

    /**
     * Host only. Sends an invitation: the user is stored as a "member" with status "pending" and gets a
     * notification. They join once they call accept().
     */
    public MemberResponse add(int userId, int projectId, AddMemberRequest req) {
        Project project = findProject(projectId);
        if (!project.getHost().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can add members");
        }
        if (req == null || req.tu_id() == null || req.tu_id().isBlank()) throw bad("tu_id is required");
        User user = tuStudentService.findOrCreateUser(req.tu_id().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No such student id in TU"));
        ProjectMember existing = memberRepository.findAnyStatus(projectId, user.getUserId()).orElse(null);
        if (existing != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    ProjectMember.STATUS_PENDING.equals(existing.getStatus())
                            ? "User has already been invited" : "User is already a member");
        }
        ProjectMember saved = memberRepository.save(
                new ProjectMember(null, user, project, "member", ProjectMember.STATUS_PENDING, null));
        if (notificationService != null) {
            notificationService.createSystemNotification(
                    "คำเชิญเข้าร่วมกลุ่มโปรเจกต์",
                    "คุณได้รับคำเชิญเข้าร่วมกลุ่มโปรเจกต์ \"" + project.getProjectName() + "\"",
                    "invite",
                    user.getUserId());
        }
        return MemberResponse.from(saved, user);
    }

    /** The invited user confirms: pending becomes accepted and the host is told. */
    public MemberResponse accept(int userId, int projectId) {
        Project project = findProject(projectId);
        ProjectMember member = memberRepository.findAnyStatus(projectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No invitation for this project"));
        if (ProjectMember.STATUS_ACCEPTED.equals(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already a member");
        }
        member.setStatus(ProjectMember.STATUS_ACCEPTED);
        ProjectMember saved = memberRepository.save(member);
        User user = saved.getUser();
        if (notificationService != null && !project.getHost().getUserId().equals(userId)) {
            notificationService.createSystemNotification(
                    "สมาชิกตอบรับคำเชิญ",
                    user.getDisplayName() + " ได้เข้าร่วมกลุ่มโปรเจกต์ \"" + project.getProjectName() + "\"",
                    "invite_accepted",
                    project.getHost().getUserId());
        }
        return MemberResponse.from(saved, user);
    }

    /** Invitations the caller has not answered yet. */
    public List<InvitationResponse> pendingInvitations(int userId) {
        return memberRepository.findByUser_UserIdAndStatus(userId, ProjectMember.STATUS_PENDING).stream()
                .map(m -> InvitationResponse.from(m.getProject()))
                .toList();
    }

    private Project findProject(int projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
