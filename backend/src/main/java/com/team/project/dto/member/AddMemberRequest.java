package com.team.project.dto.member;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

/** The user being added always joins the project with role "member". */
public record AddMemberRequest(
        @JsonProperty("tu_id") @JsonAlias({"tuId", "studentId", "student_id"}) String tu_id
) {
    public String tuId() {
        return tu_id;
    }

    public String studentId() {
        return tu_id;
    }
}
