package com.team.project.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.meeting.CreateMeetingRequest;
import com.team.project.dto.meeting.MeetingResponse;
import com.team.project.dto.meeting.MeetingSearchRequest;
import com.team.project.dto.meeting.UpdateMeetingRequest;
import com.team.project.service.MeetingService;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @PostMapping
    public ResponseEntity<MeetingResponse> create(@RequestAttribute("userId") int userId,
                                                  @RequestBody(required = false) CreateMeetingRequest request) {
        MeetingResponse created = MeetingResponse.from(meetingService.create(userId, request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<MeetingResponse> list(@RequestAttribute("userId") int userId,
                                      @ModelAttribute MeetingSearchRequest search) {
        return meetingService.search(userId, search).stream().map(MeetingResponse::from).toList();
    }

    @GetMapping("/{meetingId}")
    public MeetingResponse get(@RequestAttribute("userId") int userId, @PathVariable int meetingId) {
        return MeetingResponse.from(meetingService.get(userId, meetingId));
    }

    @PatchMapping("/{meetingId}")
    public MeetingResponse update(@RequestAttribute("userId") int userId, @PathVariable int meetingId,
                                  @RequestBody(required = false) UpdateMeetingRequest request) {
        return MeetingResponse.from(meetingService.update(userId, meetingId, request));
    }

    /** Soft cancel: responds with the meeting in status CANCELLED. */
    @DeleteMapping("/{meetingId}")
    public MeetingResponse cancel(@RequestAttribute("userId") int userId, @PathVariable int meetingId) {
        return MeetingResponse.from(meetingService.cancel(userId, meetingId));
    }
}
