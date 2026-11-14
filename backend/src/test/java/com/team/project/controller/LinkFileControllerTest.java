package com.team.project.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

import com.team.project.dto.linkfile.CreateLinkFileRequest;
import com.team.project.dto.linkfile.UpdateLinkFileRequest;
import com.team.project.dto.linkfile.LinkFileResponse;
import com.team.project.service.LinkFileService;

class LinkFileControllerTest {

    private LinkFileService linkFileService;
    private MockMvc mockMvc;

    private static final String BASE_URL =
            "/api/projects/1/linkfiles";

    private static final String CREATE_BODY =
            "{\"linkName\":\"Documentation\","
            + "\"linkUrl\":\"https://example.com\","
            + "\"description\":\"Project docs\"}";

    private static final String UPDATE_BODY =
            "{\"linkName\":\"Updated Docs\","
            + "\"linkUrl\":\"https://example.com/updated\","
            + "\"description\":\"Updated description\"}";

    @BeforeEach
    void setUp() {
        linkFileService = mock(LinkFileService.class);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new LinkFileController(linkFileService))
                .build();
    }

    private LinkFileResponse linkFile(int id, String name) {
        return new LinkFileResponse(
                id,
                1,
                name,
                "https://example.com",
                "Project docs",
                1,
                LocalDateTime.of(2026, 11, 14, 10, 0)
        );
    }

    @Test
    void listReturnsLinkFiles() throws Exception {
        when(linkFileService.list(1, 1))
                .thenReturn(List.of(
                        linkFile(1, "Docs"),
                        linkFile(2, "GitHub")
                ));

        mockMvc.perform(get(BASE_URL)
                .requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].linkFileId").value(1))
                .andExpect(jsonPath("$[0].linkName").value("Docs"))
                .andExpect(jsonPath("$[1].linkName").value("GitHub"));
    }

    @Test
    void listReturns403ForNonMember() throws Exception {
        when(linkFileService.list(5, 1))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.FORBIDDEN));

        mockMvc.perform(get(BASE_URL)
                .requestAttr("userId", 5))
                .andExpect(status().isForbidden());
    }

    @Test
    void getReturnsLinkFile() throws Exception {
        when(linkFileService.get(1, 1, 10))
                .thenReturn(linkFile(10, "Documentation"));

        mockMvc.perform(get(BASE_URL + "/10")
                .requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linkFileId").value(10))
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.linkName").value("Documentation"))
                .andExpect(jsonPath("$.uploaderId").value(1));
    }

    @Test
    void getReturns403ForNonMember() throws Exception {
        when(linkFileService.get(5, 1, 10))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.FORBIDDEN));

        mockMvc.perform(get(BASE_URL + "/10")
                .requestAttr("userId", 5))
                .andExpect(status().isForbidden());
    }

    @Test
    void createReturns201() throws Exception {
        when(linkFileService.create(eq(1), eq(1), any(CreateLinkFileRequest.class)))
                .thenReturn(linkFile(10, "Documentation"));

        mockMvc.perform(post(BASE_URL)
                .requestAttr("userId", 1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(CREATE_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.linkFileId").value(10))
                .andExpect(jsonPath("$.linkName").value("Documentation"));

        verify(linkFileService)
                .create(eq(1), eq(1), any(CreateLinkFileRequest.class));
    }

    @Test
    void updateReturnsUpdatedLinkFile() throws Exception {
        when(linkFileService.update(
                eq(1), eq(1), eq(10), any(UpdateLinkFileRequest.class)))
                .thenReturn(linkFile(10, "Updated Docs"));

        mockMvc.perform(put(BASE_URL + "/10")
                .requestAttr("userId", 1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(UPDATE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linkFileId").value(10))
                .andExpect(jsonPath("$.linkName").value("Updated Docs"));
    }

    @Test
    void updateReturns403ForNonUploader() throws Exception {
        when(linkFileService.update(
                eq(2), eq(1), eq(10), any(UpdateLinkFileRequest.class)))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.FORBIDDEN));

        mockMvc.perform(put(BASE_URL + "/10")
                .requestAttr("userId", 2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(UPDATE_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteReturns204() throws Exception {
        mockMvc.perform(delete(BASE_URL + "/10")
                .requestAttr("userId", 1))
                .andExpect(status().isNoContent());

        verify(linkFileService).delete(1, 1, 10);
    }

    @Test
    void deleteReturns403ForNonUploader() throws Exception {
        org.mockito.Mockito.doThrow(
                new ResponseStatusException(HttpStatus.FORBIDDEN))
                .when(linkFileService).delete(2, 1, 10);

        mockMvc.perform(delete(BASE_URL + "/10")
                .requestAttr("userId", 2))
                .andExpect(status().isForbidden());
    }
}
