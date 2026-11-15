package com.team.project.dto.meeting;

import com.team.project.entity.User;

public record MeetingCreatorResponse(int userId, String displayName) {

    public static MeetingCreatorResponse from(User user) {
        return new MeetingCreatorResponse(user.getUserId(), user.getDisplayName());
    }
}
