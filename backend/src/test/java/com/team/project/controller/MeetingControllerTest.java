package com.team.project.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

import com.team.project.entity.Meeting;
import com.team.project.entity.Project;
import com.team.project.entity.User;
import com.team.project.service.MeetingService;

class MeetingControllerTest {

    private MeetingService meetingService;
    private MockMvc mockMvc;

    private Project project;
    private User host;

    @BeforeEach
    void setUp() {
        meetingService = mock(MeetingService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new MeetingController(meetingService)).build();

        LocalDateTime created = LocalDateTime.of(2026, 1, 1, 0, 0);
        host = new User(1, "6609650001", "student", "Host User", "host@x.com", "hash", created);
        project = new Project(1, "P1", "CS261", host, 0, created);
    }

    private Meeting sampleMeeting(String status, LocalDateTime cancelledAt) {
        return new Meeting(
                10,
                project,
                host,
                "Sprint Planning",
                "Discuss backlog",
                LocalDateTime.of(2026, 12, 20, 7, 0),
                "https://meet.example.com/cs261",
                Meeting.TYPE_MEETING,
                status,
                cancelledAt,
                LocalDateTime.of(2026, 11, 16, 7, 0),
                LocalDateTime.of(2026, 11, 16, 7, 0)
        );
    }

    @Test
    void createReturns201WithMeetingResponse() throws Exception {
        when(meetingService.create(eq(1), any())).thenReturn(sampleMeeting(Meeting.STATUS_SCHEDULED, null));

        mockMvc.perform(post("/api/meetings")
                        .requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "projectId": 1,
                                  "meetingTopic": "Sprint Planning",
                                  "meetingDescription": "Discuss backlog",
                                  "meetingDate": "2026-12-20T14:00:00+07:00",
                                  "meetingLink": "https://meet.example.com/cs261"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.meetingId").value(10))
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.meetingTopic").value("Sprint Planning"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.createdBy.userId").value(1))
                .andExpect(jsonPath("$.createdBy.displayName").value("Host User"));
    }

    @Test
    void createReturns400OnInvalidDateFormat() throws Exception {
        mockMvc.perform(post("/api/meetings")
                        .requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "projectId": 1,
                                  "meetingTopic": "Sprint Planning",
                                  "meetingDate": "not-a-valid-date"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createReturns403ForNonHost() throws Exception {
        when(meetingService.create(eq(2), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only the project host can create, edit or cancel meetings"));

        mockMvc.perform(post("/api/meetings")
                        .requestAttr("userId", 2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "projectId": 1,
                                  "meetingTopic": "Sprint Planning",
                                  "meetingDate": "2026-12-20T14:00:00+07:00"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void listReturnsMeetingsForMemberAnd403ForNonMember() throws Exception {
        when(meetingService.search(eq(2), any())).thenReturn(List.of(sampleMeeting(Meeting.STATUS_SCHEDULED, null)));
        when(meetingService.search(eq(3), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project"));

        mockMvc.perform(get("/api/meetings")
                        .requestAttr("userId", 2)
                        .param("projectId", "1")
                        .param("month", "12")
                        .param("year", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].meetingTopic").value("Sprint Planning"));

        mockMvc.perform(get("/api/meetings")
                        .requestAttr("userId", 3)
                        .param("projectId", "1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getReturnsMeetingOr404WhenNotFound() throws Exception {
        when(meetingService.get(2, 10)).thenReturn(sampleMeeting(Meeting.STATUS_SCHEDULED, null));
        when(meetingService.get(2, 999))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found: 999"));

        mockMvc.perform(get("/api/meetings/10").requestAttr("userId", 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingId").value(10));

        mockMvc.perform(get("/api/meetings/999").requestAttr("userId", 2))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateReturns200ForHostAnd409WhenNotEditable() throws Exception {
        when(meetingService.update(eq(1), eq(10), any()))
                .thenReturn(sampleMeeting(Meeting.STATUS_SCHEDULED, null));
        when(meetingService.update(eq(1), eq(11), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Meeting 11 is already cancelled"));

        mockMvc.perform(patch("/api/meetings/10")
                        .requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"meetingTopic\":\"Updated Topic\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingId").value(10));

        mockMvc.perform(patch("/api/meetings/11")
                        .requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"meetingTopic\":\"Updated Topic\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void cancelReturns200WithCancelledStatus() throws Exception {
        when(meetingService.cancel(1, 10))
                .thenReturn(sampleMeeting(Meeting.STATUS_CANCELLED, LocalDateTime.of(2026, 11, 16, 8, 0)));

        mockMvc.perform(delete("/api/meetings/10").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelledAt").isNotEmpty());
    }
}
