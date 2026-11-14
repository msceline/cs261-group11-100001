package com.team.project.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.linkfile.CreateLinkFileRequest;
import com.team.project.dto.linkfile.UpdateLinkFileRequest;
import com.team.project.dto.linkfile.LinkFileResponse;
import com.team.project.entity.LinkFile;
import com.team.project.entity.Project;
import com.team.project.entity.User;
import com.team.project.repository.LinkFileRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;

@Service
public class LinkFileService {

    private final LinkFileRepository linkFileRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserService userService;

    public LinkFileService(
            LinkFileRepository linkFileRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository memberRepository,
            UserService userService) {

        this.linkFileRepository = linkFileRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.userService = userService;
    }

    // List all links in a project
    @Transactional(readOnly = true)
    public List<LinkFileResponse> list(int userId, int projectId) {
        findProject(projectId);
        checkMember(userId, projectId);

        return linkFileRepository.findByProject_ProjectId(projectId)
                .stream()
                .map(LinkFileResponse::from)
                .toList();
    }

    // Create a new link
    @Transactional
    public LinkFileResponse create(
            int userId, int projectId, CreateLinkFileRequest request) {

        Project project = findProject(projectId);
        checkMember(userId, projectId);

        if (request == null) {
            throw bad("Request body is required");
        }

        User uploader = userService.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        LinkFile linkFile = new LinkFile(
                null,
                request.getLinkName().trim(),
                request.getLinkUrl().trim(),
                request.getDescription(),
                project,
                uploader,
                null);

        return LinkFileResponse.from(linkFileRepository.save(linkFile));
    }

    // Get one link
    @Transactional(readOnly = true)
    public LinkFileResponse get(
            int userId, int projectId, int linkFileId) {

        checkMember(userId, projectId);

        LinkFile linkFile = findLink(linkFileId, projectId);

        return LinkFileResponse.from(linkFile);
    }

    // Update a link
    @Transactional
    public LinkFileResponse update(
            int userId,
            int projectId,
            int linkFileId,
            UpdateLinkFileRequest request) {

        checkMember(userId, projectId);

        if (request == null) {
            throw bad("Request body is required");
        }

        LinkFile linkFile = findLink(linkFileId, projectId);
        checkUploader(linkFile, userId);

        linkFile.setLinkName(request.getLinkName().trim());
        linkFile.setLinkUrl(request.getLinkUrl().trim());
        linkFile.setDescription(request.getDescription());

        return LinkFileResponse.from(linkFileRepository.save(linkFile));
    }

    // Delete a link
    @Transactional
    public void delete(int userId, int projectId, int linkFileId) {

        checkMember(userId, projectId);

        LinkFile linkFile = findLink(linkFileId, projectId);
        checkUploader(linkFile, userId);

        linkFileRepository.delete(linkFile);
    }

    private Project findProject(int projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Project not found"));
    }

    private LinkFile findLink(int linkFileId, int projectId) {
        return linkFileRepository
                .findByLinkFileIdAndProject_ProjectId(linkFileId, projectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Link not found"));
    }

    private void checkMember(int userId, int projectId) {
        if (!memberRepository.existsByProject_ProjectIdAndUser_UserId(
                projectId, userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not a member of this project");
        }
    }

    private void checkUploader(LinkFile linkFile, int userId) {
        if (!linkFile.getUploader().getUserId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only modify links uploaded by yourself");
        }
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST, message);
    }
}
