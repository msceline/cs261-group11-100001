package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.team.project.entity.User;
import com.team.project.repository.UserRepository;

class UserServiceTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        User u1 = new User(1, "6609650001", "student", "One", "one@x.com", "hash", LocalDateTime.of(2026, 1, 1, 0, 0));
        User u2 = new User(2, "6609650002", "student", "Two", "two@x.com", "hash", LocalDateTime.of(2026, 1, 1, 0, 0));
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByTu_id("6609650001")).thenReturn(Optional.of(u1));
        when(userRepository.findByTu_id("6609650001")).thenReturn(Optional.of(u1));
        when(userRepository.findById(2)).thenReturn(Optional.of(u2));
        userService = new UserService(userRepository);
    }

    @Test
    void findByTu_idReturnsUser() {
        assertEquals(1, userService.findByTu_id("6609650001").orElseThrow().getUserId());
    }

    @Test
    void findByTuIdReturnsUser() {
        assertEquals(1, userService.findByTuId("6609650001").orElseThrow().getUserId());
    }

    @Test
    void findByTuIdReturnsEmptyWhenMissing() {
        assertTrue(userService.findByTuId("nope").isEmpty());
    }

    @Test
    void findByIdReturnsUserOrEmpty() {
        assertEquals("6609650002", userService.findById(2).orElseThrow().getTu_id());
        assertTrue(userService.findById(999).isEmpty());
    }
}
