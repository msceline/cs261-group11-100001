package com.team.project.dto.meeting;

import java.time.OffsetDateTime;

/** Every field is optional (at least one required). "" clears meetingDescription / meetingLink. */
public record UpdateMeetingRequest(String meetingTopic, String meetingDescription,
                                   OffsetDateTime meetingDate, String meetingLink) {}
