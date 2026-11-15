package com.team.project.controller;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.security.JwtService;
import com.team.project.service.UserService;

@RestController
@RequestMapping("/api/dev")
@Profile("local")
public class MockAuthController {

    private final JwtService jwtService;
    private final UserService userService;

    public MockAuthController(
            JwtService jwtService,
            UserService userService) {
        this.jwtService = jwtService;
        this.userService = userService;
    }

    public record MockTokenRequest(Integer userId) {}

    @PostMapping("/mock-token")
    public ResponseEntity<?> createMockToken(
            @RequestBody MockTokenRequest request,
            HttpServletRequest httpRequest) {

        String remoteAddress = httpRequest.getRemoteAddr();

        if (!"127.0.0.1".equals(remoteAddress)
                && !"::1".equals(remoteAddress)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (request == null || request.userId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "userId is required"));
        }

        return userService.findById(request.userId())
                .<ResponseEntity<?>>map(user ->
                        ResponseEntity.ok(Map.of(
                                "token",
                                jwtService.generateToken(user.getUserId())
                        ))
                )
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("error", "User not found"))
                );
    }
}
