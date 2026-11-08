package com.team.project.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.team.project.entity.User;

/** What any logged-in user may see about another user when looking them up by TU id (e.g. before inviting them). */
public record UserLookupResponse(@JsonProperty("tu_id") String tu_id, String displayName) {

    public static UserLookupResponse from(User u) {
        return new UserLookupResponse(u.getTu_id(), u.getDisplayName());
    }
}
