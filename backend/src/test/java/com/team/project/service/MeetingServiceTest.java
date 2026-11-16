package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.meeting.CreateMeetingRequest;
import com.team.project.dto.meeting.MeetingSearchRequest;
import com.team.project.dto.meeting.UpdateMeetingRequest;
import com.team.project.entity.Meeting;
import com.team.project.entity.Project;
import com.team.project.entity.User;
import com.team.project.repository.MeetingRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;
import com.team.project.repository.UserRepository;

/**
 * Fixture: project 1 (host user 1, member user 2); user 3 is not a member of project 1.
 */
class MeetingServiceTest {

    private MeetingRepository meetingRepository;
    private ProjectRepository projectRepository;
    private UserRepository userRepository;
    private ProjectMemberRepository memberRepository;
    private MeetingService meetingService;

    private User host;
    private User member;
    private Project project1;
    private OffsetDateTime futureBangkok;
    private LocalDateTime futureUtc;

    @BeforeEach
    void setUp() {
        LocalDateTime created = LocalDateTime.of(2026, 1, 1, 0, 0);
        host = new User(1, "6609650001", "student", "Host User", "host@x.com", "hash", created);
        member = new User(2, "6609650002", "student", "Member User", "mem@x.com", "hash", created);
        project1 = new Project(1, "P1", "CS261", host, 0, created);

        futureBangkok = OffsetDateTime.now(ZoneOffset.ofHours(7)).plusDays(3).withNano(0);
        futureUtc = futureBangkok.withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();

        meetingRepository = mock(MeetingRepository.class);
        projectRepository = mock(ProjectRepository.class);
        userRepository = mock(UserRepository.class);
        memberRepository = mock(ProjectMemberRepository.class);
        meetingService = new MeetingService(meetingRepository, projectRepository, userRepository, memberRepository);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(userRepository.findById(1)).thenReturn(Optional.of(host));
        when(userRepository.findById(2)).thenReturn(Optional.of(member));
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2)).thenReturn(true);
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 3)).thenReturn(false);
        when(meetingRepository.save(any(Meeting.class))).thenAnswer(inv -> {
            Meeting m = inv.getArgument(0);
            if (m.getMeetingId() == null) {
                m.setMeetingId(10);
            }
            return m;
        });
    }

    private Meeting scheduledMeeting(int id, LocalDateTime utcDate) {
        return new Meeting(id, project1, host, "Sprint Sync", "Agenda", utcDate,
                "https://meet.example.com/1", Meeting.TYPE_MEETING, Meeting.STATUS_SCHEDULED,
                null, LocalDateTime.now(ZoneOffset.UTC), LocalDateTime.now(ZoneOffset.UTC));
    }

    @Test
    void createSavesMeetingInUtcForHost() {
        CreateMeetingRequest req = new CreateMeetingRequest(
                1, "  Sprint Review  ", "   ", futureBangkok, "  https://meet.example.com/room  ");

        Meeting saved = meetingService.create(1, req);

        assertEquals(10, saved.getMeetingId());
        assertEquals("Sprint Review", saved.getMeetingTopic());
        assertNull(saved.getMeetingDescription());
        assertEquals("https://meet.example.com/room", saved.getMeetingLink());
        assertEquals(futureUtc, saved.getMeetingDate());
        assertEquals(Meeting.STATUS_SCHEDULED, saved.getStatus());
        assertEquals(host, saved.getCreatedBy());
    }

    @Test
    void createThrows403WhenNonHostMemberCreatesMeeting() {
        CreateMeetingRequest req = new CreateMeetingRequest(1, "Sync", null, futureBangkok, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> meetingService.create(2, req));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(meetingRepository, never()).save(any());
    }

    @Test
    void createThrows404WhenProjectNotFound() {
        when(projectRepository.findById(999)).thenReturn(Optional.empty());
        CreateMeetingRequest req = new CreateMeetingRequest(999, "Sync", null, futureBangkok, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, req));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void createRejectsMissingTopicNullDatePastDateAndOversizedFields() {
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, null)).getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, new CreateMeetingRequest(null, "Topic", null, futureBangkok, null)))
                .getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, new CreateMeetingRequest(1, "   ", null, futureBangkok, null)))
                .getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, new CreateMeetingRequest(1, "Topic", null, null, null)))
                .getStatusCode());

        OffsetDateTime past = OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, new CreateMeetingRequest(1, "Topic", null, past, null)))
                .getStatusCode());

        String longTopic = "a".repeat(256);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, new CreateMeetingRequest(1, longTopic, null, futureBangkok, null)))
                .getStatusCode());

        String longLink = "https://example.com/" + "x".repeat(490);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, new CreateMeetingRequest(1, "Topic", null, futureBangkok, longLink)))
                .getStatusCode());

        String longDesc = "d".repeat(2001);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.create(1, new CreateMeetingRequest(1, "Topic", longDesc, futureBangkok, null)))
                .getStatusCode());
    }

    @Test
    void getAllowsMemberAndRejectsNonMemberOrMissingMeeting() {
        Meeting m = scheduledMeeting(10, futureUtc);
        when(meetingRepository.findById(10)).thenReturn(Optional.of(m));
        when(meetingRepository.findById(999)).thenReturn(Optional.empty());

        assertEquals(m, meetingService.get(2, 10));

        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class,
                () -> meetingService.get(3, 10));
        assertEquals(HttpStatus.FORBIDDEN, forbidden.getStatusCode());

        ResponseStatusException notFound = assertThrows(ResponseStatusException.class,
                () -> meetingService.get(1, 999));
        assertEquals(HttpStatus.NOT_FOUND, notFound.getStatusCode());
    }

    @SuppressWarnings("unchecked")
    @Test
    void searchValidatesParametersAndReturnsMeetingsForMember() {
        Meeting m = scheduledMeeting(10, futureUtc);
        when(meetingRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(m));
        when(meetingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(m)));

        List<Meeting> byMonth = meetingService.search(2,
                new MeetingSearchRequest(1, 12, 2026, null, null, "SCHEDULED", null, "Sprint", null, null));
        assertEquals(1, byMonth.size());

        List<Meeting> byPage = meetingService.search(2,
                new MeetingSearchRequest(1, null, null, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 31),
                        null, 1, null, 1, 20));
        assertEquals(1, byPage.size());

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> meetingService.search(3, new MeetingSearchRequest(1, null, null, null, null, null, null, null, null, null)))
                .getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.search(1, new MeetingSearchRequest(1, 12, null, null, null, null, null, null, null, null)))
                .getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.search(1, new MeetingSearchRequest(1, 13, 2026, null, null, null, null, null, null, null)))
                .getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.search(1, new MeetingSearchRequest(1, 12, 2026, LocalDate.of(2026, 12, 1), null, null, null, null, null, null)))
                .getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.search(1, new MeetingSearchRequest(1, null, null, LocalDate.of(2026, 12, 10), LocalDate.of(2026, 12, 1), null, null, null, null, null)))
                .getStatusCode());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.search(1, new MeetingSearchRequest(1, null, null, null, null, "UNKNOWN", null, null, null, null)))
                .getStatusCode());
    }

    @Test
    void updateEditsMeetingForHostAndRejectsInvalidStates() {
        Meeting m = scheduledMeeting(10, futureUtc);
        when(meetingRepository.findById(10)).thenReturn(Optional.of(m));

        OffsetDateTime newDate = futureBangkok.plusDays(2);
        Meeting updated = meetingService.update(1, 10,
                new UpdateMeetingRequest("Updated Topic", "", newDate, ""));

        assertEquals("Updated Topic", updated.getMeetingTopic());
        assertNull(updated.getMeetingDescription());
        assertNull(updated.getMeetingLink());
        assertEquals(newDate.withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime(), updated.getMeetingDate());

        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> meetingService.update(1, 10, new UpdateMeetingRequest(null, null, null, null)))
                .getStatusCode());

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> meetingService.update(2, 10, new UpdateMeetingRequest("Hack", null, null, null)))
                .getStatusCode());

        Meeting pastMeeting = scheduledMeeting(11, LocalDateTime.now(ZoneOffset.UTC).minusHours(1));
        when(meetingRepository.findById(11)).thenReturn(Optional.of(pastMeeting));
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> meetingService.update(1, 11, new UpdateMeetingRequest("Late Edit", null, null, null)))
                .getStatusCode());
    }

    @Test
    void cancelSoftCancelsForHostAndRejectsMemberOrAlreadyCancelled() {
        Meeting m = scheduledMeeting(10, futureUtc);
        when(meetingRepository.findById(10)).thenReturn(Optional.of(m));

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> meetingService.cancel(2, 10)).getStatusCode());

        Meeting cancelled = meetingService.cancel(1, 10);
        assertEquals(Meeting.STATUS_CANCELLED, cancelled.getStatus());
        assertNotNull(cancelled.getCancelledAt());

        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> meetingService.cancel(1, 10)).getStatusCode());
    }
}
