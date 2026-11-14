package com.team.project.dto.meeting;

import java.time.LocalDateTime;

import com.team.project.entity.Meeting;

public record MeetingResponse(int meetingId, int projectId, String topic, LocalDateTime dateTime,
                              String location, String description) {

    public static MeetingResponse from(Meeting meeting) {
        return new MeetingResponse(meeting.getMeetingId(), meeting.getProject().getProjectId(),
                meeting.getTopic(), meeting.getDateTime(), meeting.getLocation(), meeting.getDescription());
    }
}
