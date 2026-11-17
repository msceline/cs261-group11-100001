package com.team.project.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.linkfile.CreateLinkFileRequest;
import com.team.project.dto.linkfile.UpdateLinkFileRequest;
import com.team.project.dto.linkfile.LinkFileResponse;
import com.team.project.service.LinkFileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects/{projectId}/linkfiles")
public class LinkFileController {

    private final LinkFileService linkFileService;

    public LinkFileController(LinkFileService linkFileService) {
        this.linkFileService = linkFileService;
    }

    // Get all links in a project
    @GetMapping
    public List<LinkFileResponse> list(
            @RequestAttribute("userId") int userId,
            @PathVariable int projectId) {

        return linkFileService.list(userId, projectId);
    }

    // Create a new link
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LinkFileResponse create(
            @RequestAttribute("userId") int userId,
            @PathVariable int projectId,
            @Valid @RequestBody CreateLinkFileRequest request) {

        return linkFileService.create(userId, projectId, request);
    }

    // Get one link
    @GetMapping("/{linkFileId}")
    public LinkFileResponse get(
            @RequestAttribute("userId") int userId,
            @PathVariable int projectId,
            @PathVariable int linkFileId) {

        return linkFileService.get(userId, projectId, linkFileId);
    }

    // Update a link
    @PutMapping("/{linkFileId}")
    public LinkFileResponse update(
            @RequestAttribute("userId") int userId,
            @PathVariable int projectId,
            @PathVariable int linkFileId,
            @Valid @RequestBody UpdateLinkFileRequest request) {

        return linkFileService.update(
                userId, projectId, linkFileId, request);
    }

    // Delete a link
    @DeleteMapping("/{linkFileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestAttribute("userId") int userId,
            @PathVariable int projectId,
            @PathVariable int linkFileId) {

        linkFileService.delete(userId, projectId, linkFileId);
    }
}
