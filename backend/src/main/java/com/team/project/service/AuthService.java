package com.team.project.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.team.project.dto.auth.LoginRequest;
import com.team.project.dto.auth.LoginResponse;
import com.team.project.dto.auth.UserResponse;
import com.team.project.entity.User;
import com.team.project.security.JwtService;

@Service
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;
    private final TuAuthClient tuAuthClient;

    public AuthService(UserService userService, JwtService jwtService, TuAuthClient tuAuthClient) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.tuAuthClient = tuAuthClient;
    }

    /** Verifies the account with the TU API and creates the local user on first login. Empty when invalid. */
    public Optional<LoginResponse> login(LoginRequest req) {
        if (req == null || req.studentId() == null || req.password() == null) return Optional.empty();
        return tuAuthClient.verify(req.studentId(), req.password())
                .map(this::findOrCreate)
                .map(u -> new LoginResponse(jwtService.generateToken(u.getUserId()), UserResponse.from(u)));
    }

    public Optional<UserResponse> me(int userId) {
        return userService.findById(userId).map(UserResponse::from);
    }

    private User findOrCreate(TuAuthClient.TuUser tu) {
        return userService.findByStudentId(tu.username()).orElseGet(() -> {
            User u = new User();
            u.setStudentId(tu.username());
            u.setRole("employee".equalsIgnoreCase(tu.type()) ? "teacher" : "student");
            u.setDisplayName(tu.displayName());
            u.setEmail(tu.email());
            return userService.save(u);
        });
    }
}
