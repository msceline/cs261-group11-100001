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
import com.team.project.service.TuStudentService;
import com.team.project.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final TuStudentService tuStudentService;

    public UserController(UserService userService, TuStudentService tuStudentService) {
        this.userService = userService;
        this.tuStudentService = tuStudentService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestAttribute("userId") int userId) {
        return userService.findById(userId)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(UserResponse.from(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found")));
    }

    /** Looks a student up in the TU directory by id (only id and name are returned); 404 when TU has no such student. */
    @GetMapping("/{tuId}")
    public ResponseEntity<?> getByTuId(@PathVariable String tuId) {
        return tuStudentService.lookup(tuId)
                .<ResponseEntity<?>>map(student -> ResponseEntity.ok(
                        new UserLookupResponse(student.username(), student.displayName())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Student not found")));
    }
}
