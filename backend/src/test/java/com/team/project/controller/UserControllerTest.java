package com.team.project.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.team.project.entity.User;
import com.team.project.service.TuAuthClient.TuStudent;
import com.team.project.service.TuStudentService;
import com.team.project.service.UserService;

class UserControllerTest {

    private UserService userService;
    private TuStudentService tuStudentService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        tuStudentService = mock(TuStudentService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new UserController(userService, tuStudentService)).build();
    }

    private static User user(int id, String name, String email) {
        return new User(id, "660965000" + id, "student", name, email, "hash", LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @Test
    void getMeReturnsOwnProfileWithoutPassword() throws Exception {
        when(userService.findById(1)).thenReturn(Optional.of(user(1, "Somchai", "s@x.com")));

        mockMvc.perform(get("/api/users/me").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("s@x.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void getMeReturns404WhenMissing() throws Exception {
        when(userService.findById(9)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/me").requestAttr("userId", 9))
                .andExpect(status().isNotFound());
    }

    @Test
    void lookupByTuIdAsksTuAndReturnsOnlyIdAndName() throws Exception {
        when(tuStudentService.lookup("6609650002")).thenReturn(Optional.of(new TuStudent("6609650002", "Somying")));

        mockMvc.perform(get("/api/users/6609650002").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tu_id").value("6609650002"))
                .andExpect(jsonPath("$.displayName").value("Somying"))
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    void lookupByTuIdReturns404WhenTuHasNoSuchStudent() throws Exception {
        when(tuStudentService.lookup("0000000000")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/0000000000").requestAttr("userId", 1))
                .andExpect(status().isNotFound());
    }

    @Test
    void meIsStillServedByTheMeEndpoint() throws Exception {
        when(userService.findById(1)).thenReturn(Optional.of(user(1, "Somchai", "s@x.com")));

        mockMvc.perform(get("/api/users/me").requestAttr("userId", 1))
                .andExpect(jsonPath("$.email").value("s@x.com"));
    }
}
