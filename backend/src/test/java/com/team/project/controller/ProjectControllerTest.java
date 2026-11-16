package com.team.project.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.project.ProjectResponse;
import com.team.project.service.ProjectService;

class ProjectControllerTest {

    private ProjectService projectService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        projectService = mock(ProjectService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ProjectController(projectService)).build();
    }

    private static ProjectResponse project(int id, String name, int hostId) {
        return new ProjectResponse(id, name, "CS261", hostId, 12, LocalDateTime.of(2026, 2, 1, 0, 0));
    }

    @Test
    void createReturns201WithProject() throws Exception {
        when(projectService.create(eq(1), any())).thenReturn(project(3, "New", 1));

        mockMvc.perform(post("/api/projects").requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectName\":\"New\",\"subjectCode\":\"CS261\",\"createdAt\":\"2026-02-01\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value(3))
                .andExpect(jsonPath("$.hostId").value(1))
                .andExpect(jsonPath("$.progress").value(12));
    }

    @Test
    void createWithInvalidDataReturns400() throws Exception {
        when(projectService.create(eq(1), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectName must be 1-100 characters"));

        mockMvc.perform(post("/api/projects").requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectName\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listReturnsProjectsOfCurrentUser() throws Exception {
        when(projectService.listForMember(1)).thenReturn(List.of(project(1, "A", 1), project(2, "B", 2)));

        mockMvc.perform(get("/api/projects").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].projectName").value("A"));
    }

    @Test
    void listReturnsEmptyArrayWhenNoProjects() throws Exception {
        when(projectService.listForMember(7)).thenReturn(List.of());

        mockMvc.perform(get("/api/projects").requestAttr("userId", 7))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getReturnsProjectForMember() throws Exception {
        when(projectService.get(1, 1)).thenReturn(project(1, "A", 1));

        mockMvc.perform(get("/api/projects/1").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectName").value("A"));
    }

    @Test
    void getReturns403ForNonMember() throws Exception {
        when(projectService.get(1, 2)).thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));

        mockMvc.perform(get("/api/projects/2").requestAttr("userId", 1))
                .andExpect(status().isForbidden());
    }

    @Test
    void getReturns404ForUnknownProject() throws Exception {
        when(projectService.get(1, 99)).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/projects/99").requestAttr("userId", 1))
                .andExpect(status().isNotFound());
    }

    @Test
    void getWithNonNumericIdReturns400() throws Exception {
        mockMvc.perform(get("/api/projects/abc").requestAttr("userId", 1))
                .andExpect(status().isBadRequest());
    }
}
