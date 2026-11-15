package com.team.project.dto.auth;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.team.project.entity.User;

public record UserResponse(int userId,
                           @JsonProperty("tu_id") String tu_id,
                           String displayName,
                           String email,
                           LocalDateTime createdAt,
                           String role) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getUserId(), u.getTu_id(), u.getDisplayName(), u.getEmail(), u.getCreatedAt(), u.getRole());
    }

    public String tuId() {
        return tu_id;
    }
}
