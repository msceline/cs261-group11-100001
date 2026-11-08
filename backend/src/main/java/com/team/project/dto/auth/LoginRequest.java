package com.team.project.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public record LoginRequest(
        @JsonProperty("tu_id") @JsonAlias({"tuId", "studentId", "student_id", "username"}) String tu_id,
        String password
) {
    public String tuId() {
        return tu_id;
    }
}
