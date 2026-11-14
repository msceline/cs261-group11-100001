package com.team.project.dto.meeting;

import java.time.LocalDateTime;

public record CreateMeetingRequest(String topic, LocalDateTime dateTime, String location, String description) {}
