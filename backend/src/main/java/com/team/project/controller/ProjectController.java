package com.team.project.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.project.CreateProjectRequest;
import com.team.project.dto.project.ProjectResponse;
import com.team.project.service.ProjectService;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@RequestAttribute("userId") int userId,
                                  @RequestBody CreateProjectRequest request) {
        return projectService.create(userId, request);
    }

    @GetMapping
    public List<ProjectResponse> list(@RequestAttribute("userId") int userId) {
        return projectService.listForMember(userId);
    }

    @GetMapping("/{projectId}")
    public ProjectResponse get(@RequestAttribute("userId") int userId, @PathVariable int projectId) {
        return projectService.get(userId, projectId);
    }
}
