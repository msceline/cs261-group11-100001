package com.team.project.dto.meeting;

import java.time.OffsetDateTime;

/** meetingDescription and meetingLink are optional; the creator and status are set by the server. */
public record CreateMeetingRequest(Integer projectId, String meetingTopic, String meetingDescription,
                                   OffsetDateTime meetingDate, String meetingLink) {}
