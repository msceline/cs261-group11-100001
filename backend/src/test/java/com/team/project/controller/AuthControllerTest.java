package com.team.project.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.team.project.dto.auth.LoginResponse;
import com.team.project.dto.auth.UserResponse;
import com.team.project.service.AuthService;

class AuthControllerTest {

    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService)).build();
    }

    private static UserResponse user() {
        return new UserResponse(1, "6609650001", "Somchai", "s@x.com", LocalDateTime.of(2026, 1, 1, 0, 0), "student");
    }

    @Test
    void loginSuccessReturns200WithTokenAndUser() throws Exception {
        when(authService.login(any())).thenReturn(Optional.of(new LoginResponse("jwt-token", user())));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"6609650001\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.user.tu_id").value("6609650001"));
    }

    @Test
    void loginFailureReturns401WithErrorMessage() throws Exception {
        when(authService.login(any())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"6609650001\",\"password\":\"bad\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void loginWithoutBodyReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void meReturnsCurrentUser() throws Exception {
        when(authService.me(1)).thenReturn(Optional.of(user()));

        mockMvc.perform(get("/api/auth/me").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.displayName").value("Somchai"));
    }

    @Test
    void meReturns404WhenUserNoLongerExists() throws Exception {
        when(authService.me(5)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/me").requestAttr("userId", 5))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }
}
