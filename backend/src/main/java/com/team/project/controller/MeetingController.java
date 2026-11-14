package com.team.project.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.meeting.CreateMeetingRequest;
import com.team.project.dto.meeting.MeetingResponse;
import com.team.project.service.MeetingService;

@RestController
@RequestMapping("/api/projects/{projectId}/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @GetMapping
    public List<MeetingResponse> list(@RequestAttribute("userId") int userId, @PathVariable int projectId) {
        return meetingService.listForProject(userId, projectId);
    }

    @PostMapping
    public ResponseEntity<MeetingResponse> create(@RequestAttribute("userId") int userId,
                                                  @PathVariable int projectId,
                                                  @RequestBody CreateMeetingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(meetingService.create(userId, projectId, request));
    }
}
