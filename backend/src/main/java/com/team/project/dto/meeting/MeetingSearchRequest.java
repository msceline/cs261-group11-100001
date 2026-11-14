package com.team.project.dto.meeting;

import java.time.LocalDate;

/** Query parameters of GET /api/meetings. */
public record MeetingSearchRequest(Integer projectId, Integer month, Integer year, LocalDate from, LocalDate to,
                                   String status, Integer createdBy, String keyword, Integer page, Integer size) {}
