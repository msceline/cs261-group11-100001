package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.team.project.dto.auth.LoginRequest;
import com.team.project.dto.auth.LoginResponse;
import com.team.project.dto.auth.UserResponse;
import com.team.project.entity.User;
import com.team.project.repository.UserRepository;
import com.team.project.security.JwtService;
import com.team.project.service.TuAuthClient.TuUser;

class AuthServiceTest {

    private JwtService jwtService;
    private UserRepository userRepository;
    private TuAuthClient tuAuthClient;
    private AuthService authService;

    private static User user(int id, String tuId, String role) {
        return new User(id, tuId, role, "User " + id, tuId + "@dome.tu.ac.th", null,
                LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @BeforeEach
    void setUp() {
        User student = user(1, "6609650001", "student");
        User student2 = user(2, "6609650002", "student");
        User teacher = user(4, "T00001", "teacher");

        userRepository = mock(UserRepository.class);
        for (User u : new User[] {student, student2, teacher}) {
            when(userRepository.findByStudentId(u.getStudentId())).thenReturn(Optional.of(u));
            when(userRepository.findById(u.getUserId())).thenReturn(Optional.of(u));
        }
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(99);
            return u;
        });

        tuAuthClient = mock(TuAuthClient.class);
        when(tuAuthClient.verify("6609650001", "password123"))
                .thenReturn(Optional.of(new TuUser("6609650001", "User 1", "6609650001@dome.tu.ac.th", "student")));
        when(tuAuthClient.verify("T00001", "password123"))
                .thenReturn(Optional.of(new TuUser("T00001", "User 4", "T00001@tu.ac.th", "employee")));
        when(tuAuthClient.verify("6609659999", "password123"))
                .thenReturn(Optional.of(new TuUser("6609659999", "ผู้ใช้ ใหม่", "6609659999@dome.tu.ac.th", "student")));
        when(tuAuthClient.verify("6609659998", "password123"))
                .thenReturn(Optional.of(new TuUser("6609659998", "อาจารย์ ใหม่", "new@tu.ac.th", "employee")));
        when(tuAuthClient.verify("6609650001", "wrong")).thenReturn(Optional.empty());

        jwtService = new JwtService("test-secret-test-secret-test-secret", 3600);
        authService = new AuthService(new UserService(userRepository), jwtService, tuAuthClient);
    }

    @Test
    void loginWithValidCredentialsReturnsTokenAndUser() {
        Optional<LoginResponse> result = authService.login(new LoginRequest("6609650001", "password123"));

        assertTrue(result.isPresent());
        assertEquals("6609650001", result.get().user().studentId());
        assertEquals(1, result.get().user().userId());
        assertEquals(1, jwtService.validateAndGetUserId(result.get().token()).getAsInt());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginResponseDoesNotLeakPassword() {
        LoginResponse response = authService.login(new LoginRequest("6609650001", "password123")).orElseThrow();

        assertFalse(response.user().toString().contains("password"));
    }

    @Test
    void loginRejectedByTuApiIsRejected() {
        assertTrue(authService.login(new LoginRequest("6609650001", "wrong")).isEmpty());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginForUnknownTuAccountIsRejected() {
        assertTrue(authService.login(new LoginRequest("0000000000", "password123")).isEmpty());
    }

    @Test
    void firstLoginCreatesLocalStudent() {
        UserResponse created = authService.login(new LoginRequest("6609659999", "password123")).orElseThrow().user();

        assertEquals(99, created.userId());
        assertEquals("6609659999", created.studentId());
        assertEquals("ผู้ใช้ ใหม่", created.displayName());
        assertEquals("6609659999@dome.tu.ac.th", created.email());
        assertEquals("student", created.role());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void firstLoginOfTuEmployeeCreatesTeacher() {
        assertEquals("teacher", authService.login(new LoginRequest("6609659998", "password123")).orElseThrow().user().role());
    }

    @Test
    void loginWithMissingFieldsIsRejected() {
        assertTrue(authService.login(null).isEmpty());
        assertTrue(authService.login(new LoginRequest(null, "password123")).isEmpty());
        assertTrue(authService.login(new LoginRequest("6609650001", null)).isEmpty());
        verify(tuAuthClient, never()).verify(any(), any());
    }

    @Test
    void meReturnsExistingUser() {
        Optional<UserResponse> me = authService.me(2);

        assertTrue(me.isPresent());
        assertEquals("6609650002", me.get().studentId());
    }

    @Test
    void meReturnsEmptyForUnknownUser() {
        assertTrue(authService.me(999).isEmpty());
    }

    @Test
    void loginResponseIncludesRole() {
        assertEquals("student", authService.login(new LoginRequest("6609650001", "password123")).orElseThrow().user().role());
        assertEquals("teacher", authService.login(new LoginRequest("T00001", "password123")).orElseThrow().user().role());
    }
}
