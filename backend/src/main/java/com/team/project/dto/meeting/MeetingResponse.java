package com.team.project.dto.meeting;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

import com.team.project.entity.Meeting;

/** Dates are stored in UTC and shown as +07:00 (Asia/Bangkok). */
public record MeetingResponse(int meetingId, int projectId, String meetingTopic, String meetingDescription,
                              OffsetDateTime meetingDate, String meetingLink, String status,
                              MeetingCreatorResponse createdBy, OffsetDateTime createdAt,
                              OffsetDateTime updatedAt, OffsetDateTime cancelledAt) {

    private static final ZoneId BANGKOK = ZoneId.of("Asia/Bangkok");

    public static MeetingResponse from(Meeting m) {
        return new MeetingResponse(
                m.getMeetingId(),
                m.getProject().getProjectId(),
                m.getMeetingTopic(),
                m.getMeetingDescription(),
                display(m.getMeetingDate()),
                m.getMeetingLink(),
                m.getStatus(),
                MeetingCreatorResponse.from(m.getCreatedBy()),
                display(m.getCreatedAt()),
                display(m.getUpdatedAt()),
                display(m.getCancelledAt()));
    }

    private static OffsetDateTime display(LocalDateTime utc) {
        return utc == null ? null : utc.atOffset(ZoneOffset.UTC).atZoneSameInstant(BANGKOK).toOffsetDateTime();
    }
}
