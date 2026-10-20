package com.team.project.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.auth.UserLookupResponse;
import com.team.project.dto.auth.UserResponse;
import com.team.project.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestAttribute("userId") int userId) {
        return userService.findById(userId)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(UserResponse.from(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found")));
    }

    /** Looks a user up by TU id (only name and id are returned); 404 when nobody with that id has logged in yet. */
    @GetMapping("/{tuId}")
    public ResponseEntity<?> getByTuId(@PathVariable String tuId) {
        return userService.findByTuId(tuId.trim())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(UserLookupResponse.from(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found")));
    }
}
