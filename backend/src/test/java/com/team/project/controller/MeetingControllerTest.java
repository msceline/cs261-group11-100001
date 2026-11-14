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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.team.project.dto.meeting.MeetingResponse;
import com.team.project.service.MeetingService;

class MeetingControllerTest {

    private MeetingService meetingService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        meetingService = mock(MeetingService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new MeetingController(meetingService)).build();
    }

    private static MeetingResponse meeting() {
        return new MeetingResponse(20, 10, "Planning", LocalDateTime.of(2026, 11, 20, 14, 30),
                "https://meet.example/room", "Review milestones");
    }

    @Test
    void createReturnsMeeting() throws Exception {
        when(meetingService.create(eq(1), eq(10), any())).thenReturn(meeting());

        mockMvc.perform(post("/api/projects/10/meetings").requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"Planning\",\"dateTime\":\"2026-11-20T14:30\",\"location\":\"https://meet.example/room\",\"description\":\"Review milestones\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.meetingId").value(20))
                .andExpect(jsonPath("$.projectId").value(10))
                .andExpect(jsonPath("$.dateTime").value("2026-11-20T14:30:00"))
                .andExpect(jsonPath("$.location").value("https://meet.example/room"));
    }

    @Test
    void listReturnsProjectMeetings() throws Exception {
        when(meetingService.listForProject(1, 10)).thenReturn(List.of(meeting()));

        mockMvc.perform(get("/api/projects/10/meetings").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].topic").value("Planning"));
    }
}
