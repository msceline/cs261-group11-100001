package com.team.project.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.entity.Notification;
import com.team.project.entity.User;
import com.team.project.service.NotificationService;

class NotificationControllerTest {

    private NotificationService notificationService;
    private MockMvc mockMvc;
    private User user;

    @BeforeEach
    void setUp() {
        notificationService = mock(NotificationService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new NotificationController(notificationService)).build();
        user = new User(2, "6609650002", "student", "Two", "t@x.com", "hash", null);
    }

    private Notification notification(int id, String title, boolean read) {
        return new Notification(id, user, title, "message", "invite", read, LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @Test
    void getByUserReturnsNotificationResponses() throws Exception {
        when(notificationService.getNotificationsByUserId(2, 2))
                .thenReturn(List.of(notification(2, "New", false), notification(1, "Old", true)));

        mockMvc.perform(get("/api/notifications/user/2").requestAttr("userId", 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].userId").value(2))
                .andExpect(jsonPath("$[0].title").value("New"))
                .andExpect(jsonPath("$[0].isRead").value(false))
                .andExpect(jsonPath("$[1].isRead").value(true));
    }

    @Test
    void getByUserReturns403ForAnotherUsersNotifications() throws Exception {
        when(notificationService.getNotificationsByUserId(2, 5))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));

        mockMvc.perform(get("/api/notifications/user/5").requestAttr("userId", 2))
                .andExpect(status().isForbidden());
    }

    @Test
    void getByIdReturnsNotification() throws Exception {
        when(notificationService.getNotificationById(2, 1)).thenReturn(Optional.of(notification(1, "Old", true)));

        mockMvc.perform(get("/api/notifications/1").requestAttr("userId", 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.type").value("invite"));
    }

    @Test
    void getByIdUnknownReturns404() throws Exception {
        when(notificationService.getNotificationById(2, 999)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/notifications/999").requestAttr("userId", 2)).andExpect(status().isNotFound());
    }

    @Test
    void createReturns201WithNotification() throws Exception {
        when(notificationService.createNotification(2, "Title", "message", "invite", 2))
                .thenReturn(notification(5, "Title", false));

        mockMvc.perform(post("/api/notifications").requestAttr("userId", 2).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notificationTitle\":\"Title\",\"notificationMessage\":\"message\","
                                + "\"type\":\"invite\",\"userId\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.title").value("Title"))
                .andExpect(jsonPath("$.userId").value(2));
    }

    @Test
    void markAsReadReturnsUpdatedNotificationOnPatch() throws Exception {
        when(notificationService.markAsRead(2, 1)).thenReturn(notification(1, "Old", true));

        mockMvc.perform(patch("/api/notifications/1/read").requestAttr("userId", 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.isRead").value(true));
    }

    @Test
    void markAsReadReturnsUpdatedNotificationOnPut() throws Exception {
        when(notificationService.markAsRead(2, 1)).thenReturn(notification(1, "Old", true));

        mockMvc.perform(put("/api/notifications/1/read").requestAttr("userId", 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.isRead").value(true));
    }
}
