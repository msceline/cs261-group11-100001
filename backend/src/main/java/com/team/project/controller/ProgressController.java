package com.team.project.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.progress.ProjectProgressResponse;
import com.team.project.service.ProgressService;

@RestController
@RequestMapping("/api/projects/{projectId}/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public ProjectProgressResponse getProgress(@RequestAttribute("userId") int userId,
                                               @PathVariable int projectId) {
        return progressService.getProjectProgress(userId, projectId);
    }
}
