package com.team.project.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.progress.MemberProgressResponse;
import com.team.project.dto.progress.ProjectProgressResponse;
import com.team.project.service.ProgressService;

class ProgressControllerTest {

    private ProgressService progressService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        progressService = mock(ProgressService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ProgressController(progressService)).build();
    }

    @Test
    void getProgressReturns200WithMemberBreakdown() throws Exception {
        ProjectProgressResponse response = ProjectProgressResponse.of(
                1, 5, 4,
                List.of(
                        new MemberProgressResponse(1, "6609650001", "User 1", "host", 5, 4, 80),
                        new MemberProgressResponse(2, "6609650002", "User 2", "member", 0, 0, 0)
                )
        );
        when(progressService.getProjectProgress(1, 1)).thenReturn(response);

        mockMvc.perform(get("/api/projects/1/progress").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.projectProgress").value(80))
                .andExpect(jsonPath("$.totalTasks").value(5))
                .andExpect(jsonPath("$.completedTasks").value(4))
                .andExpect(jsonPath("$.members.length()").value(2))
                .andExpect(jsonPath("$.members[0].tu_id").value("6609650001"))
                .andExpect(jsonPath("$.members[0].displayName").value("User 1"))
                .andExpect(jsonPath("$.members[0].roleInProject").value("host"))
                .andExpect(jsonPath("$.members[0].progressPercentage").value(80))
                .andExpect(jsonPath("$.members[1].progressPercentage").value(0));
    }

    @Test
    void getProgressReturns403ForNonMember() throws Exception {
        when(progressService.getProjectProgress(2, 1))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project"));

        mockMvc.perform(get("/api/projects/1/progress").requestAttr("userId", 2))
                .andExpect(status().isForbidden());
    }

    @Test
    void getProgressReturns404WhenProjectNotFound() throws Exception {
        when(progressService.getProjectProgress(1, 999))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        mockMvc.perform(get("/api/projects/999/progress").requestAttr("userId", 1))
                .andExpect(status().isNotFound());
    }
}
