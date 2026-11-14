package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.meeting.CreateMeetingRequest;
import com.team.project.dto.meeting.MeetingResponse;
import com.team.project.entity.Meeting;
import com.team.project.entity.Project;
import com.team.project.entity.User;
import com.team.project.repository.MeetingRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;

class MeetingServiceTest {

    private MeetingRepository meetingRepository;
    private ProjectRepository projectRepository;
    private ProjectMemberRepository memberRepository;
    private MeetingService meetingService;
    private Project project;

    @BeforeEach
    void setUp() {
        User host = new User(1, "6609650001", "student", "Host", "host@tu.ac.th", null,
                LocalDateTime.of(2026, 1, 1, 0, 0));
        project = new Project(10, "Project", "CS261", host, 0, LocalDateTime.of(2026, 1, 1, 0, 0));
        meetingRepository = mock(MeetingRepository.class);
        projectRepository = mock(ProjectRepository.class);
        memberRepository = mock(ProjectMemberRepository.class);

        when(projectRepository.findById(10)).thenReturn(Optional.of(project));
        when(projectRepository.existsById(10)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(10, 1)).thenReturn(true);
        when(meetingRepository.save(any(Meeting.class))).thenAnswer(invocation -> {
            Meeting meeting = invocation.getArgument(0);
            meeting.setMeetingId(20);
            return meeting;
        });

        meetingService = new MeetingService(meetingRepository, projectRepository, memberRepository);
    }

    @Test
    void createStoresMeetingForProject() {
        LocalDateTime dateTime = LocalDateTime.of(2026, 11, 20, 14, 30);

        MeetingResponse created = meetingService.create(1, 10,
                new CreateMeetingRequest("  Planning  ", dateTime, "https://meet.example/room", "Details"));

        assertEquals(20, created.meetingId());
        assertEquals(10, created.projectId());
        assertEquals("Planning", created.topic());
        assertEquals(dateTime, created.dateTime());
        assertEquals("https://meet.example/room", created.location());
        assertEquals("Details", created.description());
    }

    @Test
    void listRequiresMembershipAndReturnsMeetings() {
        Meeting meeting = new Meeting(20, project, "Planning", LocalDateTime.of(2026, 11, 20, 14, 30),
                "Room 1", null, LocalDateTime.of(2026, 11, 1, 0, 0));
        when(meetingRepository.findByProject_ProjectIdOrderByDateTimeAsc(10)).thenReturn(List.of(meeting));

        assertEquals("Planning", meetingService.listForProject(1, 10).get(0).topic());
    }

    @Test
    void hostCanUpdateMeeting() {
        Meeting existing = new Meeting(20, project, "Old topic", LocalDateTime.of(2026, 11, 20, 14, 30),
                "Old room", "Old details", LocalDateTime.of(2026, 11, 1, 0, 0));
        when(meetingRepository.findByMeetingIdAndProject_ProjectId(20, 10)).thenReturn(Optional.of(existing));

        MeetingResponse updated = meetingService.update(1, 10, 20,
                new CreateMeetingRequest(" New topic ", LocalDateTime.of(2026, 11, 21, 15, 0),
                        " New room ", " New details "));

        assertEquals("New topic", updated.topic());
        assertEquals(LocalDateTime.of(2026, 11, 21, 15, 0), updated.dateTime());
        assertEquals("New room", updated.location());
        assertEquals("New details", updated.description());
        verify(meetingRepository).save(existing);
    }

    @Test
    void onlyHostCanUpdateMeeting() {
        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class,
                () -> meetingService.update(2, 10, 20,
                        new CreateMeetingRequest("Planning", LocalDateTime.now(), null, null)));

        assertEquals(HttpStatus.FORBIDDEN, HttpStatus.valueOf(forbidden.getStatusCode().value()));
        verify(meetingRepository, never()).save(any(Meeting.class));
    }

    @Test
    void hostCanDeleteMeeting() {
        Meeting existing = new Meeting(20, project, "Planning", LocalDateTime.of(2026, 11, 20, 14, 30),
                "Room 1", null, LocalDateTime.of(2026, 11, 1, 0, 0));
        when(meetingRepository.findByMeetingIdAndProject_ProjectId(20, 10)).thenReturn(Optional.of(existing));

        meetingService.delete(1, 10, 20);

        verify(meetingRepository).delete(existing);
    }

    @Test
    void onlyHostCanDeleteMeeting() {
        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class,
                () -> meetingService.delete(2, 10, 20));

        assertEquals(HttpStatus.FORBIDDEN, HttpStatus.valueOf(forbidden.getStatusCode().value()));
        verify(meetingRepository, never()).delete(any(Meeting.class));
    }

    @Test
    void createRejectsMissingFields() {
        ResponseStatusException missingTopic = assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, 10,
                        new CreateMeetingRequest("  ", LocalDateTime.now(), null, null)));
        assertEquals(HttpStatus.BAD_REQUEST, HttpStatus.valueOf(missingTopic.getStatusCode().value()));

        ResponseStatusException missingDate = assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, 10, new CreateMeetingRequest("Planning", null, null, null)));
        assertEquals(HttpStatus.BAD_REQUEST, HttpStatus.valueOf(missingDate.getStatusCode().value()));
    }

    @Test
    void onlyHostCanCreateMeetingEvenIfUserIsProjectMember() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(10, 2)).thenReturn(true);

        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class,
                () -> meetingService.create(2, 10,
                        new CreateMeetingRequest("Planning", LocalDateTime.of(2026, 11, 20, 14, 30), null, null)));
        assertEquals(HttpStatus.FORBIDDEN, HttpStatus.valueOf(forbidden.getStatusCode().value()));
        verify(meetingRepository, never()).save(any(Meeting.class));
    }
}
