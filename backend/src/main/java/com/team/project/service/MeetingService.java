package com.team.project.service;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
 * Project members can create and view meetings; only the creator or the project host can edit or cancel.
 * Dates are stored in UTC.
 */
@Service
@Transactional
public class MeetingService {

    private static final ZoneId BANGKOK = ZoneId.of("Asia/Bangkok");
    private static final Set<String> STATUSES = Set.of(Meeting.STATUS_SCHEDULED, Meeting.STATUS_CANCELLED);

    private final MeetingRepository meetingRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository memberRepository;

    public MeetingService(MeetingRepository meetingRepository, ProjectRepository projectRepository,
                          UserRepository userRepository, ProjectMemberRepository memberRepository) {
        this.meetingRepository = meetingRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    public Meeting create(int userId, CreateMeetingRequest req) {
        if (req == null || req.projectId() == null) {
            throw badRequest("projectId is required");
        }
        Project project = projectRepository.findById(req.projectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        requireMember(userId, project.getProjectId());
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing token"));

        Meeting meeting = new Meeting();
        meeting.setProject(project);
        meeting.setCreatedBy(creator);
        meeting.setMeetingTopic(validTopic(req.meetingTopic()));
        meeting.setMeetingDate(validFutureDate(req.meetingDate(), "meetingDate"));
        meeting.setMeetingDescription(validDescription(req.meetingDescription()));
        meeting.setMeetingLink(validLink(req.meetingLink()));
        return meetingRepository.save(meeting);
    }

    @Transactional(readOnly = true)
    public List<Meeting> search(int userId, MeetingSearchRequest req) {
        if (req == null || req.projectId() == null) {
            throw badRequest("projectId is required");
        }
        requireMember(userId, req.projectId());

        boolean monthYear = req.month() != null || req.year() != null;
        boolean range = req.from() != null || req.to() != null;
        LocalDateTime start = null;
        LocalDateTime end = null; // exclusive

        if (monthYear) {
            if (req.month() == null || req.year() == null) {
                throw badRequest("month and year must be sent together");
            }
            if (req.month() < 1 || req.month() > 12 || req.year() < 2000 || req.year() > 2100) {
                throw badRequest("month must be 1-12 and year 2000-2100");
            }
            if (range) {
                throw badRequest("from/to cannot be combined with month/year");
            }
            LocalDate first = LocalDate.of(req.year(), req.month(), 1);
            start = toUtc(first);
            end = toUtc(first.plusMonths(1));
        } else if (range) {
            if (req.from() != null && req.to() != null && req.to().isBefore(req.from())) {
                throw badRequest("to must not be before from");
            }
            if (req.from() != null) start = toUtc(req.from());
            if (req.to() != null) end = toUtc(req.to().plusDays(1));
        }

        String status = null;
        if (req.status() != null && !req.status().isBlank()) {
            status = req.status().trim().toUpperCase();
            if (!STATUSES.contains(status)) {
                throw badRequest("status must be SCHEDULED or CANCELLED");
            }
        }
        if (req.createdBy() != null && req.createdBy() <= 0) {
            throw badRequest("createdBy must be a positive integer");
        }
        String keyword = req.keyword() == null ? null : req.keyword().trim();
        if (keyword != null && keyword.length() > 100) {
            throw badRequest("keyword must be at most 100 characters");
        }

        List<Specification<Meeting>> parts = new ArrayList<>();
        int projectId = req.projectId();
        parts.add((r, q, cb) -> cb.equal(r.get("project").get("projectId"), projectId));
        if (start != null) {
            LocalDateTime s = start;
            parts.add((r, q, cb) -> cb.greaterThanOrEqualTo(r.<LocalDateTime>get("meetingDate"), s));
        }
        if (end != null) {
            LocalDateTime e = end;
            parts.add((r, q, cb) -> cb.lessThan(r.<LocalDateTime>get("meetingDate"), e));
        }
        if (status != null) {
            String st = status;
            parts.add((r, q, cb) -> cb.equal(r.get("status"), st));
        }
        if (req.createdBy() != null) {
            int by = req.createdBy();
            parts.add((r, q, cb) -> cb.equal(r.get("createdBy").get("userId"), by));
        }
        if (keyword != null && !keyword.isEmpty()) {
            char esc = '!';
            String like = "%" + keyword.toLowerCase()
                    .replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
            parts.add((r, q, cb) -> cb.like(cb.lower(r.<String>get("meetingTopic")), like, esc));
        }
        Specification<Meeting> spec = Specification.allOf(parts);
        Sort sort = Sort.by("meetingDate").ascending();

        if (monthYear) {
            return meetingRepository.findAll(spec, sort);
        }
        int page = req.page() == null ? 1 : req.page();
        int size = req.size() == null ? 20 : req.size();
        if (page < 1 || size < 1 || size > 100) {
            throw badRequest("page must be >= 1 and size must be 1-100");
        }
        return meetingRepository.findAll(spec, PageRequest.of(page - 1, size, sort)).getContent();
    }

    @Transactional(readOnly = true)
    public Meeting get(int userId, int meetingId) {
        Meeting meeting = find(meetingId);
        requireMember(userId, meeting.getProject().getProjectId());
        return meeting;
    }

    public Meeting update(int userId, int meetingId, UpdateMeetingRequest req) {
        if (req == null || (req.meetingTopic() == null && req.meetingDescription() == null
                && req.meetingDate() == null && req.meetingLink() == null)) {
            throw badRequest("At least one field must be provided");
        }
        Meeting meeting = find(meetingId);
        requireCreatorOrHost(userId, meeting);
        requireEditable(meeting, "edited");

        if (req.meetingTopic() != null) meeting.setMeetingTopic(validTopic(req.meetingTopic()));
        if (req.meetingDate() != null) meeting.setMeetingDate(validFutureDate(req.meetingDate(), "meetingDate"));
        if (req.meetingDescription() != null) meeting.setMeetingDescription(validDescription(req.meetingDescription()));
        if (req.meetingLink() != null) meeting.setMeetingLink(validLink(req.meetingLink()));
        return meetingRepository.save(meeting);
    }

    /** Soft cancel: the row is kept with status CANCELLED. */
    public Meeting cancel(int userId, int meetingId) {
        Meeting meeting = find(meetingId);
        requireCreatorOrHost(userId, meeting);
        requireEditable(meeting, "cancelled");
        meeting.cancel();
        return meetingRepository.save(meeting);
    }

    // ---------- helpers ----------

    private Meeting find(int meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found: " + meetingId));
    }

    private void requireMember(int userId, int projectId) {
        if (!memberRepository.existsByProject_ProjectIdAndUser_UserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project");
        }
    }

    private void requireCreatorOrHost(int userId, Meeting meeting) {
        boolean creator = meeting.getCreatedBy().getUserId().equals(userId);
        boolean host = meeting.getProject().getHost().getUserId().equals(userId);
        if (!creator && !host) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the meeting creator or the project host can do this");
        }
    }

    private void requireEditable(Meeting meeting, String action) {
        if (Meeting.STATUS_CANCELLED.equals(meeting.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Meeting " + meeting.getMeetingId() + " is already cancelled");
        }
        if (!meeting.getMeetingDate().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Meeting " + meeting.getMeetingId() + " has already passed and cannot be " + action);
        }
    }

    private static String validTopic(String topic) {
        String t = topic == null ? "" : topic.trim();
        if (t.isEmpty() || t.length() > 255) {
            throw badRequest("Validation failed: field 'meetingTopic' must be 1-255 characters");
        }
        return t;
    }

    private static LocalDateTime validFutureDate(OffsetDateTime date, String field) {
        if (date == null) {
            throw badRequest("Validation failed: field '" + field + "' is required");
        }
        LocalDateTime utc = date.withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
        if (!utc.isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw badRequest("Validation failed: field '" + field + "' must be in the future");
        }
        return utc;
    }

    /** Blank becomes null. */
    private static String validDescription(String description) {
        if (description == null || description.isBlank()) return null;
        if (description.length() > 2000) {
            throw badRequest("Validation failed: field 'meetingDescription' must be at most 2000 characters");
        }
        return description;
    }

    /** Blank becomes null; otherwise must be an https URL. */
    private static String validLink(String link) {
        if (link == null || link.isBlank()) return null;
        String l = link.trim();
        if (l.length() > 500) {
            throw badRequest("Validation failed: field 'meetingLink' must be at most 500 characters");
        }
        try {
            URI uri = new URI(l);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                throw new IllegalArgumentException();
            }
        } catch (Exception ex) {
            throw badRequest("Validation failed: field 'meetingLink' must be a valid https URL");
        }
        return l;
    }

    private static LocalDateTime toUtc(LocalDate bangkokDate) {
        return bangkokDate.atStartOfDay(BANGKOK).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
